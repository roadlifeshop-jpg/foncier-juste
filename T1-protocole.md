# T1 — Protocole

**Huit à dix rendez-vous, deux questions, une exploration — pas une validation.**
Grille de collecte : `T1-grille-collecte.xlsx` (onglets « Volet A », « Volet B », « Décision T1 »).
Critères arrêtés le 17/09/2026, avant la première session.

---

## Les deux questions

**Question 1 — les surfaces.** Sur de vraies fiches 6675-M, quelles lignes peuvent être comparées
à la surface habitable que le site demande de mesurer ? **Où la comparaison échoue-t-elle ?**

Le site dit aujourd'hui deux choses qui ne se recouvrent peut-être pas :

> « La fiche décompose votre logement partie par partie, avec pour chacune une colonne
> *surface réelle*. **Additionnez ces surfaces**, ou reprenez le total si la fiche l'indique. »

> « Surface habitable du bien aujourd'hui — mesurée au sol, à l'intérieur des murs, pièces
> habitables uniquement, **hors garage, cave, et combles non aménagés**. »

Si la fiche porte une ligne pour le garage et une pour la cave, la première instruction les fait
entrer dans le total et la seconde les exclut. L'écart qui en résulte n'a alors rien à voir avec la
situation du propriétaire : il est fabriqué par nos propres questions.

**Question 2 — l'offre.** Pour des propriétaires correspondant au client que nous pouvons servir
aujourd'hui, le parcours et le dossier à 49 € sont-ils compréhensibles et assez utiles pour qu'ils
envisagent réellement l'achat ? Quelles objections, en particulier sur l'obtention de la fiche, les
justificatifs et le prix ?

Les deux questions sont distinctes et ne se compensent pas : un produit compris mais fondé sur une
comparaison bancale reste invendable, et l'inverse aussi.

---

## Ce que T1 est, et ce qu'il n'est pas

**C'est une exploration destinée à trouver les cas où nos règles échouent.** Pas une campagne de
validation. Huit à dix fiches ne démontrent rien : elles peuvent seulement révéler des situations
auxquelles nous n'avions pas pensé.

Conséquence directe, écrite dans les formules : **aucun résultat du volet A ne lève le garde-fou
sur les surfaces.** Même si la règle candidate fonctionne sur les dix fiches, la sortie de l'onglet
Décision est *« dossier à présenter — règle non utilisable tant qu'elle n'est pas validée »*. La
règle de comparaison sera présentée avec ses exceptions, validée explicitement, et seulement
ensuite pourra déclencher une vente. Une règle qui ne casse jamais sur dix cas n'est pas une règle
fiable : c'est une règle qui n'a pas encore rencontré son contre-exemple.

**Cherchez donc les contre-exemples.** Une fiche banale de plus n'apprend presque rien. Recrutez
délibérément des biens susceptibles de mettre la règle en défaut : véranda, combles aménagés ou
semi-aménagés, sous-sol habitable, dépendance attenante, appartement avec cave et parking, maison
avec extension. Visez **au moins trois biens atypiques** sur les dix.

---

## Ce qui reste fermé pendant tout T1

- **Paiements en mode test.** La clé Stripe déployée est une clé de test (vérifié le 17/09/2026 :
  les sessions créées portent le préfixe `cs_test_`). Aucun encaissement réel n'est possible tant
  qu'elle n'est pas remplacée.
- **Site hors des moteurs de recherche** (`noindex`, `robots.txt`).
- **Aucune vente proposée en entretien.** On ne vend pas à quelqu'un dont on est précisément en
  train de mesurer la compréhension.

---

## Qui interroger

Le client que nous pouvons servir aujourd'hui, c'est-à-dire cinq conditions réunies :

1. propriétaire d'un logement en France, **hors Alsace-Moselle** (Bas-Rhin, Haut-Rhin, Moselle :
   régime du Livre foncier, le produit ne s'y applique pas) ;
2. dans l'un des **20 départements couverts** par nos données de marché : 06, 13, 21, 30, 31, 33,
   34, 35, 38, 42, 44, 49, 51, 59, 63, 69, 72, 75, 76, 83 ;
3. maison ou appartement, entre 8 et 400 m² ;
4. **a la fiche 6675-M, ou accepte de la demander** ;
5. reçoit et paie une taxe foncière à son nom.

