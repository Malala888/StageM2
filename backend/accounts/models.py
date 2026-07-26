from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UtilisateurManager(BaseUserManager):
    def create_user(self, email, nom, prenom, password=None, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire")
        email = self.normalize_email(email)
        extra_fields.setdefault('statut', 'EN_ATTENTE')
        user = self.model(email=email, nom=nom, prenom=prenom, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nom, prenom, password=None, **extra_fields):
        extra_fields.setdefault('role', 'ADMIN')
        extra_fields.setdefault('statut', 'ACTIF')
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, nom, prenom, password, **extra_fields)

class Utilisateur(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('CHEF_SECTION', 'Chef de Section'),
        ('CHEF_BRIGADE', 'Chef de Brigade'),
        ('GL', 'Garde Ligne'),
        ('CN', 'Cantonnier'),
    ]
    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('ACTIF', 'Actif'),
        ('REJETE', 'Rejeté'),
        ('SUSPENDU', 'Suspendu'),
        ('ARCHIVE', 'Archivé'),
    ]

    nom = models.CharField(max_length=50)
    prenom = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    poste = models.CharField(max_length=10, blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='EN_ATTENTE')
    section = models.ForeignKey('personnel.Section', on_delete=models.SET_NULL, null=True, blank=True)
    brigade = models.ForeignKey('personnel.Brigade', on_delete=models.SET_NULL, null=True, blank=True)
    date_inscription = models.DateTimeField(auto_now_add=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    last_login = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = UtilisateurManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nom', 'prenom']

    def __str__(self):
        return f"{self.nom} {self.prenom}"

    class Meta:
        db_table = 'utilisateur'