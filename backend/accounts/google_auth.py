"""Connexion avec Google.

Le frontend envoie l'access_token Google ; on vérifie auprès de Google qu'il a bien
été émis pour NOTRE application, puis on connecte l'utilisateur correspondant à
l'email. Aucun compte n'est créé ici : la personne doit déjà avoir un compte
validé par son supérieur (circuit Register -> validation).
"""
import json
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def _tokeninfo(access_token):
    url = 'https://oauth2.googleapis.com/tokeninfo?' + urllib.parse.urlencode({'access_token': access_token})
    with urllib.request.urlopen(url, timeout=8) as resp:
        return json.loads(resp.read().decode('utf-8'))


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        if not client_id:
            return Response({'error': "La connexion Google n'est pas configurée sur le serveur."},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        access_token = request.data.get('access_token')
        if not access_token:
            return Response({'error': 'Jeton Google manquant.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            info = _tokeninfo(access_token)
        except (urllib.error.URLError, ValueError):
            return Response({'error': 'Jeton Google invalide ou expiré.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Le jeton doit avoir été émis pour notre application
        if info.get('aud') != client_id and info.get('azp') != client_id:
            return Response({'error': 'Jeton Google non destiné à cette application.'},
                            status=status.HTTP_401_UNAUTHORIZED)
        if str(info.get('email_verified')).lower() != 'true' or not info.get('email'):
            return Response({'error': "L'email Google n'est pas vérifié."}, status=status.HTTP_401_UNAUTHORIZED)

        user = User.objects.filter(email__iexact=info['email']).first()
        if not user:
            return Response(
                {'error': "Aucun compte ne correspond à cet email Google. Créez d'abord un compte (il sera validé par votre supérieur)."},
                status=status.HTTP_404_NOT_FOUND)

        if user.statut == 'EN_ATTENTE':
            return Response({'error': 'Votre compte est en attente de validation par votre supérieur. Veuillez patienter.'},
                            status=status.HTTP_403_FORBIDDEN)
        if user.statut != 'ACTIF' or not user.is_active:
            return Response({'error': "Votre compte n'est pas actif. Contactez votre supérieur."},
                            status=status.HTTP_403_FORBIDDEN)

        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        refresh = RefreshToken.for_user(user)
        return Response({'refresh': str(refresh), 'access': str(refresh.access_token)})