**Objectif : 10 personnes. Plancher : 8.**

### Deux populations, jamais mélangées

| Groupe | Qui | Ce qu'on y mesure |
|---|---|---|
| **G1** | a déjà sa fiche 6675-M | **l'usage** : suit-il le parcours jusqu'au bout sans aide, identifie-t-il seul les pièces à joindre ? |
| **G2** | doit la demander | **l'engagement** : demande-t-il effectivement sa fiche sous 7 jours, sans relance ? |

**La demande de fiche ne se mesure que sur G2.** Pour G1 la question n'a aucun sens : on note
« Sans objet (G1) », jamais NON — un NON fausserait le taux en comptant comme un renoncement
quelqu'un qui avait déjà le document.

**Visez au moins quatre personnes en G2.** C'est la situation du visiteur ordinaire : un
échantillon composé uniquement de G1 ne dirait rien de l'obstacle principal du service, et la
sortie du volet B afficherait « échantillon incomplet ».

Cherchez aussi **au moins trois personnes hors de votre entourage proche** : un proche comprend
votre projet avant de lire la page, ce qui détruit exactement ce que le volet B mesure.

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
(`.gitignore : *.xlsx`). Les verbatims sont recopiés mot à mot puis expurgés de tout élément
identifiant : « ma maison de Nantes, rue X » devient « ma maison ».

Les résultats présentés ne contiendront que des codes, des surfaces et des verbatims anonymisés.

---

## Déroulé d'une session — 45 minutes

**L'ordre est impératif. L'inverser invalide la session.**

1. **(10 min) Le diagnostic, à l'aveugle.** La personne fait le parcours seule, sans avoir ouvert
   sa fiche et sans aucune aide de votre part. Vous notez ce qu'elle saisit et votre appréciation
   de sa certitude — onglet « Grille de collecte », colonnes E à J.
   **Observation à porter au volet B, colonne H :** est-elle allée au bout sans aide ? Une aide
   donnée, même minime, se note NON — le visiteur réel n'aura personne à côté de lui.
2. **(5 min) Ce que le moteur a répondu.** Colonnes P à R de la grille d'origine, sans commentaire
   de votre part.
3. **(15 min) On ouvre la fiche ensemble — volet A.** Pour G1, la fiche est là ; pour G2, utilisez
   celle qu'elle aura demandée, ou reportez cette étape à un second rendez-vous. Vous recopiez
   **chaque ligne portant une surface**, y compris celles qui paraissent hors sujet. Pour chacune,
   deux jugements distincts : cette partie est-elle habitable au sens de notre question, et le
   propriétaire l'aurait-il comptée dans sa mesure ? Puis colonnes K à O de la grille d'origine.
   **Dès qu'une ligne ne rentre dans aucune case, décrivez le cas en colonne T.** C'est le résultat
   recherché, pas un incident de collecte.
4. **(15 min) L'entretien — volet B.** Trois choses notées séparément, jamais fondues :
   - **ce qu'elle comprend** — sait-elle redire en une phrase ce que le site vérifie, a-t-elle
     compris le résultat gratuit, sait-elle ce qu'elle recevrait pour 49 € ?
   - **ce qu'elle fait** — a-t-elle suivi le parcours sans aide, sait-elle dire seule quelles
     pièces elle devrait joindre ?
   - **ce qu'elle dit** — achèterait-elle, que pense-t-elle du prix, quel prix cite-t-elle ?
   La question « qu'est-ce qui vous empêcherait de l'acheter ? » se pose **avant** toute mention du
   prix. Vous ne défendez jamais le produit ; les objections se recopient mot à mot.
5. **(après 7 jours, G2 uniquement) Une seule vérification.** A-t-elle demandé sa fiche, sans
   relance de votre part ? Colonne J du volet B. Pour G1 : « Sans objet (G1) ».

---

## Comment trancher, ligne par ligne (volet A)

- **Habitable au sens de notre question : OUI** — pièce d'habitation que la personne compterait en
  mesurant chez elle.
