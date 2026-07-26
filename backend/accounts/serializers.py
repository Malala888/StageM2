from rest_framework import serializers
from .models import Utilisateur

class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'email', 'nom', 'prenom', 'role', 'poste', 'statut', 'section', 'brigade', 'date_inscription', 'date_validation']
        read_only_fields = ['date_inscription', 'date_validation']