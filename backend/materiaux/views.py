from django.db import transaction
from django.db.models import Max, Q
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Materiel, Stock, MouvementMateriel
from .serializers import MaterielSerializer, StockSerializer, MouvementMaterielSerializer
from personnel.models import Brigade
from journal.utils import log_action


# ============================================================
# Permissions par rôle (cf. tableau des rôles du cahier des charges)
# ============================================================
class IsAdminForWrite(permissions.BasePermission):
    """Lecture pour tous les connectés, écriture réservée au Chef de Service (ADMIN).
    Utilisé pour Stock : les écritures normales passent par les mouvements, pas
    par une modification manuelle directe, pour garder une traçabilité complète."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and (user.is_superuser or user.role == 'ADMIN'))


class IsAdminOrChefSectionForWrite(permissions.BasePermission):
    """Lecture pour tous les connectés, écriture réservée à ADMIN et Chef de Section."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and (user.is_superuser or user.role in ['ADMIN', 'CHEF_SECTION']))


class CanRegisterMouvement(permissions.BasePermission):
    """
    Lecture pour tous les connectés (queryset déjà scopé par rôle dans get_queryset).
    Écriture (créer un mouvement) réservée à ADMIN, CHEF_SECTION et CHEF_BRIGADE
    (le Chef de Section a aussi ce pouvoir sur sa section — cf. SectionMouvements.jsx).
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return user.is_superuser or user.role in ['ADMIN', 'CHEF_SECTION', 'CHEF_BRIGADE', 'GL', 'CN']

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if user.is_superuser or user.role == 'ADMIN':
            return True
        if user.role == 'CHEF_SECTION':
            return bool(user.section) and obj.brigade_id is not None and obj.brigade.section_id == user.section_id
        # Un Chef de Brigade ne modifie/supprime que ses propres mouvements,
        # ou ceux rattachés à sa brigade
        if user.role == 'CHEF_BRIGADE':
            if obj.createur_id == user.id:
                return True
            user_brigade = view._get_user_brigade(user)
            return bool(user_brigade) and obj.brigade_id == user_brigade.id
        # GL/CN : peuvent seulement retirer (DELETE) leur propre demande tant
        # qu'elle est encore EN ATTENTE (annuler une demande non traitée) —
        # jamais la valider/rejeter eux-mêmes, c'est le rôle du chef.
        if user.role in ['GL', 'CN']:
            if view.action in ['valider_demande', 'rejeter_demande']:
                return False
            return obj.createur_id == user.id and obj.statut == 'DEMANDE'
        return False


# ============================================================
# Matériel (catalogue) : lecture pour tous, écriture réservée à l'ADMIN
# ============================================================
class MaterielViewSet(viewsets.ModelViewSet):
    queryset = Materiel.objects.all()
    serializer_class = MaterielSerializer
    permission_classes = [IsAuthenticated, IsAdminOrChefSectionForWrite]

    def perform_create(self, serializer):
        super().perform_create(serializer)
        log_action(self.request, 'MATERIEL_CREE', cible=serializer.instance.nom)

    def perform_update(self, serializer):
        super().perform_update(serializer)
        log_action(self.request, 'MATERIEL_MODIFIE', cible=serializer.instance.nom)

    def perform_destroy(self, instance):
        nom = instance.nom
        super().perform_destroy(instance)
        log_action(self.request, 'MATERIEL_SUPPRIME', cible=nom)


# ============================================================
# Stock : lecture scopée par périmètre de rôle, écriture réservée à l'ADMIN
# (les évolutions normales du stock passent par les mouvements, pas par une
# modification manuelle directe, pour garder une traçabilité complète)
# ============================================================
class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated, IsAdminForWrite]

    def _desc(self, st):
        lieu = f"Brigade {st.brigade.nom}" if st.brigade_id else 'Stock central'
        return f"{st.materiel.nom} ({st.etat}) — {lieu}"

    def perform_create(self, serializer):
        super().perform_create(serializer)
        st = serializer.instance
        log_action(self.request, 'STOCK_MODIFIE', cible=self._desc(st), detail=f"Création du stock : {st.quantite}")

    def perform_update(self, serializer):
        avant = serializer.instance.quantite
        super().perform_update(serializer)
        st = serializer.instance
        log_action(self.request, 'STOCK_MODIFIE', cible=self._desc(st), detail=f"Quantité : {avant} → {st.quantite}")

    def _get_user_brigade(self, user):
        if user.brigade:
            return user.brigade
        return Brigade.objects.filter(chef_brigade=user).first()

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action != 'list':
            return qs
        user = self.request.user
        if not user.is_authenticated:
            return qs.none()
        if user.is_superuser or user.role == 'ADMIN':
            return qs
        if user.role == 'CHEF_SECTION':
            if not user.section:
                return qs.none()
            # Sa section : les brigades de la section, + le dépôt central (brigade=null)
            return qs.filter(Q(brigade__section=user.section) | Q(brigade__isnull=True))
        if user.role == 'CHEF_BRIGADE':
            user_brigade = self._get_user_brigade(user)
            if not user_brigade:
                return qs.none()
            return qs.filter(brigade__in=[user_brigade.id, None])
        # GL / CN : consultent le disponible de leur propre brigade + le dépôt central
        if user.brigade:
            return qs.filter(brigade__in=[user.brigade_id, None])
        return qs.none()


# ============================================================
# Mouvements de matériel : le cœur du projet
# ============================================================
class MouvementMaterielViewSet(viewsets.ModelViewSet):
    queryset = MouvementMateriel.objects.all()
    serializer_class = MouvementMaterielSerializer
    permission_classes = [IsAuthenticated, CanRegisterMouvement]

    def _get_user_brigade(self, user):
        if user.brigade:
            return user.brigade
        return Brigade.objects.filter(chef_brigade=user).first()

    # ─── Périmètre de visibilité par rôle ───
    def get_queryset(self):
        qs = super().get_queryset().order_by('-date_mouvement', '-created_at')
        if self.action != 'list':
            return qs
        user = self.request.user
        if not user.is_authenticated:
            return qs.none()
        if user.is_superuser or user.role == 'ADMIN':
            return qs
        if user.role == 'CHEF_SECTION':
            if not user.section:
                return qs.none()
            return qs.filter(brigade__section=user.section)
        if user.role == 'CHEF_BRIGADE':
            user_brigade = self._get_user_brigade(user)
            if not user_brigade:
                return qs.none()
            return qs.filter(Q(brigade=user_brigade) | Q(brigade_destination=user_brigade))
        # GL / CN : seulement leur propre historique d'emprunt
        return qs.filter(agent_concerner=user)

    # ─── Génération du numéro MVT-{année}-{séquence} ───
    def _generate_numero(self):
        year = timezone.now().year
        prefix = f"MVT-{year}-"
        last = (
            MouvementMateriel.objects
            .filter(numero__startswith=prefix)
            .aggregate(Max('numero'))['numero__max']
        )
        last_num = int(last.split('-')[-1]) if last else 0
        return f"{prefix}{last_num + 1:04d}"

    # ─── Mise à jour automatique du stock (tâche 44) ───
    @staticmethod
    def _adjust_stock(materiel_id, etat, brigade_id, delta):
        stock, _ = Stock.objects.select_for_update().get_or_create(
            materiel_id=materiel_id, etat=etat, brigade_id=brigade_id,
            defaults={'quantite': 0}
        )
        stock.quantite = max(0, stock.quantite + delta)
        stock.save()

    @staticmethod
    def _set_stock(materiel_id, etat, brigade_id, quantite):
        stock, _ = Stock.objects.select_for_update().get_or_create(
            materiel_id=materiel_id, etat=etat, brigade_id=brigade_id,
            defaults={'quantite': 0}
        )
        stock.quantite = max(0, quantite)
        stock.save()

    def _apply_stock_effect(self, mouvement):
        m = mouvement
        if m.type == 'APPROVISIONNEMENT':
            self._adjust_stock(m.materiel_id, m.etat, m.brigade_id, +m.quantite)
        elif m.type == 'REBUT':
            self._adjust_stock(m.materiel_id, m.etat, m.brigade_id, -m.quantite)
        elif m.type == 'TRANSFERT':
            self._adjust_stock(m.materiel_id, m.etat, m.brigade_id, -m.quantite)
            self._adjust_stock(m.materiel_id, m.etat, m.brigade_destination_id, +m.quantite)
        elif m.type == 'INVENTAIRE':
            self._set_stock(m.materiel_id, m.etat, m.brigade_id, m.quantite)
        # EMPRUNT / RETOUR / REPARATION : ne changent pas la quantité physique du
        # Stock. La disponibilité ("emprunté", "en réparation") est dérivée en
        # temps réel via les mouvements actifs (statut EN_COURS / EN_RETARD),
        # pas stockée séparément — cf. ServiceStock.jsx / ServiceDashboard.jsx.

    # ─── RETOUR : referme automatiquement l'EMPRUNT ouvert correspondant ───
    @staticmethod
    def _find_matching_emprunt(materiel_id, agent_id):
        return (
            MouvementMateriel.objects
            .filter(
                type='EMPRUNT',
                materiel_id=materiel_id,
                agent_concerner_id=agent_id,
                statut__in=['EN_COURS', 'EN_RETARD'],
            )
            .order_by('-date_mouvement')
            .first()
        )

    def _close_matching_emprunt(self, retour):
        emprunt = self._find_matching_emprunt(retour.materiel_id, retour.agent_concerner_id)
        if emprunt:
            emprunt.statut = 'RETOURNE'
            emprunt.date_retour_effective = retour.date_mouvement
            emprunt.save()

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        user = request.user

        # Le créateur est toujours l'utilisateur connecté, jamais une valeur du client
        data['createur'] = user.id
        # Le numéro est toujours généré côté serveur, jamais fourni par le client
        data['numero'] = self._generate_numero()

        # Un Chef de Brigade ne peut enregistrer un mouvement que pour sa propre brigade.
        # Un Chef de Section peut choisir n'importe quelle brigade de sa section,
        # mais pas en dehors. Un GL/CN ne peut que DEMANDER un emprunt pour lui-même,
        # dans sa propre brigade, en attente de validation par son Chef de Brigade.
        if user.role == 'CHEF_BRIGADE' and not user.is_superuser:
            user_brigade = self._get_user_brigade(user)
            if not user_brigade:
                return Response(
                    {'error': "Aucune brigade n'est associée à votre compte"},
                    status=status.HTTP_403_FORBIDDEN
                )
            data['brigade'] = user_brigade.id
        elif user.role == 'CHEF_SECTION' and not user.is_superuser:
            if not user.section:
                return Response(
                    {'error': "Aucune section n'est associée à votre compte"},
                    status=status.HTTP_403_FORBIDDEN
                )
            brigade_id = data.get('brigade')
            if not brigade_id or not Brigade.objects.filter(id=brigade_id, section_id=user.section_id).exists():
                return Response(
                    {'error': "La brigade choisie doit appartenir à votre section"},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.role in ['GL', 'CN'] and not user.is_superuser:
            if data.get('type') != 'EMPRUNT':
                return Response(
                    {'error': "Vous ne pouvez que demander un emprunt de matériel"},
                    status=status.HTTP_403_FORBIDDEN
                )
            if not user.brigade:
                return Response(
                    {'error': "Aucune brigade n'est associée à votre compte"},
                    status=status.HTTP_403_FORBIDDEN
                )
            data['brigade'] = user.brigade
            data['agent_concerner'] = user.id
            data['statut'] = 'DEMANDE'  # jamais actif directement : en attente de validation

        movement_type = data.get('type')
        if movement_type in ['APPROVISIONNEMENT', 'TRANSFERT', 'REBUT', 'INVENTAIRE'] and not data.get('etat'):
            return Response(
                {'error': f"Le champ 'état' est obligatoire pour un mouvement de type {movement_type}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if movement_type == 'TRANSFERT' and not data.get('brigade_destination'):
            return Response(
                {'error': "La brigade de destination est obligatoire pour un TRANSFERT"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Un retour ne peut jamais être daté avant (ou le même jour que) l'emprunt qu'il referme
        if serializer.validated_data.get('type') == 'RETOUR':
            vd = serializer.validated_data
            agent = vd.get('agent_concerner')
            emprunt = self._find_matching_emprunt(vd['materiel'].id, agent.id if agent else None)
            if emprunt:
                d_retour = vd.get('date_mouvement') or timezone.now().date()
                if hasattr(d_retour, 'date'):
                    d_retour = d_retour.date()
                if d_retour <= emprunt.date_mouvement:
                    return Response(
                        {'error': f"La date de retour doit être après la date d'emprunt "
                                  f"({emprunt.date_mouvement.strftime('%d/%m/%Y')})."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        with transaction.atomic():
            self.perform_create(serializer)
            mouvement = serializer.instance
            self._apply_stock_effect(mouvement)
            if mouvement.type == 'RETOUR':
                self._close_matching_emprunt(mouvement)

        lieu = f"Brigade {mouvement.brigade.nom}" if mouvement.brigade_id else 'Service'
        log_action(request, 'MOUVEMENT_CREE', cible=mouvement.numero,
                   detail=f"{mouvement.type} — {mouvement.materiel.nom} × {mouvement.quantite} — {lieu} (statut : {mouvement.statut})")
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_destroy(self, instance):
        numero, info = instance.numero, f"{instance.type} — {instance.materiel.nom} × {instance.quantite}"
        super().perform_destroy(instance)
        log_action(self.request, 'MOUVEMENT_SUPPRIME', cible=numero, detail=info)

    # ─── Détection automatique des retards (tâche 46) ───
    # Auto-corrective à chaque liste : pas besoin d'attendre un cron pour que
    # l'état soit juste (utile pendant le développement / la démo). Une tâche
    # planifiée (management command ci-joint) reste recommandée en production.
    def list(self, request, *args, **kwargs):
        MouvementMateriel.objects.filter(
            type='EMPRUNT',
            statut='EN_COURS',
            date_retour_prevue__lt=timezone.now().date(),
        ).update(statut='EN_RETARD')
        return super().list(request, *args, **kwargs)

    # ─── Valider une demande d'emprunt (GL/CN → Chef de Brigade/Section/ADMIN) ───
    @action(detail=True, methods=['patch'])
    def valider_demande(self, request, pk=None):
        mouvement = self.get_object()  # déclenche has_object_permission (périmètre + rôle)
        if mouvement.statut != 'DEMANDE':
            return Response(
                {'error': "Ce mouvement n'est pas une demande en attente"},
                status=status.HTTP_400_BAD_REQUEST
            )
        mouvement.statut = 'EN_COURS'
        mouvement.save()
        log_action(request, 'DEMANDE_VALIDEE', cible=mouvement.numero,
                   detail=f"{mouvement.materiel.nom} × {mouvement.quantite}")
        return Response({'status': 'demande validée'})

    # ─── Rejeter une demande d'emprunt ───
    @action(detail=True, methods=['patch'])
    def rejeter_demande(self, request, pk=None):
        mouvement = self.get_object()
        if mouvement.statut != 'DEMANDE':
            return Response(
                {'error': "Ce mouvement n'est pas une demande en attente"},
                status=status.HTTP_400_BAD_REQUEST
            )
        mouvement.statut = 'REJETEE'
        mouvement.save()
        log_action(request, 'DEMANDE_REJETEE', cible=mouvement.numero,
                   detail=f"{mouvement.materiel.nom} × {mouvement.quantite}")
        return Response({'status': 'demande rejetée'})