from rest_framework import viewsets
from .models import Materiel, Stock, MouvementMateriel
from .serializers import MaterielSerializer, StockSerializer, MouvementMaterielSerializer

class MaterielViewSet(viewsets.ModelViewSet):
    queryset = Materiel.objects.all()
    serializer_class = MaterielSerializer

class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer

class MouvementMaterielViewSet(viewsets.ModelViewSet):
    queryset = MouvementMateriel.objects.all()
    serializer_class = MouvementMaterielSerializer