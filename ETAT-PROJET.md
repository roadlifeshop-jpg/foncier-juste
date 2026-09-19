# État du projet — Dépense·Juste

## Objectif du produit

Le premier diagnostic gratuit, rapide et anonyme, **avant** de décider d'engager une
démarche. Le site répond à une question — « puis-je récupérer de l'argent, et
comment&nbsp;? » — puis s'efface : il n'engage aucune procédure, ne représente personne et
ne prélève rien.

Promesse affichée : **« Vérifiez gratuitement si vous pouvez récupérer de l'argent.
Réponse immédiate, sans compte, puis les étapes pour agir. »**

Trois situations, par ordre de priorité produit :

1. **Vol retardé ou annulé** — outil principal, le seul qui affiche un montant, parce que
   c'est le seul domaine où un texte fixe un barème.
2. **Dépense récurrente** — outil secondaire, en bêta. Calcule le coût actuel d'un
   contrat et la vérification à mener. Ne chiffre aucune économie.
3. **Taxe foncière** — outil expert. Signale ce qui mérite vérification sur la fiche
   d'évaluation. **Aucune somme n'y est chiffrable**, et la page le dit avant le clic.

Un quatrième outil, **garanties après achat**, existe et fonctionne, mais a été retiré de
la navigation principale ; il reste atteignable depuis le pied de page.

Ce que le produit ne fait pas, et ne fera pas sans décision explicite : demander un email,
un téléphone, un nom ou la création d'un compte avant un résultat ; afficher un témoignage,
un nombre d'utilisateurs ou un taux de réussite ; proposer un rappel téléphonique ou un
accompagnement qui n'existe pas.

## Branche et dernier commit

| | |
|---|---|
| Branche de travail | `refonte-trois-outils` |
| Dernier commit | `1b37805` — « Un diagnostic gratuit avant d'engager quoi que ce soit : agir d'abord » |
| Date | 19 septembre 2026 |
| Local = distant | oui, arbre de travail propre |
| `main` | `52ab6ac`, **21 commits en arrière**, jamais fusionnée |
| Production | `foncier-juste.vercel.app` sert toujours **l'ancien site Foncier·Juste** |

Les prévisualisations Vercel sont protégées par l'authentification du projet : elles
répondent `302` vers `vercel.com/sso-api` pour qui n'est pas connecté au compte. L'URL d'un
déploiement se retrouve par l'API publique de GitHub, le dépôt étant public :
`api.github.com/repos/roadlifeshop-jpg/foncier-juste/deployments`, puis `/statuses` pour
lire `environment_url`.

## Architecture

Site **statique** servi depuis `web/`, plus trois fonctions serverless. **Aucune dépendance
npm**, aucune étape de construction, aucune base de données. Node 20.x déclaré pour les
seules fonctions.

### Pages servies — 14

| Page | Rôle |
|---|---|
| `index.html` | Accueil : promesse, sélection de situation, bande de confiance, trois étapes |
| `vol-retarde.html` | Outil vol retardé |
| `abonnements.html` | Outil dépense mensuelle (bêta) |
| `taxe-fonciere.html` | Outil taxe foncière, parcours court et parcours complet |
| `garanties.html` | Outil garanties, hors navigation principale |
| `notre-methode.html` | Ce que les outils savent dire, degrés de certitude, exemples |
| `sources.html` | Toutes les règles citées, avec sources et dates de vérification |
| `guide-erreurs-taxe-fonciere.html`, `resilier-un-abonnement.html`, `produit-defectueux-que-faire.html` | Guides |
| `mentions-legales.html`, `confidentialite.html` | Pages légales |
| `cgv.html`, `succes.html` | Vestiges de l'offre payante retirée. Liées de nulle part, conservées pour mémoire |

### Moteurs et bibliothèques

| Fichier | Rôle | Statut |
|---|---|---|
| `moteur.js` | Diagnostic taxe foncière | **Gelé** — miroir Python et empreintes de parité |
| `vol.js` | Barème et orientation vol retardé | Stable |
| `aeroports.js` | 105 aéroports, route orthodromique, garde-fous de seuil | Stable |
| `abonnements.js` | Périodicités, totaux, engagements, fenêtre de reconduction | Stable |
| `garanties.js` | Délais et voies après achat défectueux | Stable |
| `regles.js` | **Registre unique des règles juridiques** — 18 entrées, chacune avec texte, source, date d'application et date de vérification. `sources.html` le parcourt automatiquement | Source de vérité |
| `resultat4.js` | Rendu commun des quatre cases de résultat et du vocabulaire des certitudes | Partagé par les trois outils |
| `rapport.js` | Génération des PDF (jsPDF), marque centralisée en deux constantes | Stable |

### Données

