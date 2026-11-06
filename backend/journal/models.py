from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    """Trace d'une action importante : qui a fait quoi, sur quoi, et quand."""
    ACTIONS = [
        ('CONNEXION', 'Connexion'),
        ('INSCRIPTION', 'Inscription'),
        ('VALIDATION_COMPTE', 'Compte validé'),
        ('REJET_COMPTE', 'Compte rejeté'),
        ('STATUT_COMPTE', 'Statut de compte modifié'),
        ('SUPPRESSION_COMPTE', 'Compte supprimé'),
        ('MDP_CHANGE', 'Mot de passe modifié'),
        ('MOUVEMENT_CREE', 'Mouvement enregistré'),
        ('DEMANDE_VALIDEE', 'Demande validée'),
        ('DEMANDE_REJETEE', 'Demande rejetée'),
        ('MOUVEMENT_SUPPRIME', 'Mouvement supprimé'),
        ('MATERIEL_CREE', 'Matériel ajouté'),
        ('MATERIEL_MODIFIE', 'Matériel modifié'),
        ('MATERIEL_SUPPRIME', 'Matériel supprimé'),
        ('STOCK_MODIFIE', 'Stock modifié'),
    ]

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='journal_actions'
    )
    # Copie du nom et du rôle au moment de l'action : le journal reste lisible
    # même si le compte est supprimé ou renommé plus tard.
    utilisateur_nom = models.CharField(max_length=200, blank=True, default='')
    utilisateur_role = models.CharField(max_length=30, blank=True, default='')
    action = models.CharField(max_length=30, choices=ACTIONS)
    cible = models.CharField(max_length=255, blank=True, default='')
    detail = models.TextField(blank=True, default='')
    adresse_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'journal_activite'
        ordering = ['-created_at', '-id']

    def __str__(self):
        return f"{self.created_at:%d/%m/%Y %H:%M} — {self.utilisateur_nom} — {self.action}"