from rest_framework import serializers
from .models import Section, Brigade, Gare

class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = '__all__'

class BrigadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brigade
        fields = '__all__'

class GareSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gare
        fields = '__all__'