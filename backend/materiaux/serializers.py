from rest_framework import serializers
from .models import Materiel, Stock, MouvementMateriel

class MaterielSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materiel
        fields = '__all__'

class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = '__all__'

class MouvementMaterielSerializer(serializers.ModelSerializer):
    class Meta:
        model = MouvementMateriel
        fields = '__all__'