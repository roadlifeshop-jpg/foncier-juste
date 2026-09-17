# T1 — Protocole

**Dix rendez-vous, deux questions, des seuils écrits d'avance.**
Grille de collecte : `T1-grille-collecte.xlsx` (onglets « Volet A », « Volet B », « Décision T1 »).
Seuils arrêtés le 17/09/2026, avant la première session.

---

## Les deux questions

**Question 1 — les surfaces.** Sur de vraies fiches 6675-M, quelles lignes peuvent être
comparées à la surface habitable que le site demande de mesurer ? Où les périmètres
divergent-ils ?

Le site dit aujourd'hui deux choses qui ne se recouvrent peut-être pas :

> « La fiche décompose votre logement partie par partie, avec pour chacune une colonne
> *surface réelle*. **Additionnez ces surfaces**, ou reprenez le total si la fiche l'indique. »

> « Surface habitable du bien aujourd'hui — mesurée au sol, à l'intérieur des murs, pièces
> habitables uniquement, **hors garage, cave, et combles non aménagés**. »

Si la fiche porte une ligne pour le garage et une pour la cave, la première instruction les fait
entrer dans le total et la seconde les exclut. L'écart qui en résulte n'a alors rien à voir avec
la situation du propriétaire : il est fabriqué par nos propres questions. Le volet A existe pour
savoir si c'est le cas, et à quelle fréquence.

**Question 2 — l'offre.** Pour des propriétaires correspondant au client que nous pouvons servir
aujourd'hui, le parcours et le dossier à 49 € sont-ils compréhensibles et assez utiles pour qu'ils
envisagent réellement l'achat ? Quelles objections, en particulier sur l'obtention de la fiche,
les justificatifs et le prix ?

Les deux questions sont distinctes et ne se compensent pas : un produit compris mais fondé sur une
comparaison bancale reste invendable, et l'inverse aussi.

---

## Ce qui reste fermé pendant tout T1

- **Paiements en mode test.** La clé Stripe de production est une clé de test (vérifié le
  17/09/2026 : les sessions créées portent le préfixe `cs_test_`). Aucun encaissement réel n'est
  possible tant qu'elle n'est pas remplacée.
- **Site hors des moteurs de recherche** (`noindex`, `robots.txt`), tant que les mentions légales
  ne portent pas de SIRET réel.
- **Aucune vente proposée en entretien.** On ne vend pas à quelqu'un dont on est précisément en
  train de mesurer la compréhension : la réponse obtenue ne vaudrait rien, et la relation non plus.

---

## Qui interroger

Le client que nous pouvons servir aujourd'hui, c'est-à-dire cinq conditions réunies :

1. propriétaire d'un logement en France, **hors Alsace-Moselle** (Bas-Rhin, Haut-Rhin, Moselle :
   régime du Livre foncier, le produit ne s'y applique pas) ;
2. dans l'un des **20 départements couverts** par nos données de marché : 06, 13, 21, 30, 31, 33,
   34, 35, 38, 42, 44, 49, 51, 59, 63, 69, 72, 75, 76, 83 ;
3. maison ou appartement, entre 8 et 400 m² ;
4. **a la fiche 6675-M sous la main, ou accepte de la demander** — sans elle, le volet A est
   impossible et le produit n'est de toute façon pas proposé à la vente ;
5. reçoit et paie une taxe foncière à son nom.

**Objectif : 10 personnes. Plancher : 8.** En dessous de 8, les deux verdicts restent « en attente » ;
c'est écrit dans les formules, pas laissé à l'appréciation du moment.

Cherchez au moins **trois personnes hors de votre entourage proche** : un proche comprend votre
projet avant de lire la page, ce qui détruit exactement ce que le volet B mesure.

---

## Consentement et données personnelles

La fiche 6675-M est un document fiscal nominatif. **Aucune fiche n'est ouverte sans l'accord écrit
de son propriétaire**, obtenu avant la session. Message type :

> « J'aimerais regarder avec vous votre fiche d'évaluation (formulaire 6675-M) pendant environ
> trois quarts d'heure. Je ne note que des surfaces, des intitulés de lignes et vos remarques. Je
> ne conserve ni votre nom, ni votre adresse, ni vos références fiscales, ni aucune copie ou photo
> du document. Vous pouvez arrêter à tout moment et me demander d'effacer ce que j'ai noté. »

Ne sont **jamais** recopiés dans le classeur : nom, prénom, adresse du bien, références
cadastrales, numéro fiscal, montant d'imposition nominatif, copie ou photographie de la fiche.

Chaque participant reçoit un code **P1 à P10**. La correspondance code ↔ personne reste dans une
note séparée, hors du dépôt, détruite à la fin du test. Le classeur est déjà exclu du dépôt
(`.gitignore : *.xlsx`) — ne l'y ajoutez jamais à la main. Les verbatims sont recopiés mot à mot
puis expurgés de tout élément identifiant : « ma maison de Nantes, rue X » devient « ma maison ».

Les résultats que je présenterai ne contiendront que des codes, des surfaces et des verbatims
anonymisés.

---

## Déroulé d'une session — 45 minutes

**L'ordre est impératif. L'inverser invalide la session.**

