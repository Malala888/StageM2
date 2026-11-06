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
    agent_concerner_role = serializers.SerializerMethodField()
    createur_role = serializers.SerializerMethodField()
    brigade_section_nom = serializers.SerializerMethodField()
    brigade_destination_section_nom = serializers.SerializerMethodField()
    createur_section_nom = serializers.SerializerMethodField()
    agent_concerner_brigade_nom = serializers.SerializerMethodField()
    agent_concerner_section_nom = serializers.SerializerMethodField()

    class Meta:
        model = MouvementMateriel
        fields = [
            'id', 'numero', 'type', 'materiel', 'materiel_nom', 'etat', 'quantite',
            'agent_concerner', 'agent_concerner_nom', 'agent_concerner_role', 'agent_concerner_brigade_nom', 'agent_concerner_section_nom',
            'createur', 'createur_nom', 'createur_role', 'createur_section_nom',
            'brigade', 'brigade_nom', 'brigade_section_nom',
            'brigade_destination', 'brigade_destination_nom', 'brigade_destination_section_nom',
            'date_mouvement', 'date_retour_prevue', 'date_retour_effective',
            'commentaire', 'statut', 'created_at', 'updated_at',
        ]

    def validate(self, attrs):
        # La date de retour prévue doit être strictement après la date d'emprunt
        inst = getattr(self, 'instance', None)
        d0 = attrs.get('date_mouvement', getattr(inst, 'date_mouvement', None))
        d1 = attrs.get('date_retour_prevue', getattr(inst, 'date_retour_prevue', None))
        touche = 'date_mouvement' in attrs or 'date_retour_prevue' in attrs
        if touche and d0 and d1:
            if hasattr(d0, 'date'):
                d0 = d0.date()
            if d1 <= d0:
                raise serializers.ValidationError({
                    'date_retour_prevue': "La date de retour doit être après la date d'emprunt."
                })
        return attrs

    def get_createur_section_nom(self, obj):
        c = obj.createur
        return c.section.nom if c and getattr(c, 'section', None) else None

    def get_agent_concerner_brigade_nom(self, obj):
        a = obj.agent_concerner
        b = getattr(a, 'brigade', None) if a else None
        return b.nom if b else None

    def get_agent_concerner_section_nom(self, obj):
        a = obj.agent_concerner
        if not a:
            return None
        sec = getattr(a, 'section', None)
        if sec:
            return sec.nom
        b = getattr(a, 'brigade', None)
        return b.section.nom if b and b.section else None

    def get_agent_concerner_role(self, obj):
        return obj.agent_concerner.role if obj.agent_concerner else None

    def get_createur_role(self, obj):
        return obj.createur.role if obj.createur else None

    def get_brigade_section_nom(self, obj):
        return obj.brigade.section.nom if obj.brigade and obj.brigade.section else None

    def get_brigade_destination_section_nom(self, obj):
        b = obj.brigade_destination
        return b.section.nom if b and b.section else None

    def get_agent_concerner_nom(self, obj):
        return f"{obj.agent_concerner.nom} {obj.agent_concerner.prenom}" if obj.agent_concerner else None

    def get_createur_nom(self, obj):
        return f"{obj.createur.nom} {obj.createur.prenom}" if obj.createur else None

    def get_brigade_nom(self, obj):
        return obj.brigade.nom if obj.brigade else None

    def get_brigade_destination_nom(self, obj):
        return obj.brigade_destination.nom if obj.brigade_destination else None