`communes.json` — 34 917 communes (Code officiel géographique 2026 + codes postaux La
Poste), 1,4 Mo bruts, environ 428 Ko compressés, chargé **au clic sur « Commencer »**, pas
au chargement de la page. `market_stats/` — 20 départements, DVF millésime 2024, 379 171
transactions. `vendor/` — jsPDF et trois polices auto-hébergées.

### Fonctions serverless — `web/api/`

`track.js` journalise le parcours sans cookie ni identifiant. `create-checkout-session.js`
et `verify-session.js` subsistent de l'offre payante : **inertes sans la variable
`STRIPE_SECRET_KEY`**, qui n'est pas définie. Aucune page n'appelle plus les deux
dernières.

### Structure commune des trois résultats

Rendue par `resultat4.js`, dans cet ordre, sans exception :

1. **Votre situation**
2. **La somme possible**, ou la raison précise pour laquelle elle n'est pas calculable,
   avec son degré de certitude
3. **Ce que vous pouvez faire maintenant** — la démarche gratuite, avec un lien direct
   depuis le montant
4. **Ce qu'il reste à vérifier**

Les textes juridiques, exceptions et sources sont dans des dépliants **fermés par défaut**.
Le PDF est un complément, jamais nécessaire pour comprendre le verdict.

### Chaîne de publication

Vercel, racine du projet réglée sur `web/`. `vercel.json` vit dans `web/` et pose une
politique de sécurité de contenu stricte : `font-src 'self'` — **les polices doivent rester
auto-hébergées**, aucune police tierce n'est chargeable.

## Décisions définitives

**Aucune somme promise.** Chaque chiffre porte l'un des quatre degrés de certitude définis
dans `resultat4.js` : *montant fixé par un texte*, *calculé sur vos réponses*, *hypothèse*,
*non chiffrable*. Le vocabulaire est fixé à un seul endroit.

**La taxe foncière n'affiche jamais de montant.** Seule l'administration recalcule une
valeur locative. La case « somme » y vaut « non chiffrable », avec le motif.

**Aucune économie sans scénario de résiliation ni prix de remplacement.** L'outil dépense
mensuelle affiche un *coût actuel*, jamais une économie.

**Aucun montant remboursable au titre de l'article L215-1** tant que cinq faits ne sont pas
établis : que le contrat relève de l'article, que la reconduction ait eu lieu, que
l'information écrite n'ait pas été reçue, quelle avance a été payée et pour quelle période,
et à quelle date la résiliation prendrait effet. À la place, la vérification à mener.

**Le garde-fou des surfaces tient.** Un écart entre surface pondérée et surface mesurée est
affiché et expliqué, mais n'ouvre aucune démarche et n'est jamais un motif. **Aucune
direction ni fourchette n'est annoncée** pour cet écart : ni l'article 324 T de l'annexe III
au CGI ni le BOI-IF-TFB-20-10-20-50 n'en donnent, et les correctifs peuvent l'augmenter
comme le diminuer. Les six affirmations « dépasse normalement de 20 à 40 % » ont été
retirées du dépôt entier, métadonnées comprises.

**Sans la fiche 6675-M, aucune surface n'est demandée.** La question « avez-vous votre
fiche&nbsp;? » ouvre le parcours et décide de sa longueur : trois étapes sans, quatre avec.

**Un élément saisi en texte libre ne produit jamais de motif automatique.** Il n'est pas
transmis au moteur et ressort, à l'écran comme au PDF, en « à vérifier manuellement sur la
fiche ».

**Une règle non applicable est signalée comme telle**, jamais tue : la directive (UE)
2024/1799 sur le droit à la réparation est marquée non transposée, la révision du règlement
(CE) n° 261/2004 du 15 juin 2026 est marquée réforme attendue.

**Quand deux sources officielles divergent, la divergence est affichée** et la plus prudente
retenue. Cas en vigueur : le barème aérien, où la Commission européenne résume en trois
montants là où la DGAC en détaille quatre — nous suivons la DGAC.

**Aucune distance n'est devinée.** Le visiteur nomme deux aéroports&nbsp;; à moins de 100 km
d'un seuil du barème, ou si un aéroport n'est pas reconnu, aucun montant n'est tranché.

**Aucune preuve sociale.** Ni témoignage, ni nombre d'utilisateurs, ni taux de réussite, ni
logo de média. La confiance repose sur des sources nommées et datées, l'absence de compte et
de coordonnées, le degré de certitude affiché et les limites reconnues.

**Rien ne quitte le navigateur.** Les réponses aux trois outils sont calculées localement.
`track.js` ne journalise que l'étape atteinte, sans cookie, sans identifiant, sans donnée
saisie.

**Aucun paiement.** Les fonctions Stripe restent en place mais inertes ; elles ne seront pas
réactivées sans décision explicite.

**Moteurs et barèmes ne se modifient pas sans justification démontrée**, et jamais sans
revérification des sources officielles.

## Tests disponibles

```bash
python3 -m pytest backend/ -q
```

