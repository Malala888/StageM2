from django.contrib.auth.hashers import PBKDF2PasswordHasher


class FastPBKDF2PasswordHasher(PBKDF2PasswordHasher):
    """PBKDF2-SHA256 avec 100 000 itérations (au lieu de plus d'un million par défaut).

    Même algorithme que Django, juste un coût réduit : la connexion passe de
    plusieurs secondes à une fraction de seconde sur un PC modeste. Les anciens
    mots de passe restent valides et sont convertis à la prochaine connexion.
    Pour un déploiement en production, augmenter `iterations`.
    """
    iterations = 100_000