# Un compagnon de dépenses : prototype à éprouver

Recherche et conception : 30 septembre 2026. Page isolée : `web/tableau-demo.html`.
Cette maquette ne remplace ni l’accueil ni la version figée T2. Aucune veille, collecte,
connexion bancaire ou nouvelle offre commerciale n’est activée.

## Trois références, trois choix de conception

- [Papernest](https://www.papernest.com/) : entrée orientée vers une démarche et regroupement
  des contrats. Nous retenons le guidage court, pas son identité visuelle ni ses promesses
  commerciales. Ici, commencer ou corriger tient dans une boîte de saisie.
- [Rocket Money](https://www.rocketmoney.com/) : vue d’ensemble des dépenses et abonnements.
  Nous retenons une somme centrale et une liste modifiable, sans reprendre son accès aux comptes.
- [Snoop](https://snoop.app/) : suivi des dépenses et pistes adaptées. Nous retenons le retour
  le mois suivant et deux suggestions maximum, sans simuler une détection bancaire.

Les pages publiques ont été lues ; les parcours après inscription n’ont pas été testés.
Il ne s’agit ni d’une copie ni d’une évaluation exhaustive de ces produits.

## Avis publics : indices, pas validation utilisateur

Lecture qualitative de pages d’avis, sans échantillonnage représentatif ni vérification
indépendante des expériences relatées. Les doublons de texte de l’App Store ne sont pas
plusieurs témoignages. Aucun score global n’est utilisé comme argument produit.

- [Papernest, Trustpilot](https://fr.trustpilot.com/review/papernest.com) : des avis visibles
  datés du 29 septembre 2026 apprécient des questions claires, un enchaînement logique et
  l’accompagnement. Le filtre des avis négatifs n’a pas pu être chargé : lecture incomplète,
  aucun bilan positif/négatif représentatif n’en est tiré.
- [Rocket Money, App Store](https://apps.apple.com/us/app/rocket-money-bills-budgets/id1130616675?see-all=reviews) :
  un avis apprécie la vue consolidée ; d’autres décrivent des dates prévues incorrectes ou
  une modification manuelle remplacée par l’algorithme. Un avis de mars 2023 exprime aussi
  une déception face à des frais de négociation. Témoignages, pas constats audités ni preuve
  du fonctionnement actuel. Conséquence de conception : aucune correction silencieuse,
  et aucune confusion entre montant projeté et montant confirmé.
- [Snoop, Trustpilot](https://uk.trustpilot.com/review/snoop.app) : les avis visibles incluent
  des appréciations de la simplicité et des catégories personnalisées, mais aussi des
  difficultés de connexion bancaire (mai 2026) et de cycle de budget (août 2026).
  Conséquence : garder le contrôle manuel et distinguer les mois, sans banque obligatoire.

Le rejet des notifications commerciales est une préférence exprimée par le porteur du
projet ; ce corpus n’en mesure pas la fréquence chez les utilisateurs.

## Ce qui est effectivement interactif

- Sept postes fictifs au départ, dont une assurance annuelle : 950 €/mois en moyenne,
  11 400 €/an si les montants se maintiennent. Ce n’est ni un budget complet ni une économie.
- Ajouter, corriger, supprimer ; montant mensuel ou annuel, calcul en centimes.
  Courses et Autre sont disponibles à l’ajout, sans comparateur inventé.
- Passer de septembre à octobre : copie en mémoire des postes, tous à confirmer.
  Revenir à septembre ne remplace pas les réponses d’octobre. Aucun changement de facture
  n’est fabriqué : c’est l’essayeur qui modifie un montant.
- Confirmer ou corriger un montant ; décrire facultativement une cause. Une déclaration
  de changement tarifaire n’est jamais présentée comme lue sur une facture.
- Changements : comparaison des mêmes postes, ajout/retrait distinct d’une hausse/baisse.
- Pistes : deux démarches maximum, possibilité de les mettre de côté et de les retrouver.
  Chaque catégorie a un guide court. Mobile et box mènent aux outils existants dans un
  nouvel onglet, sans transmettre les montants fictifs. Aucun tarif nouveau n’est affiché.
- État seulement en mémoire : un rechargement réinitialise l’exemple. Les clés des dépenses
  et contrats réels ne sont ni lues ni écrites. Le sélecteur commun conserve seulement le thème.

## Ce qui reste une décision produit

Il faut observer si les visiteurs comprennent « repris / à confirmer », trouvent une
prochaine action et souhaitent revenir. Le prototype ne valide pas leur intérêt.
Une version réelle demandera ensuite un historique durable et une reprise volontaire des
dépenses existantes ; pas de migration implicite. Les nouvelles catégories ne deviennent pas
pour autant des contrats soumis aux règles de résiliation.

La surveillance des offres nécessite des sources utilisables, leurs conditions, un mécanisme
de mise à jour et une règle de retrait. Aucun rythme automatique (deux jours, semaine ou mois)
n’est promis. Lecture de factures, notifications, compte et application native restent hors
périmètre. Pour énergie/assurance/logement/transport, les guides préparent une démarche :
ils ne constituent pas de nouveaux comparateurs.

## Vérification reproductible

`python3 -m pytest backend/test_tableau_demo.py -q`

Couvre les montants mensuels/annuels, une seule dépense, la confirmation en octobre,
le retour en septembre, les causes inconnues, les suppressions, les suggestions par poste,
les données réelles préservées, le rechargement, le clavier et les deux thèmes aux largeurs
320, 375, 390 et 1440 px. Les captures et la relecture visuelle complètent les assertions :
ce n’est pas un test sur des téléphones physiques ni un audit d’accessibilité complet.

## Ajustement du retour mensuel

Le montant principal ne mélange plus confirmé et repris : tant que des dépenses restent
à confirmer, leur nombre est mis en avant, leur montant est séparé et le sous-total confirmé
est explicitement partiel. L’annualisation porte seulement sur les montants confirmés.
Le bouton principal ouvre une vérification séquentielle avec progression, correction,
passage et reprise des postes encore non confirmés. Fermer ne valide pas la saisie.
La cause n’est demandée que lorsque le montant ou la fréquence est modifié.

La piste énergie aboutit désormais au [comparateur officiel du médiateur national de
l’énergie](https://comparateur-offres.energie-info.fr/compte/profil?profil=particulier),
consulté le 30 septembre 2026. Le départ vers ce site et le nouvel onglet sont annoncés ;
aucun montant fictif n’est transmis. Seule la page d’entrée a été vérifiée, pas une simulation
complète ni les offres finales.
