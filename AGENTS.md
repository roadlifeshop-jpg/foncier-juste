# Règles permanentes — Dépense·Juste

## Avant toute intervention

- Lire `ETAT-PROJET.md`, puis vérifier l'état Git réel :

```bash
git status --short --branch
git rev-parse --short HEAD
git rev-parse --short origin/main
git rev-list --count main..HEAD
```

- Travailler uniquement sur `refonte-trois-outils`, sauf instruction contraire explicite.
- Ne pas réauditer tout le dépôt pour une tâche ciblée ; lire uniquement les fichiers nécessaires.
- Si une demande devient trop large ou contradictoire, proposer un découpage avant de coder.

## Interdits sans mon feu vert explicite

- Fusionner `main`, déployer en production, ouvrir l'indexation, modifier la protection Vercel.
- Ajouter une collecte de données personnelles, un paiement ou une dépendance externe.
- Toute commande Git destructive. Les changements existants se préservent.

## Exactitude

- Ne jamais inventer : information, règle juridique, montant, économie, source, témoignage, résultat.
- Une affirmation juridique ou temporelle s'appuie sur une source officielle actuelle, avec sa date de vérification.
- Préserver les moteurs et leurs tests. Toute modification d'une décision métier doit être justifiée et testée.

## Franchise

- Signaler franchement qu'une idée est faible, risquée, non vérifiable ou sans valeur utilisateur.
- Ne pas chercher à me faire plaisir : l'exactitude et la viabilité du produit priment.

## Tests et rapports

- Tester proportionnellement au changement : pas de rejeu intégral des parcours pour une correction documentaire.
- Rapports courts : changements, tests, limites, commit. Pas de recopie des journaux de commandes.

## Documentation

- Ne jamais écrire dans `AGENTS.md` ou `ETAT-PROJET.md` un hash, un compteur ou un état susceptible de devenir faux au prochain commit. Donner la commande qui le lit.
