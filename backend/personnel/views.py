from rest_framework import viewsets
from .models import Section, Brigade, Gare
from .serializers import SectionSerializer, BrigadeSerializer, GareSerializer

class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer

class BrigadeViewSet(viewsets.ModelViewSet):
    queryset = Brigade.objects.all()
    serializer_class = BrigadeSerializer

class GareViewSet(viewsets.ModelViewSet):
    queryset = Gare.objects.all()
    serializer_class = GareSerializer