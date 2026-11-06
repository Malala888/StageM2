from django.utils.dateparse import parse_date
from django.db.models import Q
from rest_framework import viewsets, serializers, permissions
from rest_framework.response import Response
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    action_label = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'utilisateur', 'utilisateur_nom', 'utilisateur_role',
                  'action', 'action_label', 'cible', 'detail', 'adresse_ip', 'created_at']


class IsAdminReadOnly(permissions.BasePermission):
    """Journal visible uniquement par le Chef de Service (et le superuser), en lecture seule."""
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and request.method in permissions.SAFE_METHODS
                    and (u.is_superuser or getattr(u, 'role', None) == 'ADMIN'))


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAdminReadOnly]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get('action'):
            qs = qs.filter(action=p['action'])
        if p.get('utilisateur'):
            qs = qs.filter(utilisateur_id=p['utilisateur'])
        if p.get('q'):
            q = p['q']
            qs = qs.filter(Q(utilisateur_nom__icontains=q) | Q(cible__icontains=q) | Q(detail__icontains=q))
        d1, d2 = parse_date(p.get('date_debut', '') or ''), parse_date(p.get('date_fin', '') or '')
        if d1:
            qs = qs.filter(created_at__date__gte=d1)
        if d2:
            qs = qs.filter(created_at__date__lte=d2)
        return qs

    def list(self, request, *args, **kwargs):
        # Les 1000 entrées les plus récentes suffisent pour la consultation
        qs = self.filter_queryset(self.get_queryset())[:1000]
        return Response(self.get_serializer(qs, many=True).data)