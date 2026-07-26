from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from .serializers import UtilisateurSerializer
from django.utils import timezone

User = get_user_model()

class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAdminUser]
        return super().get_permissions()

    @action(detail=True, methods=['patch'])
    def valider(self, request, pk=None):
        user = self.get_object()
        if user.statut != 'EN_ATTENTE':
            return Response({'error': 'Utilisateur non en attente'}, status=status.HTTP_400_BAD_REQUEST)
        user.statut = 'ACTIF'
        user.date_validation = timezone.now()
        user.save()
        return Response({'status': 'utilisateur validé'})

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UtilisateurSerializer(request.user)
        return Response(serializer.data)