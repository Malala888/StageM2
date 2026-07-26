from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Materiel(models.Model):
    ETAT_CHOICES = [
        ('NEUF', 'Neuf'),
        ('BON', 'Bon'),
        ('MOYEN', 'Moyen'),
        ('MAUVAIS', 'Mauvais'),
        ('HORS_SERVICE', 'Hors service'),
    ]

    nom = models.CharField(max_length=100)
    categorie = models.CharField(max_length=50)
    seuil_alerte = models.IntegerField(default=5)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'materiel'

    def __str__(self):
        return self.nom

class Stock(models.Model):
    materiel = models.ForeignKey(Materiel, on_delete=models.CASCADE)
    etat = models.CharField(max_length=20, choices=Materiel.ETAT_CHOICES)
    quantite = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stock'
        unique_together = ['materiel', 'etat']

    def __str__(self):
        return f"{self.materiel.nom} - {self.etat} : {self.quantite}"

class MouvementMateriel(models.Model):
    TYPE_CHOICES = [
        ('APPROVISIONNEMENT', 'Approvisionnement'),
        ('EMPRUNT', 'Emprunt'),
        ('RETOUR', 'Retour'),
        ('TRANSFERT', 'Transfert'),
        ('REPARATION', 'Réparation'),
        ('REBUT', 'Rebus'),
        ('INVENTAIRE', 'Inventaire'),
    ]
    STATUT_CHOICES = [
        ('EN_COURS', 'En cours'),
        ('RETOURNE', 'Retourné'),
        ('EN_RETARD', 'En retard'),
        ('PERDU', 'Perdu'),
        ('ANNULE', 'Annulé'),
    ]

    numero = models.CharField(max_length=20, unique=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    materiel = models.ForeignKey(Materiel, on_delete=models.RESTRICT)
    quantite = models.PositiveIntegerField()
    agent_concerner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mouvements_agent'
    )
    createur = models.ForeignKey(
        User,
        on_delete=models.RESTRICT,
        related_name='mouvements_cree'
    )
    brigade = models.ForeignKey(
        'personnel.Brigade',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mouvements_source'
    )
    brigade_destination = models.ForeignKey(
        'personnel.Brigade',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mouvements_dest'
    )
    date_mouvement = models.DateField(auto_now_add=True)
    date_retour_prevue = models.DateField(null=True, blank=True)
    date_retour_effective = models.DateField(null=True, blank=True)
    commentaire = models.TextField(blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='EN_COURS')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mouvement_materiel'

    def __str__(self):
        return self.numero