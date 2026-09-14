# Foncier Juste — prototype (J1-J4 du sprint)

Statut au 15/09/2026. Voir aussi le dossier de recherche complet : "Foncier Juste" (artefact publié dans la conversation Claude).

## Nouveau : fondations SEO + mise en ligne

- Pages ajoutées : `guide-erreurs-taxe-fonciere.html` (contenu pilier),
  `mentions-legales.html`, `confidentialite.html`, `cgv.html` (brouillons —
  voir l'encart d'avertissement sur chaque page), `robots.txt`, `sitemap.xml`.
- Balises meta, Open Graph et données structurées (schema.org) ajoutées sur
  `index.html` et le guide.
- ⚠️ Le domaine `www.foncier-juste.fr` utilisé dans les balises canonical /
  sitemap est un **placeholder non vérifié** — je n'ai pas pu confirmer sa
  disponibilité avec certitude (whois inconclusif). Vérifie-la toi-même sur un
  registrar (Gandi, OVH...) avant de t'y attacher ; sinon donne-moi un autre
  nom et je remplace partout en une passe.
- Voir `DEPLOY.md` pour mettre le site en ligne (2 comptes gratuits à créer
  toi-même, je fais le reste).

## Ce qui est réel et vérifié aujourd'hui

- **`data/dvf_nantes_2023.csv`** — 6299 transactions immobilières réelles (Nantes,
  Bouguenais, Grandchamps-des-Fontaines, Orvault), extraites de la base officielle
  DVF via `files.data.gouv.fr/geo-dvf`. Pas de données inventées.
- **`backend/diagnostic_engine.py`** — moteur de règles en Python : détection
  d'écart de surface, d'éléments de confort obsolètes, comparaison au marché
  réel local. Documenté, avec avertissements explicites sur ce qu'il ne fait pas.
- **`backend/test_diagnostic_engine.py`** — 7 tests unitaires, tous passants,
  exécutés sur les vraies données (pas des mocks).
- **`web/index.html` + `web/dvf_data.json`** — prototype interactif complet :
  landing page, questionnaire en 4 étapes, calcul du score en JavaScript
  (miroir du moteur Python), page de résultats avec anomalies détaillées et
  estimation d'impact en euros. Testé de bout en bout dans un navigateur réel.

## Ce qui est volontairement un stub (pas encore branché)

- Le bouton "Obtenir le rapport complet — 29€" est désactivé : aucun compte
  Stripe n'existe encore, donc aucun paiement réel n'est possible.
- La bêta est limitée à 4 communes (celles pour lesquelles j'ai déjà extrait
  de la vraie donnée). Étendre à toute la France = retélécharger et filtrer
  les fichiers DVF des autres départements (mécanique déjà écrite, il suffit
  de la relancer avec d'autres codes commune).
- Pas d'upload de la vraie fiche d'évaluation (formulaire 6675-M) : le
  questionnaire simule ce que ce document contiendrait. L'étape suivante est
  d'ajouter une lecture assistée par IA du PDF réel.
- Aucune base de données ni compte utilisateur : tout tourne dans le
  navigateur, rien n'est sauvegardé.

## Prochaines étapes (J5-J7 du plan)

1. Créer un compte Stripe (à faire par toi — je ne peux pas créer de compte
   ni saisir d'informations de paiement en ton nom).
2. Brancher un vrai paiement + génération du PDF de rapport + dossier de
   réclamation pré-rempli.
3. Tester avec 5-10 cas réels (toi, des proches) pour calibrer la fiabilité
   avant tout lancement public.
4. Choisir un nom de domaine et un hébergeur, puis publier.

## Comment relancer le prototype en local

```
cd web
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/index.html
```

## Comment relancer les tests

```
cd backend
python3 -m unittest test_diagnostic_engine -v
```