| Suite | Contenu | État |
|---|---|---|
| `test_diagnostic_engine.py` | 30 tests du moteur Python miroir | vert |
| `test_parite_moteurs.py` | 2 tests — empreinte SHA-256 des textes de `moteur.js` contre `parite_production.json`, 22 cas | vert |
| `test_communes.py` | 9 tests du référentiel des 34 917 communes | vert |
| `test_outils_web.py` | 1 test pytest exécutant **163 assertions** dans Chromium sur les vrais fichiers `regles.js`, `aeroports.js`, `abonnements.js`, `garanties.js`, `vol.js` | vert |

**42 tests, 163 assertions.** Le harnais web charge les fichiers réellement servis, jamais
une copie : c'est ce qui empêche les tests de diverger du code livré.

Contrôles manuels à rejouer avant toute mise en ligne, non automatisés : 14 pages à 320,
360, 390, 768, 1180 et 1440 px — aucun débordement horizontal, un seul `h1`, tous les champs
étiquetés, aucun lien interne mort, aucune erreur JavaScript&nbsp;; parcours clavier complet
jusqu'au résultat&nbsp;; PDF générés et relus, cohérence écran/PDF.

Prérequis : `playwright` et Chromium installés, `pypdf` pour la relecture des PDF. Ni Node
ni npm ne sont nécessaires.

## Limites et travaux restants

### Bloquant pour une mise en ligne publique

**Les mentions légales sont un brouillon.** Six champs vides, et la page l'affiche
elle-même. Cinq n'attendent aucune immatriculation et relèvent de l'article 1-1 de la loi
pour la confiance dans l'économie numérique : nom et prénoms, adresse à publier, téléphone,
directeur de la publication, email de contact. Le statut juridique et le SIRET s'ajouteront
à l'immatriculation. **Rien d'autre ne bloque la fusion.**

### Décisions en attente

- **Nom et domaine.** « Dépense·Juste » est un positionnement de travail. L'adresse reste
  `foncier-juste.vercel.app`, ce qui crée un doute en partage direct. L'inventaire exact de
  ce qu'un renommage toucherait est dans `MISE-EN-LIGNE.md`.
- **Mesure d'audience.** Les journaux d'exécution Vercel sont conservés **une heure** sur le
  plan Hobby, `page_vue` ne dit pas quelle page, et les trois guides n'émettent rien. En
  l'état, une campagne de sept jours est immesurable. L'alternative — Vercel Web Analytics,
  gratuit sur Hobby, fenêtre d'un mois — étendrait la collecte à la ville et à l'appareil et
  imposerait de mettre à jour `confidentialite.html`.
- **Indexation.** `noindex` sur les 14 pages et `Disallow: /` dans `robots.txt`.
  `scripts/ouvrir-indexation.sh` prépare l'ouverture sur le domaine définitif&nbsp;; il n'a
  jamais été exécuté.

### Limites assumées du produit

- À **320 px**, le bouton principal de l'accueil reste environ 74 px sous la ligne de
  flottaison. La situation et le montant, eux, sont visibles.
- Le résultat taxe foncière complet fait près de **10 000 px une fois déplié**. Il est
  rangé, pas raccourci.
- L'outil taxe foncière **ne détecte ni une hausse du taux voté par la commune, ni la fin
  d'une exonération temporaire** — deux causes fréquentes d'augmentation, qui ne se
  contestent pas par une réclamation. Un visiteur dans ce cas repart avec « rien à
  vérifier » sans explication de sa hausse.
- Le **repère de marché DVF** n'existe que dans 20 départements, soit 7 120 communes sur
  34 917. Le diagnostic, lui, fonctionne partout.
- `communes.json` pèse environ **428 Ko compressés**, chargés au clic sur « Commencer ».
- La question « de quoi s'agit-il&nbsp;? » de l'outil garanties **n'entre dans aucun
  calcul** : elle est posée sans servir.
- Les **57, 67 et 68** relèvent d'un régime foncier distinct, signalé mais non traité.

### Travaux identifiés, non engagés

- Le délai de **remboursement sous trente jours** de l'article L215-1 n'est mentionné ni
  dans le guide abonnements, ni dans l'outil, ni dans `regles.js`.
- La comparaison de fournisseurs a **un emplacement réservé et volontairement vide** dans
  l'outil dépense mensuelle. L'ouvrir demandera des prix datés, une méthode de classement
  publiable et la transparence sur tout lien commercial.
- L'architecture visuelle permettrait d'ajouter, **après le résultat**, une option
  facultative de type « recevoir mon résultat ». Aucune de ces fonctions ne sera activée
  sans service réel, politique de confidentialité adaptée et consentement explicite.
- **Aucun utilisateur réel n'a jamais parcouru ces outils.** Les cinq sessions accompagnées
  prévues dans `PLAN-LANCEMENT-7-JOURS.md` restent le premier travail utile.