- **NON** — garage, cave, grenier non aménagé, terrasse, dépendance isolée.
- **DOUTEUX** — véranda, combles partiellement aménagés, sous-sol semi-habitable, ou intitulé que
  vous ne savez pas rattacher. **Utilisez DOUTEUX franchement** : chaque doute forcé en OUI ou NON
  pour faire propre est une fausse certitude qui se retrouvera dans un courrier client.

La règle candidate testée par le classeur est la plus simple possible : **« ne retenir que la
partie principale »**. Elle est réputée fonctionner sur une fiche si elle reproduit la somme des
lignes habitables à 1 m² près. **Fonctionner sur cet échantillon ne la rend pas utilisable.**

---

## Ce que le test produit — et qui décide quoi

### Volet A — un dossier, pas une autorisation

| Ce qui est observé | Repère | Ce que ça dit |
|---|---|---|
| Fiches exploitables | ≥ 8 | en dessous, la discussion n'a pas d'objet |
| Taux de réussite de la règle candidate | *aucun repère chiffré* | à présenter tel quel ; un taux élevé n'autorise rien |
| **Fiches où la règle échoue** | *à décrire une par une* | **c'est le résultat recherché** |
| Lignes « partie principale » jugées non habitables | 0 | **disqualifiant dans ce sens seulement** |
| Fiches avec au moins une ligne douteuse | à présenter | un client seul fera pire |
| Écart médian créé par l'instruction actuelle | mesuré | à corriger quelle que soit la suite |

Sorties possibles : *en attente*, *règle candidate invalidée*, ou *dossier à présenter*.
**Aucune ne dit « garde-fou levé ».**

La levée est une décision séparée, prise après présentation des résultats **et** des exceptions.
Si elle intervient, elle s'accompagne obligatoirement de la réécriture de la question du site selon
la règle validée — et le signal de surface continuera d'exiger la fiche sous les yeux : il n'existe
pas de surface comparable sans fiche.

### Volet B — trois signaux, jamais additionnés

**Aucun de ces signaux, pris seul, ne prouve une vente.** Ils se lisent ensemble, avec les
objections, et ne remplacent pas la seule preuve réelle, qui est un encaissement.

| Signal | Ce qu'on regarde | Ce que ça vaut |
|---|---|---|
| **Comprendre** | redit en une phrase ce que le site vérifie (≥ 75 %) · a compris le contenu du dossier à 49 € (≥ 60 %) · a compris le résultat gratuit | les deux premiers bloquent **dans un seul sens** : en dessous, on ne peut pas vendre ; au-dessus, rien n'est acquis |
| **Faire** | a suivi le parcours sans aide · a identifié seul les pièces à joindre · **[G2] a demandé sa fiche sous 7 j** | le plus solide, parce qu'il coûte un effort réel — mais demander un document n'est pas acheter |
| **Dire** | achèterait avant l'annonce du prix · trouve 49 € acceptable · prix cité spontanément | le plus fragile : dire oui à quelqu'un qu'on a en face de soi ne coûte rien |

Sorties possibles : *en attente*, *échantillon incomplet* (aucun G2), *parcours à reprendre*,
*offre à clarifier*, ou *aucun blocage identifié*. Cette dernière est la plus favorable possible et
**n'autorise rien** : la décision d'ouvrir les paiements se prend séparément et dépend aussi des
informations légales (`INFORMATIONS-LEGALES.md`).

Les objections sont décomptées sans repère : elles disent sur quoi travailler ensuite, à croiser
avec le groupe G1/G2.

**Règle de rigueur.** Si un résultat déplaît, la seule réaction acceptable est de changer le
produit. Jamais les repères.

---

## Ce que T1 ne pourra pas dire

- **Huit à dix cas ne mesurent rien au sens statistique.** « 9 fiches sur 10 » ne signifie pas
  « 90 % des fiches en France ».
- **Le volet B ne teste pas le prix.** Personne ne paiera pendant T1 : on mesure la compréhension,
  l'usage et les objections, pas la disposition réelle à payer.
- **Le recrutement sera biaisé** vers des gens qui vous connaissent ou acceptent un rendez-vous
  d'inconnu. Les trois personnes hors entourage et les quatre G2 limitent le biais sans le
  supprimer.
- **Une règle qui survit à dix fiches reste une hypothèse.** Si elle est validée, elle devra être
  réexaminée sur les premières fiches réelles des premiers clients.
