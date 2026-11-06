from django.shortcuts import render
from rest_framework import viewsets, status, serializers, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.contrib.auth import get_user_model
from django.utils import timezone
from .serializers import UtilisateurSerializer
from personnel.models import Brigade
from journal.utils import log_action
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


# ============================================================
# 0. Permission custom : self, superuser, ou supérieur hiérarchique direct
# ============================================================
class IsSelfOrHierarchyOrAdmin(permissions.BasePermission):
    """
    Autorise l'action sur un compte utilisateur si :
    - méthode sûre (GET/HEAD/OPTIONS), OU
    - superuser Django (accès technique total, indépendant du rôle métier), OU
    - l'utilisateur modifie son propre compte, OU
    - l'utilisateur est le supérieur hiérarchique DIRECT de la cible
      (Chef de Service → Chef de Section → Chef de Brigade → GL/CN)
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if user.is_superuser:
            return True
        if obj.id == user.id:
            return True
        return view._user_can_validate(user, obj)


# ============================================================
# 1. Custom JWT Serializer pour bloquer EN_ATTENTE / REJETE
# ============================================================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # super().validate() effectue déjà l'authenticate() en interne
        # et remplit self.user. Pas besoin (et surtout pas bon) de
        # ré-authentifier nous-mêmes avant : ça double le coût du
        # hachage du mot de passe (~1s x2) à chaque login.
        data = super().validate(attrs)

        if self.user.statut == 'EN_ATTENTE':
            raise serializers.ValidationError(
                "Votre compte est en attente de validation par votre supérieur. Veuillez patienter."
            )
        if self.user.statut == 'REJETE':
            raise serializers.ValidationError(
                "Votre compte a été rejeté. Contactez votre supérieur."
            )

        log_action(self.context.get('request'), 'CONNEXION', cible=str(self.user), detail='Connexion réussie', user=self.user)
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# ============================================================
# 2. ViewSet Utilisateur
# ============================================================
class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UtilisateurSerializer

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [AllowAny]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsSelfOrHierarchyOrAdmin]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    # ─── Restreint la liste au périmètre du rôle connecté ───
    # Chef Service : tout | Chef Section : sa section | Chef Brigade : sa brigade | GL/CN : lui-même
    def get_queryset(self):
        qs = super().get_queryset()
        if self.action != 'list':
            # retrieve/update/destroy restent gérés par IsSelfOrHierarchyOrAdmin (object-level)
            return qs

        user = self.request.user
        if not user.is_authenticated:
            return qs.none()
        if user.is_superuser or user.role == 'ADMIN':
            return qs
        if user.role == 'CHEF_SECTION':
            return qs.filter(section=user.section) if user.section else qs.none()
        if user.role == 'CHEF_BRIGADE':
            user_brigade = self._get_user_brigade(user)
            return qs.filter(brigade=user_brigade) if user_brigade else qs.none()
        # GL / CN : périmètre = lui-même uniquement
        return qs.filter(id=user.id)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        # Un seul chemin de création de compte : l'auto-inscription publique
        # (Register.jsx). On ne fait confiance à aucune donnée sensible envoyée
        # par le client : le rôle ADMIN est interdit et le statut est toujours
        # forcé à EN_ATTENTE, quoi que le client tente d'envoyer.
        if data.get('role') not in ['CHEF_SECTION', 'CHEF_BRIGADE', 'GL', 'CN']:
            return Response(
                {'error': "Rôle non autorisé pour l'inscription"},
                status=status.HTTP_403_FORBIDDEN
            )
        data['statut'] = 'EN_ATTENTE'

        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            print("❌ Erreurs de validation :", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        nouveau = serializer.instance
        log_action(request, 'INSCRIPTION', cible=self._nom(nouveau),
                   detail=f"Demande d'inscription ({nouveau.role}) en attente de validation", user=nouveau)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    # ─── Modification : uniquement son propre profil ───
    # Un supérieur peut SUPPRIMER le compte de son subordonné direct ou changer son
    # statut (actif / suspendu / archivé), mais pas modifier ses informations
    # personnelles (nom, prénom, email, rôle, section, brigade...).
    def update(self, request, *args, **kwargs):
        target = self.get_object()
        if target.id != request.user.id and not request.user.is_superuser:
            champs = set(request.data.keys())
            if not champs or not champs.issubset({'statut'}):
                return Response(
                    {'error': "Vous ne pouvez pas modifier les informations d'un autre compte. Vous pouvez uniquement changer son statut ou le supprimer."},
                    status=status.HTTP_403_FORBIDDEN
                )
        ancien_statut = target.statut
        reponse = super().update(request, *args, **kwargs)
        if 200 <= reponse.status_code < 300:
            target.refresh_from_db()
            if target.statut != ancien_statut:
                log_action(request, 'STATUT_COMPTE', cible=self._nom(target),
                           detail=f"Statut : {ancien_statut} → {target.statut}")
        return reponse

    def perform_destroy(self, instance):
        nom, role = self._nom(instance), instance.role
        instance.delete()
        log_action(self.request, 'SUPPRESSION_COMPTE', cible=nom, detail=f"Compte {role} supprimé")

    @staticmethod
    def _nom(u):
        return f"{getattr(u, 'prenom', '') or ''} {getattr(u, 'nom', '') or ''}".strip() or str(u)

    # ─── Brigade "effective" d'un chef, même si le FK inverse n'a pas été renseigné ───
    def _get_user_brigade(self, user):
        if user.brigade:
            return user.brigade
        return Brigade.objects.filter(chef_brigade=user).first()

    # ─── Vérification des droits hiérarchiques (supérieur direct uniquement) ───
    def _user_can_validate(self, user, target_user):
        if user.is_superuser:
            return True

        # Chef de Service (ADMIN) → valide uniquement les Chefs de Section
        if user.role == 'ADMIN':
            return target_user.role == 'CHEF_SECTION'

        # Chef de Section → valide uniquement les Chefs de Brigade de sa section
        if user.role == 'CHEF_SECTION':
            if target_user.role != 'CHEF_BRIGADE':
                return False
            if not user.section:
                return False
            return target_user.section == user.section

        # Chef de Brigade → valide uniquement les GL/CN de sa brigade
        if user.role == 'CHEF_BRIGADE':
            if target_user.role not in ['GL', 'CN']:
                return False
            user_brigade = self._get_user_brigade(user)
            if not user_brigade:
                return False
            return target_user.brigade == user_brigade

        return False

    # ─── Valider un compte ───
    @action(detail=True, methods=['patch'])
    def valider(self, request, pk=None):
        user = request.user
        target = self.get_object()
        if target.statut != 'EN_ATTENTE':
            return Response({'error': 'Cet utilisateur n\'est pas en attente'}, status=status.HTTP_400_BAD_REQUEST)
        if not self._user_can_validate(user, target):
            return Response({'error': 'Vous n\'avez pas la permission de valider cet utilisateur'}, status=status.HTTP_403_FORBIDDEN)
        target.statut = 'ACTIF'
        target.date_validation = timezone.now()
        target.save()
        log_action(request, 'VALIDATION_COMPTE', cible=self._nom(target), detail=f"Compte {target.role} validé")
        return Response({'status': 'utilisateur validé'})

    # ─── Rejeter un compte ───
    @action(detail=True, methods=['patch'])
    def rejeter(self, request, pk=None):
        user = request.user
        target = self.get_object()
        if target.statut != 'EN_ATTENTE':
            return Response({'error': 'Cet utilisateur n\'est pas en attente'}, status=status.HTTP_400_BAD_REQUEST)
        if not self._user_can_validate(user, target):
            return Response({'error': 'Vous n\'avez pas la permission de rejeter cet utilisateur'}, status=status.HTTP_403_FORBIDDEN)
        target.statut = 'REJETE'
        target.save()
        log_action(request, 'REJET_COMPTE', cible=self._nom(target), detail=f"Compte {target.role} rejeté")
        return Response({'status': 'utilisateur rejeté'})

    # ─── Changer le mot de passe ───
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not old_password or not new_password:
            return Response(
                {'error': 'Veuillez fournir l\'ancien et le nouveau mot de passe'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not user.check_password(old_password):
            return Response(
                {'error': 'Ancien mot de passe incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(new_password)
        user.save()
        log_action(request, 'MDP_CHANGE', cible=self._nom(user), detail='Mot de passe modifié par son propriétaire')
        return Response({'status': 'Mot de passe mis à jour avec succès'})


# ============================================================
# 3. Vue "Me" pour récupérer l'utilisateur connecté
# ============================================================
class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializer = UtilisateurSerializer(request.user)
        return Response(serializer.data)