# Foncier Juste — prototype (J1-J4 du sprint)

Statut au 15/09/2026. Voir aussi le dossier de recherche complet : "Foncier Juste" (artefact publié dans la conversation Claude).

## Livraison d'un document acheté (16/09/2026)

Les réponses au questionnaire sont jointes à la session Stripe
(`metadata[diag]`, liste blanche stricte côté serveur). `succes.html` les relit
via `/api/verify-session` et **reconstruit le document** avec `moteur.js` +
`rapport.js`. Conséquence : un acheteur peut retélécharger son document depuis
n'importe quel appareil, à tout moment, avec le lien permanent affiché après
paiement. Le `localStorage` n'est qu'un secours, jamais la garantie.

C'est la seule donnée du questionnaire qui quitte le navigateur, et uniquement
en cas d'achat. La page Confidentialité le dit explicitement.

## Garde-fou T1 sur l'écart de surface

Un écart de surface **seul** n'ouvre plus l'offre payante
(`CODES_NE_DECLENCHANT_PAS_LA_VENTE`, présent dans les deux moteurs). Raison :
le questionnaire demande d'additionner les surfaces réelles de la fiche puis de
les comparer à une surface habitable mesurée — tant que T1 n'a pas établi que
ces deux périmètres coïncident, l'écart peut être un artefact de la question.
Le signal reste affiché et expliqué. **À lever après T1**, des deux côtés.

## Source de vérité des règles métier

Les règles de diagnostic existent en deux implémentations — JavaScript dans
`web/moteur.js` (chargé par `index.html` pour le pré-diagnostic et par
`succes.html` pour reconstruire un document acheté ; le calcul se fait dans le
navigateur du visiteur) et Python dans `backend/diagnostic_engine.py`
(dépouillement du test T1, tests hors ligne).
**Ce ne sont pas deux règles : c'est une règle écrite deux fois.** Les points
à synchroniser portent le marqueur `PARITÉ` dans les deux fichiers.

Toute modification d'une règle doit être répercutée des deux côtés, puis
vérifiée :

```bash
cd backend && python3 -m unittest discover -p "test_*.py"   # 29 tests
python3 test_parite_moteurs.py --table                      # tableau comparatif
```

Le test de parité rejoue les 22 cas de `backend/cas_parite.json` dans les deux
moteurs et compare les décisions produit champ par champ, plus une **empreinte
SHA-256 de tous les textes affichés à l'utilisateur** : une divergence de
formulation, même d'un caractère, fait échouer le test. La capture du moteur de
production (`backend/parite_production.json`) se régénère avec
`backend/capture_production.js`, dont l'en-tête donne le mode d'emploi.

**Instrumentation à ajouter avant l'ouverture commerciale :** l'événement
`achat_bloque`, spécifié en détail en tête de `web/api/track.js`.

## ⚠️ Site mis en pause (15/09/2026)

Sur demande explicite : `robots.txt` bloque tout crawl (`Disallow: /`) et
toutes les pages sont passées en `noindex, nofollow`. Le site reste
techniquement accessible à qui a l'URL exacte — pour une vraie protection
par mot de passe, voir "Rendre le site vraiment privé" ci-dessous.

**Pour relancer publiquement** : remettre `Allow: /` dans `web/robots.txt`
et repasser les balises `<meta name="robots">` de chaque page HTML à
`index, follow`, puis commit + push.

### Rendre le site vraiment privé (action à faire toi-même)
Vercel → ton projet `foncier-juste` → **Settings → Deployment Protection**
→ active soit "Vercel Authentication" (accès réservé aux personnes ayant un
compte Vercel autorisé, gratuit), soit "Password Protection" si ton plan
l'inclut. Je ne peux pas activer ce réglage à ta place (c'est dans ton
compte), mais ça se fait en 30 secondes une fois sur place.

## Nouveau : couverture nationale + rapport PDF (15/09/2026)

- **20 départements réels** couverts — les 10 premiers (Loire-Atlantique,
  Paris, Rhône, Bouches-du-Rhône, Gironde, Haute-Garonne, Nord,
  Ille-et-Vilaine, Hérault, Seine-Maritime) + 10 villes supplémentaires de
  plus de 120 000 habitants (Alpes-Maritimes/Nice, Marne/Reims, Loire/Saint-
  Étienne, Var/Toulon, Isère/Grenoble, Côte-d'Or/Dijon, Maine-et-Loire/
  Angers, Gard/Nîmes, Puy-de-Dôme/Clermont-Ferrand, Sarthe/Le Mans).
  Soit **379 171 transactions DVF 2024, 7134 communes**.
  Alsace-Moselle (67/68/57) volontairement exclue : régime du Livre Foncier,
  pas de fichiers DVF standards. Relancer `backend/build_dataset.py` avec
  d'autres codes département pour étendre encore.
- Recherche de commune (autocomplétion) à la place de la liste figée de 4.
  Les statistiques de marché sont chargées **par département, à la demande**
  (`web/market_stats/<dept>.json`, ~100-1500 Ko chacun) plutôt qu'un seul
  fichier monolithique — ça reste rapide même en couvrant tout le pays.
- **Génération de rapport PDF** (bouton "Voir un exemple de rapport") via
  jsPDF, entièrement côté navigateur. Marqué "EXEMPLE" tant que le paiement
  Stripe n'est pas branché — le bouton payant reste désactivé.

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

## Backlog (souhaité, pas encore fait)

- **Lettre de réclamation 100% pré-remplie** : ajouter au questionnaire les
  champs nom, adresse du bien et référence de l'avis d'imposition, pour que
  `dessinerLettreReclamation` (rapport.js) n'ait plus aucun `[crochet]` à
  compléter à la main. Actuellement laissés en placeholder pour ne pas
  toucher au tunnel déjà testé (voir conversation du 15/09/2026).

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
