from .models import ActivityLog


def _ip(request):
    if request is None:
        return None
    fwd = request.META.get('HTTP_X_FORWARDED_FOR')
    ip = fwd.split(',')[0].strip() if fwd else request.META.get('REMOTE_ADDR')
    return ip or None


def log_action(request, action, cible='', detail='', user=None):
    """
    Enregistre une action dans le journal. Ne doit JAMAIS faire échouer la
    requête principale : toute erreur est avalée.
    `user` permet de forcer l'auteur (ex. connexion, où request.user n'est pas encore connu).
    """
    try:
        u = user or getattr(request, 'user', None)
        if u is not None and not getattr(u, 'is_authenticated', False):
            u = None
        nom = ''
        role = ''
        if u is not None:
            nom = f"{getattr(u, 'prenom', '') or ''} {getattr(u, 'nom', '') or ''}".strip() or str(u)
            role = getattr(u, 'role', '') or ''
        ActivityLog.objects.create(
            utilisateur=u, utilisateur_nom=nom, utilisateur_role=role,
            action=action, cible=str(cible)[:255], detail=str(detail),
            adresse_ip=_ip(request),
        )
    except Exception:
        pass