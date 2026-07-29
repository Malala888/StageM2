from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Section, Brigade, Gare
from .serializers import SectionSerializer, BrigadeSerializer, GareSerializer

class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

class BrigadeViewSet(viewsets.ModelViewSet):
    queryset = Brigade.objects.all()
    serializer_class = BrigadeSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

class GareViewSet(viewsets.ModelViewSet):
    queryset = Gare.objects.all()
    serializer_class = GareSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]