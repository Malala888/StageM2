from rest_framework import serializers
from .models import Materiel, Stock, MouvementMateriel

class MaterielSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materiel
        fields = '__all__'

class StockSerializer(serializers.ModelSerializer):
    materiel_nom = serializers.CharField(source='materiel.nom', read_only=True)
    brigade_nom = serializers.SerializerMethodField()

    class Meta:
        model = Stock
        fields = ['id', 'materiel', 'materiel_nom', 'etat', 'brigade', 'brigade_nom', 'quantite', 'created_at', 'updated_at']

    def get_brigade_nom(self, obj):
        return obj.brigade.nom if obj.brigade else None

class MouvementMaterielSerializer(serializers.ModelSerializer):
    # Champs additionnels en lecture seule : le frontend affiche des noms,
    # pas des ID bruts. L'écriture continue de se faire par ID (materiel,
    # agent_concerner, brigade, brigade_destination restent des PK writables).
    materiel_nom = serializers.CharField(source='materiel.nom', read_only=True)
    agent_concerner_nom = serializers.SerializerMethodField()
    createur_nom = serializers.SerializerMethodField()
    brigade_nom = serializers.SerializerMethodField()
    brigade_destination_nom = serializers.SerializerMethodField()

    class Meta:
        model = MouvementMateriel
        fields = [
            'id', 'numero', 'type', 'materiel', 'materiel_nom', 'etat', 'quantite',
            'agent_concerner', 'agent_concerner_nom', 'createur', 'createur_nom',
            'brigade', 'brigade_nom', 'brigade_destination', 'brigade_destination_nom',
            'date_mouvement', 'date_retour_prevue', 'date_retour_effective',
            'commentaire', 'statut', 'created_at', 'updated_at',
        ]

    def get_agent_concerner_nom(self, obj):
        return f"{obj.agent_concerner.nom} {obj.agent_concerner.prenom}" if obj.agent_concerner else None

    def get_createur_nom(self, obj):
        return f"{obj.createur.nom} {obj.createur.prenom}" if obj.createur else None

    def get_brigade_nom(self, obj):
        return obj.brigade.nom if obj.brigade else None

    def get_brigade_destination_nom(self, obj):
        return obj.brigade_destination.nom if obj.brigade_destination else None