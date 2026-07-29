from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.contrib.auth import get_user_model
from .serializers import UtilisateurSerializer
from django.utils import timezone

# Modèles nécessaires pour la validation hiérarchique
from personnel.models import Section, Brigade  # <-- correction importante

User = get_user_model()

class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UtilisateurSerializer

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [AllowAny]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("❌ Erreurs de validation :", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def _user_can_validate(self, user, target_user):
        if user.role == 'ADMIN':
            return True
        if user.role == 'CHEF_SECTION':
            if not user.section:
                return False
            if target_user.role in ['CHEF_BRIGADE', 'GL', 'CN']:
                return target_user.section == user.section
            return False
        if user.role == 'CHEF_BRIGADE':
            if not user.brigade:
                return False
            if target_user.role in ['GL', 'CN']:
                return target_user.brigade == user.brigade
            return False
        return False

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
        return Response({'status': 'utilisateur validé'})

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
        return Response({'status': 'utilisateur rejeté'})

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not old_password or not new_password:
            return Response({'error': 'Veuillez fournir l\'ancien et le nouveau mot de passe'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.check_password(old_password):
            return Response({'error': 'Ancien mot de passe incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'status': 'Mot de passe mis à jour avec succès'})

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializer = UtilisateurSerializer(request.user)
        return Response(serializer.data)