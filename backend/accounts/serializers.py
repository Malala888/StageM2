from rest_framework import serializers
from .models import Utilisateur
from personnel.models import Section, Brigade

class UtilisateurSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    section = serializers.PrimaryKeyRelatedField(
        queryset=Section.objects.all(),
        required=False,
        allow_null=True
    )
    brigade = serializers.PrimaryKeyRelatedField(
        queryset=Brigade.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Utilisateur
        fields = [
            'id', 'email', 'nom', 'prenom', 'role', 'poste', 'statut',
            'section', 'brigade', 'date_inscription', 'date_validation',
            'password'
        ]
        read_only_fields = ['date_inscription', 'date_validation']

    def create(self, validated_data):
        password = validated_data.pop('password')
        email = validated_data.pop('email')
        nom = validated_data.pop('nom')
        prenom = validated_data.pop('prenom')
        user = Utilisateur.objects.create_user(
            email=email,
            nom=nom,
            prenom=prenom,
            password=password,
            **validated_data
        )
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance