from django.db import transaction
from django.db.models import Max, Q
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Materiel, Stock, MouvementMateriel
from .serializers import MaterielSerializer, StockSerializer, MouvementMaterielSerializer
from personnel.models import Brigade


# ============================================================
# Permissions par rôle (cf. tableau des rôles du cahier des charges)
# ============================================================
class IsAdminForWrite(permissions.BasePermission):
    """Lecture pour tous les connectés, écriture réservée au Chef de Service (ADMIN)."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and (user.is_superuser or user.role == 'ADMIN'))


class CanRegisterMouvement(permissions.BasePermission):
    """
    Lecture pour tous les connectés (queryset déjà scopé par rôle dans get_queryset).
    Écriture (créer un mouvement) réservée à ADMIN et CHEF_BRIGADE, conformément au
    cahier : "Chef de Brigade : crée du personnel, enregistre des mouvements".
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return user.is_superuser or user.role in ['ADMIN', 'CHEF_BRIGADE']

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if user.is_superuser or user.role == 'ADMIN':
            return True
        # Un Chef de Brigade ne modifie/supprime que ses propres mouvements,
        # ou ceux rattachés à sa brigade
        if user.role == 'CHEF_BRIGADE':
            if obj.createur_id == user.id:
                return True
            user_brigade = view._get_user_brigade(user)
            return bool(user_brigade) and obj.brigade_id == user_brigade.id
        return False


# ============================================================
# Matériel (catalogue) : lecture pour tous, écriture réservée à l'ADMIN
# ============================================================
class MaterielViewSet(viewsets.ModelViewSet):
    queryset = Materiel.objects.all()
    serializer_class = MaterielSerializer
    permission_classes = [IsAuthenticated, IsAdminForWrite]


# ============================================================
# Stock : lecture scopée par périmètre de rôle, écriture réservée à l'ADMIN
# (les évolutions normales du stock passent par les mouvements, pas par une
# modification manuelle directe, pour garder une traçabilité complète)
# ============================================================
class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated, IsAdminForWrite]

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
    def _close_matching_emprunt(self, retour):
        emprunt = (
            MouvementMateriel.objects
            .filter(
                type='EMPRUNT',
                materiel_id=retour.materiel_id,
                agent_concerner_id=retour.agent_concerner_id,
                statut__in=['EN_COURS', 'EN_RETARD'],
            )
            .order_by('-date_mouvement')
            .first()
        )
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

        # Un Chef de Brigade ne peut enregistrer un mouvement que pour sa propre brigade
        if not (user.is_superuser or user.role == 'ADMIN'):
            user_brigade = self._get_user_brigade(user)
            if not user_brigade:
                return Response(
                    {'error': "Aucune brigade n'est associée à votre compte"},
                    status=status.HTTP_403_FORBIDDEN
                )
            data['brigade'] = user_brigade.id

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

        with transaction.atomic():
            self.perform_create(serializer)
            mouvement = serializer.instance
            self._apply_stock_effect(mouvement)
            if mouvement.type == 'RETOUR':
                self._close_matching_emprunt(mouvement)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

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