1. **(10 min) Le diagnostic, à l'aveugle.** La personne fait le parcours seule, sans avoir ouvert
   sa fiche et sans aucune aide de votre part. Vous notez ce qu'elle saisit et votre appréciation
   de sa certitude — onglet « Grille de collecte », colonnes E à J. Si elle bute, notez où : c'est
   une donnée, pas un incident.
2. **(5 min) Ce que le moteur a répondu.** Colonnes P à R. Sans commentaire de votre part.
3. **(15 min) On ouvre la fiche ensemble — volet A.** Vous recopiez **chaque ligne portant une
   surface**, y compris celles qui vous paraissent hors sujet : ce sont elles qui révèlent les
   divergences de périmètre. Pour chacune, deux jugements distincts : cette partie est-elle
   habitable au sens de notre question, et le propriétaire l'aurait-il comptée dans sa mesure ?
   Puis colonnes K à O de la grille d'origine.
4. **(15 min) L'entretien — volet B.** Ce qu'elle a compris, ce qui la retient, ce qu'elle dit du
   prix. Vous ne défendez jamais le produit ; vous notez les objections mot à mot. La question
   « qu'est-ce qui vous empêcherait de l'acheter ? » se pose avant toute mention du prix.
5. **(après 7 jours) Une seule vérification.** A-t-elle demandé sa fiche, sans relance de votre
   part ? Colonne M du volet B. C'est le seul élément comportemental du test, et le plus solide.

---

## Comment trancher, ligne par ligne (volet A)

- **Habitable au sens de notre question : OUI** — pièce d'habitation que la personne compterait en
  mesurant chez elle.
- **NON** — garage, cave, grenier non aménagé, terrasse, dépendance isolée.
- **DOUTEUX** — véranda, combles partiellement aménagés, sous-sol semi-habitable, ou intitulé que
  vous ne savez pas rattacher. **Utilisez DOUTEUX franchement** : chaque doute forcé en OUI ou
  NON pour faire propre est une fausse certitude qui se retrouvera dans un courrier client.

La règle candidate testée par le classeur est la plus simple possible : **« ne retenir que la
partie principale »**. Elle est déclarée suffisante pour une fiche si elle reproduit la somme des
lignes habitables à 1 m² près.

---

## Critères de décision — fixés avant, non renégociables

Détail et formules dans l'onglet « Décision T1 ». En résumé :

**Question 1 — lever le garde-fou sur les surfaces, oui ou non**

| Critère | Seuil | Bloquant |
|---|---|---|
| Fiches exploitables | ≥ 8 | oui |
| Fiches où « partie principale seule » reproduit la surface comparable (± 1 m²) | ≥ 90 % | oui |
| Lignes « partie principale » jugées non habitables | 0 | oui |
| Fiches avec au moins une ligne douteuse | ≤ 3 | non, indicatif |
| Écart médian créé par l'instruction actuelle du site | mesuré, sans seuil | non |

Le garde-fou n'est levé que si les trois critères bloquants sont atteints — et sa levée
s'accompagne obligatoirement de la réécriture de la question du site selon la règle observée.
**Même levé, le signal de surface continue d'exiger la fiche sous les yeux :** il n'existe pas de
surface comparable sans fiche.

Si un seul critère bloquant échoue : le garde-fou reste, et la question du site est reformulée
avant un éventuel T1 bis. Ce n'est pas un échec du test — c'est ce que le test sert à savoir.

**Question 2 — l'offre à 49 € est-elle achetable**

| Critère | Seuil | Bloquant |
|---|---|---|
| Entretiens menés jusqu'au bout | ≥ 8 | oui |
| Redisent en une phrase, sans aide, ce que le site vérifie | ≥ 75 % | oui |
| Ont compris ce que contient le dossier avant qu'on l'explique | ≥ 60 % | oui |
| Déclarent qu'elles achèteraient au prix affiché | ≥ 3 | non, indicatif |
| Ont demandé leur fiche sous 7 jours, sans relance | ≥ 2 | oui |

L'intention déclarée est notée mais ne décide de rien : dire oui à quelqu'un qu'on a en face de
soi ne coûte rien. La demande de fiche, elle, coûte un effort réel — c'est pour cela qu'elle est
bloquante et pas l'autre.

Les objections sont décomptées sans seuil : elles n'autorisent ni n'interdisent rien, elles disent
sur quoi travailler ensuite.

**Règle de rigueur.** Si un verdict déplaît, la seule réaction acceptable est de changer le
produit. Jamais les seuils.

---

## Ce que T1 ne pourra pas dire

À énoncer maintenant, pour ne pas l'oublier au moment de lire les résultats.

- **Dix cas ne mesurent rien au sens statistique.** Ces seuils sont des barrières d'arrêt, pas des
  estimations. « 9 fiches sur 10 » ne signifie pas « 90 % des fiches en France ».
- **Le volet B ne teste pas le prix.** Personne ne paiera pendant T1. Ce qu'on mesure, c'est la
  compréhension et les objections — pas la disposition réelle à payer, qui ne se mesure qu'en
  encaissant.
- **Le recrutement sera biaisé** vers des gens qui vous connaissent ou qui acceptent un rendez-vous
  d'inconnu. Les trois personnes hors entourage limitent le biais, elles ne le suppriment pas.
- **Une règle validée sur 10 fiches reste une hypothèse de travail.** Si elle est retenue, elle
  devra être réexaminée sur les premières fiches réelles des premiers clients.
