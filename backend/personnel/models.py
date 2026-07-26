from django.db import models

class Section(models.Model):
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'section'

    def __str__(self):
        return self.nom

class Brigade(models.Model):
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    section = models.ForeignKey(Section, on_delete=models.RESTRICT)
    chef_brigade = models.ForeignKey(
        'accounts.Utilisateur',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='brigade_chef'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'brigade'

    def __str__(self):
        return self.nom

class Gare(models.Model):
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True, null=True, blank=True)
    localisation = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gare'

    def __str__(self):
        return self.nom