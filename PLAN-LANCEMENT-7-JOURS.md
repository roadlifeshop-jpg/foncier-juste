# Obtenir les premiers visiteurs de Dépense·Juste

Plan de lancement sur sept jours, sans publicité payante.
Rédigé le 18 septembre 2026, sur la branche `refonte-trois-outils`.
`main`, la production et Vercel n'ont pas été touchés. Aucun texte de ce document
n'a été envoyé ni publié.

---

## 0. Ce que ce document est, et ce qu'il n'est pas

**Il est** : un inventaire de ce que la branche peut offrir à un visiteur, une
vérification du paysage français sur nos trois sujets, deux publics, trois
sujets, trois canaux, les textes en brouillon, les critères de décision fixés
avant de commencer, et une recommandation franche à la fin.

**Il n'est pas** : une étude de marché chiffrée. Je n'ai **aucune donnée de
volume de recherche**, **aucun classement Google**, **aucune estimation de
trafic** — et je n'en fabrique pas. Les seuls chiffres de ce document sont
soit sourcés et datés, soit de l'arithmétique sur nos propres envois, dite
comme telle.

**Ce que je n'ai pas pu vérifier dans cette session**, et que je ne présenterai
donc pas comme un canal recommandé :

- **Reddit** (r/france, r/vosfinances, r/immobilier) : le domaine est inaccessible
  à l'outil de consultation web dont je dispose. Je n'ai lu aucune règle, aucun
  fil, aucune audience. Section 7.4 pour ce qu'il faudrait vérifier avant d'y aller.
- **Les groupes Facebook** : contenus derrière authentification, règles non lisibles.
- **Le rendu déployé** : la prévisualisation Vercel est protégée par
  l'authentification du projet. Tout ce que je dis des pages vient de la lecture
  des fichiers de la branche, pas d'une page servie.

---

## 1. Faits vérifiés, avec sources et dates

Ce tableau est la base de tout le reste. Chaque affirmation du plan qui s'appuie
sur un fait renvoie ici.

### 1.1 Le calendrier de la taxe foncière 2026 — le seul élément de saison solide

| Fait | Source | Date de la source |
|---|---|---|
| Avis 2026 en ligne **à partir du 27 août 2026** (non mensualisés) et **du 19 septembre 2026** (mensualisés) | impots.gouv.fr, FAQ « À quelle date vais-je recevoir mon avis de taxe foncière » | page modifiée **17/09/2026** |
| Date limite de paiement : **15 octobre 2026** (autres moyens), **20 octobre 2026** (internet, smartphone, tablette) | impots.gouv.fr, deux pages d'échéance dédiées | échéances **2026** |
| Revalorisation forfaitaire des valeurs locatives 2026 : **coefficient 1,008, soit +0,8 %**, d'après l'IPCH de novembre 2025 | impots.gouv.fr, FAQ « Comment est calculée ma taxe foncière ? Pourquoi a-t-elle augmenté en 2026 ? » | page modifiée **03/09/2026** |
| Les taux sont **votés chaque année par les collectivités** (commune, intercommunalité, syndicat, établissement public foncier) | même page | 03/09/2026 |
| **Cette page officielle n'explique pas comment vérifier sa valeur locative cadastrale.** Elle dit ce qu'elle est et comment elle est revalorisée. | même page, lecture intégrale | 03/09/2026 |
| « La réclamation ne vous dispense pas du paiement de votre impôt » ; un sursis de paiement peut être demandé | impots.gouv.fr, « Comment puis-je contester mon avis » | page modifiée **07/07/2026** |
| Réclamation contentieuse : avant le 31 décembre de l'année suivant la mise en recouvrement — pour un avis 2026, **jusqu'au 31 décembre 2027** | art. R*196-2 LPF, cité dans notre guide | vérifié dans la branche le 17/09/2026 |
| Exonération temporaire de deux ans des constructions neuves | art. 1383 CGI, BOFiP BOI-IF-TFB-10-60 | doctrine en vigueur |

**Ce que ces faits impliquent, et qui est contre-intuitif.** La part automatique
n'augmente que de **0,8 %** cette année — la plus faible hausse depuis plusieurs
années. Un propriétaire dont l'avis grimpe nettement plus ne peut donc pas
l'imputer à la revalorisation nationale. Il reste trois causes :

1. le **taux voté** par sa commune ou son intercommunalité — cela ne se conteste
   pas par une réclamation ;
2. la **fin d'une exonération** temporaire — cela ne se conteste pas non plus, et
   **notre outil ne le détecte pas** (limite réelle, section 4.1) ;
3. une **donnée sur le logement** — c'est le seul terrain où une réclamation a un
   sens, et c'est exactement le périmètre de notre outil.

C'est le message le plus utile et le plus différenciant que nous puissions
porter en septembre 2026. Il a aussi le mérite de **réduire** les attentes au
lieu de les gonfler : dans la majorité des cas, la hausse n'est pas contestable.

### 1.2 Les deux sujets consommation

| Fait | Source | Date |
|---|---|---|
| Garantie légale de conformité : **2 ans** à partir de la délivrance, pour un bien neuf, d'occasion **ou reconditionné** | service-public.gouv.fr **F11094** | « Vérifié le **17 août 2026** » |
| Présomption d'antériorité : **24 mois** (bien neuf ou numérique) / **12 mois** dans un onglet explicitement intitulé « **Bien d'occasion ou bien reconditionné** » | même fiche, citations relevées mot à mot | 17/08/2026 |
| Information avant reconduction tacite : **au plus tôt trois mois, au plus tard un mois** avant le terme ; à défaut, résiliation gratuite à tout moment à compter de la reconduction, et **remboursement des sommes versées d'avance sous trente jours** | service-public.gouv.fr **F33991**, art. L215-1 c. conso. | consulté le 18/09/2026 |
| Résiliation en ligne obligatoire (« trois clics ») depuis le **1er juin 2023** | art. L215-1-1 c. conso. | déjà dans `regles.js` |
| **SignalConso** (signal.conso.gouv.fr) : signalement gratuit à la DGCCRF, visible immédiatement par ses agents | signal.conso.gouv.fr / service-public F47157 | consulté le 18/09/2026 |

**Vérification faite deux fois, exprès.** Une première lecture automatique de la
fiche F11094 m'a rendu « neuf **et reconditionné** : 24 mois », ce qui aurait
contredit notre page `produit-defectueux-que-faire.html`. J'ai relu la fiche en
demandant les phrases mot à mot : service-public place bien le reconditionné dans
l'onglet « Bien d'occasion ou bien reconditionné », à **12 mois**. **Notre page
est juste, aucune correction n'est nécessaire.** Le texte de loi (art. L217-7 c.
conso.) ne nomme pas le reconditionné : il dit 24 mois, et 12 mois « pour les
biens vendus d'occasion ». Notre rédaction suit l'État sur la qualification.

### 1.3 Un manque dans notre propre guide, constaté au passage

`resilier-un-abonnement.html`, `abonnements.html` et `regles.js` ne mentionnent
**nulle part** le remboursement des sommes versées d'avance **sous trente jours**
quand l'information avant reconduction n'a pas été donnée (art. L215-1, al. 3).
C'est la conséquence la plus concrète de la règle, et elle manque.

Je ne l'ai pas ajouté : ce travail est un plan, pas une passe de contenu. À
décider séparément. Vérifié par `grep` sur la branche le 18/09/2026.

### 1.4 Ce que permet réellement notre mesure — c'est le point faible du plan

| Fait | Source | Date |
|---|---|---|
| **Rétention des logs d'exécution sur le plan Hobby : 1 heure** (Pro : 1 jour) | docs Vercel, *Runtime Logs > Limits* | doc mise à jour **28/08/2026** |
| Vercel Web Analytics sur Hobby : **50 000 événements/mois**, **fenêtre de restitution 1 mois**, **pas d'événements personnalisés**, **pas de paramètres UTM** | docs Vercel, *Pricing for Web Analytics* | doc mise à jour **25/08/2026** |
| Web Analytics : **aucun cookie tiers**, visiteur identifié par un **hachage de la requête**, session **jetée après 24 h** ; collecte l'URL, le **référent**, les paramètres de requête filtrés, la **géolocalisation ville**, l'OS, le navigateur, le type d'appareil | docs Vercel, *Privacy and Compliance* | doc mise à jour **26/06/2026** |

Et trois constats faits sur la branche elle-même (`grep`, 18/09/2026) :

- **`page_vue` ne dit pas quelle page.** L'événement est émis à l'identique par
  `index.html`, `taxe-fonciere.html`, `abonnements.html` et `garanties.html`, et
  la requête part toujours vers `/api/track`. Impossible de distinguer une visite
  de l'accueil d'une visite de l'outil taxe foncière.
- **`resultat_affiche` est émis par deux outils différents** — `taxe-fonciere.html`
  et `garanties.html` — sans champ pour les séparer.
- **Les trois guides n'émettent rien du tout.** `guide-erreurs-taxe-fonciere.html`,
  `resilier-un-abonnement.html` et `produit-defectueux-que-faire.html` n'appellent
  pas `/api/track`. Or ce sont précisément les pages d'arrivée du plan.

**Conclusion sans détour : en l'état, une campagne de sept jours est
immesurable.** Une visite du mardi est effacée des logs le mardi une heure plus
tard, et si on la voyait, on ne saurait pas quelle page a été vue. Les seuls
`outil_utilise` (abonnements) et `diagnostic_demarre` (taxe foncière) sont
univoques — et ils disparaissent aussi au bout d'une heure.

Les options sont en section 8. C'est **la première décision à prendre**, avant
tout envoi.

---

## 2. Inventaire : ce que la branche peut offrir à un visiteur

Douze pages. Voici celles vers lesquelles on peut envoyer quelqu'un, et ce
qu'il y trouve réellement.

| Page | Volume | Ce qu'un visiteur y fait | Utilisable comme page d'arrivée ? |
|---|---|---|---|
| `index.html` | ~1 130 mots | Comprend les trois outils, voit trois exemples fictifs marqués comme tels, lit les six principes (« aucune économie annoncée », « un service privé, pas un site officiel ») | Oui, mais c'est un carrefour : à éviter quand on connaît déjà le besoin |
| `taxe-fonciere.html` | ~6 270 mots | Questionnaire en 3 étapes, 34 917 communes, résultat en 5 blocs numérotés, PDF gratuit | **Oui — page d'arrivée principale du plan** |
| `guide-erreurs-taxe-fonciere.html` | ~915 mots | Lit sur quoi repose le calcul, **le piège de la surface pondérée**, les écarts fréquents, comment obtenir la fiche 6675-M, les délais | **Oui — meilleure porte d'entrée pour qui doute encore** |
| `garanties.html` | ~1 180 mots | Six questions + date de réception optionnelle, obtient les voies ouvertes, les pièces, les limites | **Oui** |
| `produit-defectueux-que-faire.html` | ~1 075 mots | Lit les deux garanties légales, **pourquoi 24 et 12 mois ne sont pas la même chose**, le vice caché, et que le droit à la réparation européen **n'est pas applicable** | **Oui** |
| `abonnements.html` | ~1 960 mots | Saisit ses abonnements **à la main**, obtient un coût mensuel et annuel, des pistes par ligne | Oui, mais friction forte (section 5.1) |
| `resilier-un-abonnement.html` | ~950 mots | Lit ce que la loi impose au professionnel et ce qui dépend du contrat | Oui |
| `sources.html` | ~555 mots | Vérifie nos sources et leurs dates | Non — mais c'est **l'argument de crédibilité** à citer |
| `mentions-legales.html` | ~525 mots | **Voit un avertissement « Brouillon non finalisé »** | **Non. Bloquant, section 6.1** |
| `confidentialite.html` | ~1 245 mots | Lit ce qui est conservé et où | Non, mais à citer |
| `cgv.html`, `succes.html` | — | Vestiges de l'offre payante, toujours au nom de Foncier·Juste | Non (voir `MISE-EN-LIGNE.md`) |

**Ce que l'inventaire change dans le plan.** Nous avons déjà, pour chaque sujet,
**un guide qui explique et un outil qui calcule**. Le couple guide → outil est la
bonne trajectoire : le guide établit la crédibilité, l'outil applique au cas.
Aucune page n'est à créer. C'est la raison pour laquelle ce plan ne demande
aucune nouvelle fonctionnalité.

---

## 3. Le paysage : ce que les sites fiables répondent déjà

### 3.1 L'État répond très bien — sauf sur un point

| Qui | Ce qu'il répond | Ce qu'il ne répond pas |
|---|---|---|
| **impots.gouv.fr** | Le calcul, le +0,8 % de 2026, les taux votés, comment contester, où payer | **Comment vérifier sa valeur locative cadastrale.** Vérifié sur la page dédiée du 03/09/2026 |
| **France Services** — 2 800+ lieux, 12 partenaires dont les Finances publiques, gratuit ; des agents DGFiP y tiennent des permanences | Un agent avec **accès à votre dossier réel** | Rien. Sur ce sujet, c'est mieux que nous |
| **service-public.gouv.fr** | F11094 (garanties, avec l'onglet occasion/reconditionné), F33991 (reconduction tacite) | Le calcul appliqué **à vos dates** |
| **SignalConso / DGCCRF** | Le signalement gratuit au régulateur | Quelle voie invoquer, dans quel délai, avec quelles preuves |
| **ANIL / réseau des ADIL** | Information logement gratuite et neutre, dans tous les départements | **La fiscalité locale n'est pas dans leur périmètre affiché** — vérifié le 18/09/2026. Conséquence directe : les ADIL ne sont **pas** un bon interlocuteur pour la taxe foncière |

**À dire franchement : pour un propriétaire qui peut se déplacer, un agent DGFiP
en France Services fait mieux que notre outil**, puisqu'il ouvre le dossier. Nos
avantages réels sont plus étroits, et il faut les nommer sans les gonfler :
disponible à 23 h sans rendez-vous, et surtout **il dit quoi demander** avant
d'écrire à l'administration.

### 3.2 Nous ne sommes pas seuls sur le créneau — c'est le constat le plus dur

| Acteur | Ce qu'il fait | Statut vérifié le 18/09/2026 |
|---|---|---|
| **recalcul-taxe-fonciere.fr** | Simulateur **gratuit** en 7 questions, « estimation anonyme, sans donnée personnelle », **sans inscription** + guides détaillés. Rapport de recalcul payant **à partir de 39 €** : surface pondérée, coefficients, étapes du barème, écart avec la valeur locative actuelle. Ne garantit ni remboursement ni économie. | **En activité**, guide mis à jour le **07/09/2026**, page dédiée « Taxe foncière 2026 : hausse de +0,8 % » |
| **2ndmarket.fr** | Page d'atterrissage « Contester sa taxe foncière : l'erreur cachée de la fiche 6675-M » — **liste d'attente**, demande un email, service **pas encore ouvert** | Non opérationnel |
| **Fermes de contenu juridique** (plusieurs cabinets, dont deux domaines quasi identiques, plus des blogs immobiliers) | Articles « taxe foncière trop élevée : erreur de surface », lettres types, pages sur la résiliation en 3 clics | Nombreuses, dont une datée du 16/05/2026 |

Trois conséquences qu'il faut accepter :

1. **Le pivot loin du dossier à 49 € était le bon choix.** Un concurrent vend le
   rapport ligne à ligne **39 €**, avec un simulateur gratuit en amont et des
   guides indexés. Nous serions arrivés plus cher et plus tard.
2. **Notre « différenciateur » sur le piège de la surface n'est pas exclusif.**
   Au moins un de ces sites explique déjà que comparer la surface cadastrale
   pondérée à la surface Carrez n'est pas un motif valable. Nous ne sommes pas
   les seuls à le dire. Nous sommes en revanche les seuls, à ma connaissance, à
   **refuser d'ouvrir quoi que ce soit** sur cette base dans l'outil lui-même.
3. **Le référencement sur « taxe foncière 2026 augmentation » n'est pas gagnable
   à sept jours, ni à sept semaines.** Des sites dédiés et déjà indexés occupent
   le sujet, et nous partons de `noindex`. Toute promesse de trafic de recherche
   en septembre serait un mensonge.

### 3.3 Où nous ajoutons réellement quelque chose

Après ces vérifications, il reste quatre choses, et seulement quatre :

1. **L'arithmétique appliquée à vos dates.** service-public donne la règle ;
   l'outil garanties dit, pour un achat du 3 mars 2025 livré le 11 mars 2025, que
   la présomption des 12 mois est passée mais que la garantie de deux ans court
   jusqu'au 11 mars 2027. C'est petit, c'est utile, et personne ne le fait
   gratuitement à votre place.
2. **Dire non.** L'outil refuse de traiter un écart de surface seul comme un
   motif, refuse de conclure sans la fiche, et annonce « rien à vérifier » quand
   c'est le cas. Un service payant n'a aucun intérêt à le faire.
3. **Signaler ce qui n'est pas applicable.** Le droit à la réparation européen
   est marqué **non transposé** au lieu d'être vendu comme un droit nouveau.
4. **Gratuit, sans compte, sans connexion bancaire, calcul dans le navigateur.**
   Notre concurrent revendique aussi l'anonymat sur son simulateur gratuit : ce
   n'est donc pas un avantage exclusif, seulement un pré-requis.

---

## 4. Public prioritaire n° 1 — propriétaires avec leur avis 2026 sous les yeux

**Qui, précisément.** Un propriétaire occupant qui a reçu ou consulté son avis
depuis le 27 août (ou le 19 septembre s'il est mensualisé), qui le trouve élevé
ou en hausse, et qui a jusqu'au 15 ou 20 octobre pour payer.

**Sous-segment à viser en premier**, parce que c'est là que notre moteur trouve
réellement quelque chose : propriétaire **depuis plus de dix ans**, ou dont le
logement **a changé** — dépendance démolie, cheminée supprimée, piscine comblée,
salle de bains refaite. La fiche d'évaluation, elle, n'a pas changé.

**Pourquoi ce public et pas un autre.** C'est le seul des trois pour lequel je
dispose d'un élément de saison **daté et officiel** : le document est dans les
mains des gens en ce moment, l'échéance est dans un mois, et l'administration a
publié le 3 septembre 2026 une page dédiée à « pourquoi a-t-elle augmenté ».
Quand l'État crée une FAQ pour une question, c'est qu'elle est posée. Je n'ai pas
besoin d'inventer un volume de recherche pour le savoir.

**Ce qu'il faut assumer.** Ce public est aussi le plus convoité (section 3.2), et
notre réponse sera souvent décevante : dans la majorité des cas, la hausse vient
du taux voté ou de la fin d'une exonération, et il n'y a rien à réclamer.

### 4.1 Limite à ne pas cacher

Notre outil ne détecte **ni** la fin d'une exonération temporaire (art. 1383
CGI), **ni** une hausse de taux votée. Un visiteur dont c'est la cause repart
avec « rien à vérifier » — réponse juste, mais qui ne lui explique pas son
augmentation. Le guide devrait le dire ; il ne le dit pas aujourd'hui. À décider
séparément, comme la section 1.3.

---

## 5. Public prioritaire n° 2 — un bien d'occasion ou reconditionné en panne après le 12e mois

**Qui, précisément.** Quelqu'un dont le téléphone reconditionné, l'ordinateur
d'occasion ou l'électroménager de seconde main tombe en panne **entre le 13e et
le 24e mois**, et à qui le vendeur répond que « la garantie est finie ».

**Pourquoi ce public.** C'est le cas où une réponse gratuite en deux minutes
change l'issue, et où l'erreur est quasi systématique — y compris chez les
vendeurs. La garantie légale **court toujours** : ce qui a basculé au 13e mois,
c'est uniquement la charge de la preuve. C'est écrit noir sur blanc par
service-public (fiche F11094, onglet « Bien d'occasion ou bien reconditionné »,
vérifiée le 17/08/2026), et l'outil calcule la date exacte du basculement.

**Ce qu'il faut assumer.** Aucun élément de saison. Et — contrairement au public
n° 1 — ces personnes ne savent pas qu'elles ont un problème vérifiable : elles
ont déjà entendu « c'est trop tard » et sont passées à autre chose. Elles ne
chercheront donc pas. C'est un public qu'on **atteint en le croisant**, pas en
l'attendant.

### 5.1 Le public écarté : les abonnements. Et pourquoi

Trois raisons, dans l'ordre de poids :

1. **La friction est réelle et voulue.** Il faut saisir chaque abonnement à la
   main. C'est le prix de « aucune connexion bancaire », et c'est un choix que je
   ne remets pas en cause — mais pour un premier visiteur, une application
   bancaire qui liste ses prélèvements automatiquement demande zéro effort.
2. **Le terrain est le plus encombré des trois** : banques, agrégateurs, sites de
   lettres types, cabinets d'avocats en référencement.
3. **La bonne date n'est pas maintenant, et elle est calculable.** Beaucoup de
   contrats à échéance au 31 décembre imposent au professionnel d'informer
   **entre trois mois et un mois avant le terme** — soit, pour ces contrats, une
   fenêtre du **1er octobre au 30 novembre**. C'est le moment où la question
   « ai-je reçu ce courrier ? » devient concrète, et où l'outil sert vraiment.

Donc : les abonnements ne sont pas une perte de temps, ils sont **en retard d'une
quinzaine de jours**. Ils reviennent au plan début octobre.

---

## 6. Trois blocages à lever avant le jour 1

### 6.1 Les mentions légales — bloquant absolu

`mentions-legales.html` affiche aujourd'hui « **Brouillon non finalisé** » et
« en l'état, ce document **n'est pas légalement valable** ». Cinq champs
n'attendent aucune immatriculation : nom et prénoms, adresse à publier,
téléphone, directeur de la publication, email de contact.

**Envoyer des visiteurs sur un site qui affiche lui-même qu'il n'est pas en
règle est le plus sûr moyen de perdre la crédibilité que tout le reste du site
cherche à construire.** Aucun envoi avant que ces cinq champs soient renseignés.
Et `noindex` n'y change rien : il empêche le référencement, pas l'accès.

### 6.2 L'adresse du site contredit son nom

Le site s'appelle **Dépense·Juste** et vit à
`https://foncier-juste.vercel.app`. Pour le référencement, c'est secondaire.
Pour un lancement en **contact direct**, c'est un vrai problème : on envoie un
lien qui porte un autre nom et un sous-domaine de plateforme. La première
réaction d'un destinataire prudent est de se demander si c'est le bon site.

Trois issues, à décider :

- **Assumer** et le dire dans le message (« le site s'appelle encore
  foncier-juste dans l'adresse, le nom définitif n'est pas arrêté ») — gratuit,
  honnête, et un peu bancal ;
- **acheter un domaine** avant de lancer — quelques euros, une demi-journée, et
  cela règle aussi la question du nom ;
- **reporter le lancement** jusqu'au choix du nom — cohérent, mais on perd la
  saison de la taxe foncière, qui ne revient qu'en août 2027.

Ma recommandation : la deuxième, **si et seulement si** le nom est arrêté cette
semaine. Sinon la première, en l'assumant dans le texte — c'est déjà ce que fait
le pied de page du site.

### 6.3 La mesure

Voir section 8. Décision à prendre avant le premier envoi, sinon les sept jours
ne produiront aucun chiffre exploitable.

---

## 7. Trois canaux réalistes — et ceux que j'écarte, règles vérifiées

Je commence par ce que j'écarte, parce que c'est ce qui rend les trois autres
crédibles.

### 7.1 Écarté : répondre sur les forums de consommation avec un lien

C'est le réflexe évident. Les règles l'interdisent, et je les ai lues.

- **Forum Que Choisir** (actif : dernier message du 17/09/2026 ; sections
  Immobilier-Logement, Téléphonie-Internet, Électroménager, Droit-Justice —
  exactement nos sujets). La charte interdit « la publicité, l'agression
  commerciale, les liens vers des sites de marque et le spam », prévoit qu'un
  message faisant référence à une **affiliation professionnelle** peut être
  rejeté ou amendé, et la sanction va de l'avertissement au **bannissement**. Le
  BBCode de lien a été **supprimé le 5 octobre 2022** ; seules les URL en texte
  brut subsistent.
- **Droit-Finances** : « L'utilisation des messages du forum à des fins
  commerciales et publicitaires est interdite. La mention de téléphone, d'adresses
  email ou de **liens URL sont prohibés**, sauf si cette mention renvoie à des
  institutions ou organismes **à but non lucratif**. » Nous sommes un éditeur
  professionnel : l'exception ne nous couvre pas.

**Verdict : perte de temps comme canal de diffusion, et risque de bannissement.**
En revanche ces forums sont une excellente **source d'écoute** : allez y lire
comment les gens formulent leurs questions, sans rien y publier. C'est gratuit et
sans risque.

### 7.2 Écarté : Le Journal du Hacker, la presse, le référencement

- **Le Journal du Hacker** : inscription **sur invitation**, audience orientée
  logiciel libre et open source. Notre site n'est ni l'un ni l'autre. Mauvais
  ajustement, et une barrière à franchir pour rien.
- **La presse locale** : c'est le meilleur canal gratuit… **plus tard**. Avec des
  mentions légales en brouillon, un nom provisoire et aucun utilisateur réel,
  parler à un journaliste maintenant c'est griller la seule cartouche qu'on a.
- **Le référencement naturel** : à ouvrir le jour 1 (le script existe), mais
  **compter zéro visiteur de recherche sur sept jours**. L'indexation d'un site
  neuf sur des requêtes déjà occupées par des sites dédiés ne se mesure pas en
  jours.

### 7.3 Les trois canaux retenus

Je dois être exact sur un point : **deux seulement peuvent amener un visiteur en
sept jours**. Le troisième ne paie que plus tard, et doit être lancé maintenant
pour cette raison.

#### Canal 1 — Votre propre audience, en deux temps *(le seul à livraison certaine)*

**Temps A — 20 à 30 messages individuels nominatifs.** Pas une diffusion : un
message à une personne dont vous savez qu'elle est propriétaire, ou qu'elle a eu
un appareil en panne. Texte T1 / T2 en section 10.

**Temps B — une publication depuis votre compte personnel** (LinkedIn, Facebook,
au choix — c'est votre mur, aucune règle de modération ne s'y oppose). Texte T4.

- *Ce que la personne cherche* : rien. Elle reçoit. C'est la différence
  fondamentale avec tous les autres canaux, et la raison pour laquelle c'est le
  seul qui fonctionne à coup sûr.
- *Page d'arrivée* : `guide-erreurs-taxe-fonciere.html` pour le public n° 1 (le
  guide rassure avant de demander quoi que ce soit), `garanties.html` pour le
  public n° 2 (là, l'outil est plus court que le guide).
- *Valeur trouvée* : la séparation des trois causes d'augmentation, ou la date
  exacte de basculement de la preuve.
- *Ce que nous mesurons* : le nombre de messages envoyés (connu),
  le nombre de réponses, et surtout les **5 sessions accompagnées** du jour 2 —
  d'où viennent les seules données solides de la semaine.
- *Ordre de grandeur attendu* : sur 30 messages, une dizaine de visites.
  **C'est de l'arithmétique sur nos propres envois, pas une estimation de
  marché.**

#### Canal 2 — Huit à dix intermédiaires qui reçoivent déjà ces questions

**Ce canal n'est pas là pour le trafic. Il est là pour détecter nos erreurs**
auprès de gens qui traitent ces dossiers toute la journée. Le formuler autrement
serait se mentir : un agent public ne relaiera pas un site privé.

Qui contacter, et pour quel sujet :

| Interlocuteur | Sujet | Pourquoi lui |
|---|---|---|
| Antenne locale **UFC-Que Choisir** ou **CLCV** | Garanties (public n° 2) | Ils traitent ces litiges en permanence |
| **France Services** de votre secteur | Taxe foncière (public n° 1) | 2 800+ lieux, 12 partenaires dont les Finances publiques, gratuit ; des agents DGFiP y tiennent des permanences |
| **Conciliateur de justice** de votre commune | Garanties | Litiges de consommation, avant le tribunal |

**Pas les ADIL** : j'ai vérifié, la fiscalité locale n'est pas dans leur
périmètre affiché. Les solliciter sur la taxe foncière, c'est se faire répondre
que ce n'est pas leur sujet — et perdre un interlocuteur utile pour plus tard.

- *Ce que nous demandons* : « est-ce exact, est-ce utile, que corrigeriez-vous ? »
  — **pas** « relayez-nous ». Texte T3.
- *Ce que nous mesurons* : réponses reçues sur envois faits, et **le nombre
  d'erreurs factuelles signalées**. Une erreur trouvée vaut plus que dix visites.
- *Attente réaliste* : 1 à 3 réponses sur 10. Zéro visiteur. C'est normal.

#### Canal 3 — Déclarer notre réutilisation de DVF sur data.gouv.fr

Le seul canal durable du plan, et celui que personne ne pense à utiliser. Nous
**réutilisons réellement** les Demandes de valeurs foncières de la DGFiP et le
Code officiel géographique : data.gouv.fr dispose d'un mécanisme officiel pour
déclarer une réutilisation.

Vérifié le 18/09/2026 : ouvert à **tout compte utilisateur**, champs obligatoires
**titre, URL, type** plus une description ; la réutilisation **apparaît sur la
page du jeu de données** ; l'URL doit pointer vers la réutilisation elle-même,
pas vers une page d'accueil ; et — citation de la documentation — « si la
réutilisation ressemble trop à un message promotionnel il est possible que nous
la supprimions ».

- *Page d'arrivée* : `taxe-fonciere.html`, qui est la page qui exploite
  effectivement DVF. Pas l'accueil : la documentation le demande explicitement.
- *Valeur trouvée* : pour le lecteur, un exemple concret de réutilisation de DVF.
  Pour nous, une présence durable sur un domaine en `.gouv.fr` et un lien
  légitime le jour où l'indexation sera ouverte.
- *Ce que nous mesurons* : publiée ou supprimée (binaire). Le trafic à sept
  jours sera proche de zéro, et ce n'est pas la raison de le faire.
- *Condition* : après les mentions légales. Déclarer une réutilisation qui pointe
  vers un site affichant « brouillon non finalisé » serait un mauvais calcul.

### 7.4 Si vous voulez tenter Reddit malgré tout

Je ne peux pas le recommander : le domaine est inaccessible à mes outils, je n'ai
lu **aucune** règle de sous-communauté. Ce qu'il faudrait vérifier vous-même
avant de publier quoi que ce soit :

1. la règle d'auto-promotion du sous-forum visé, dans sa barre latérale ;
2. si un compte neuf peut y publier un lien (beaucoup exigent une ancienneté) ;
3. si la réponse utile **sans lien** est acceptée — c'est souvent le seul usage
   toléré, et il n'amène aucun visiteur.

À faire après les sept jours, pas pendant : un bannissement le jour 3 coûterait
plus que les visites espérées.

---

## 8. La mesure : trois options, une recommandation

Rappel du problème (section 1.4) : **1 heure** de rétention des logs sur Hobby,
`page_vue` identique sur quatre pages, `resultat_affiche` partagé par deux
outils, et les trois guides muets.

| Option | Ce qu'elle donne | Ce qu'elle coûte | Verdict |
|---|---|---|---|
| **A. Ne rien changer** | Rien de durable. Seuls comptent les messages envoyés, les réponses reçues et les 5 sessions observées | 0 € et 0 modification de code | **Suffisant pour cette semaine**, parce que la valeur des sept jours est qualitative |
| **B. Activer Vercel Web Analytics** | Vues **par page** (le problème est résolu), **référent** (donc le canal), fenêtre **1 mois**, 50 000 événements, sans cookie tiers | Un script à ajouter sur 12 pages ; et surtout : la collecte s'étend à la **géolocalisation ville**, l'OS, le navigateur → **`confidentialite.html` devient faux s'il n'est pas mis à jour**. Pas d'événements personnalisés sur Hobby : « outil utilisé » restera invisible | **À décider par vous.** C'est la seule façon d'avoir des chiffres, et cela touche notre positionnement |
| **C. Corriger `/api/track`** (ajouter un champ `page` à la liste blanche) | Lève les collisions | Ne résout **pas** la rétention d'une heure. Beaucoup de travail pour rien | **Non** |

**Ma recommandation : A pour ces sept jours, et décider B ensuite, une fois
qu'on saura s'il y a quelque chose à mesurer.** Sept jours de contacts directs
produisent des dizaines de visites, pas des milliers : une feuille de papier
suffit, et les 5 sessions accompagnées apprennent davantage que n'importe quel
tableau de bord. Si vous choisissez B, la mise à jour de `confidentialite.html`
fait partie du travail, pas de l'après.

Note sur Search Console : soumettre le `sitemap.xml` exige de prouver la
propriété du domaine par une balise ou un fichier — donc une modification.
Sans cela, l'indexation se fera quand même, simplement plus lentement et sans
données. Ce n'est pas urgent dans cette semaine.

---

## 9. Les sept jours

Un seul jour vaut plus que tous les autres : le jour 2.

| Jour | Ce qu'on fait | Pourquoi ce jour-là |
|---|---|---|
| **J0** *(préalable, hors compte)* | Les cinq champs des mentions légales. Décision nom/domaine (6.2). Décision mesure (8). | Rien ne part avant |
| **J1** | Fusion, `scripts/ouvrir-indexation.sh`, les trois vérifications `curl` de `MISE-EN-LIGNE.md`. **Aucun envoi.** On ouvre les 12 pages sur téléphone et on les parcourt soi-même | Un lien mort au premier envoi coûte le contact. On vérifie avant |
| **J2** | **5 sessions accompagnées** : 5 personnes, leur avis 2026 en main, sur leur téléphone. On se taît et on note (grille T6) | **Le jour le plus important de la semaine.** Zéro utilisateur réel à ce jour : les 5 premiers vont montrer plus de défauts que tous nos tests |
| **J3** | Corriger **uniquement** ce que J2 a révélé. Aucune fonctionnalité | Corriger avant d'élargir, pas après |
| **J4** | Canal 1 temps A : 20 à 30 messages individuels (T1/T2), étalés dans la journée | Après correction, pas avant |
| **J5** | Canal 2 : 8 à 10 emails aux intermédiaires (T3) | Leurs réponses arrivent en quelques jours : il faut envoyer tôt |
| **J6** | Canal 3 : réutilisation data.gouv.fr (T5). Canal 1 temps B : la publication personnelle (T4) | Les deux actions « un vers plusieurs », une fois le site éprouvé |
| **J7** | Relance douce des non-réponses. Bilan contre les critères de la section 11 | Décision, pas prolongation |

**Plafond volontaire : une action de diffusion par jour à partir de J4.** Tout
envoyer le même jour rend les retours illisibles et empêche de corriger entre
deux vagues.

---

## 10. Textes en brouillon — aucun n'a été envoyé ni publié

### T1 — Message individuel court (SMS, WhatsApp) — public n° 1

> Tu as reçu ton avis de taxe foncière ? J'ai fait un outil gratuit qui dit si
> ça vaut le coup de vérifier ta fiche d'évaluation — celle que les impôts
> utilisent pour calculer. Cette année la part automatique n'augmente que de
> 0,8 %, donc si ta taxe a beaucoup grimpé, c'est ailleurs.
> Deux minutes, pas de compte, rien à payer : [lien]
> Et dis-moi si c'est incompréhensible, c'est surtout ça que je cherche à savoir.

*Pourquoi ce texte : le 0,8 % est vérifiable et surprend ; la demande d'avis
donne une raison de répondre ; et il ne promet aucune économie.*

### T2 — Email à un proche propriétaire — public n° 1

> Objet : ta taxe foncière 2026, et un outil que j'aimerais te faire casser
>
> Bonjour [Prénom],
>
> Ton avis de taxe foncière 2026 est disponible depuis fin août (mi-septembre si
> tu es mensualisé), et la date limite est le 15 octobre, ou le 20 si tu paies
> en ligne.
>
> J'ai mis en ligne trois outils gratuits, dont un sur la taxe foncière. Il ne
> promet aucune économie et ne fait aucune démarche à ta place. Il fait une seule
> chose : te dire si, dans ton cas, il y a quelque chose qui mérite d'être
> vérifié sur ta fiche d'évaluation — et souvent, il répond qu'il n'y a rien.
>
> Un point qui surprend tout le monde : cette année, la part calculée
> automatiquement n'augmente que de 0,8 %. Si ta taxe a nettement plus augmenté,
> c'est soit le taux voté par ta commune, soit la fin d'une exonération — deux
> choses qui ne se contestent pas — soit une donnée sur ton logement, et là oui.
>
> Le guide, si tu veux comprendre avant de répondre à des questions :
> [lien guide]
>
> Ce que j'attends de toi, honnêtement : que tu me dises où tu décroches. Pas de
> compte à créer, rien à payer, et ce que tu saisis ne quitte pas ton navigateur.
>
> [Prénom]
>
> PS : l'adresse du site porte encore l'ancien nom, « foncier-juste ». Le nom
> définitif n'est pas arrêté.

*Le PS règle le problème de la section 6.2 par l'honnêteté, au lieu de le laisser
créer un doute.*

### T3 — Email aux intermédiaires — canal 2

> Objet : outil d'information gratuit — votre avis avant que je le diffuse
>
> Bonjour,
>
> Je m'appelle [nom]. J'ai mis en ligne trois outils d'information gratuits pour
> les particuliers : vérification de sa taxe foncière, coût réel de ses
> abonnements, et voies ouvertes après un achat défectueux. C'est un site privé,
> sans lien avec l'administration ; il n'engage aucune démarche et ne représente
> personne.
>
> Je ne vous demande pas de le relayer. Vous recevez ces questions tous les
> jours ; je vous demande de me dire si ce que j'écris est exact, et ce que vous
> corrigeriez.
>
> Deux pages, selon ce qui relève de votre activité :
> — garanties après un achat défectueux : [lien]
> — erreurs fréquentes de taxe foncière : [lien]
>
> Chaque règle affichée porte son article, sa source officielle et la date à
> laquelle je l'ai vérifiée ([lien sources]). Ce qui n'est pas applicable est
> signalé : la directive européenne sur le droit à la réparation, par exemple,
> n'étant pas transposée en France, l'outil ne s'en sert pas.
>
> Toute erreur que vous me signalerez sera corrigée et datée.
>
> Cordialement,
> [nom, téléphone, email]

*La demande d'expertise est la seule qui donne une raison de répondre. La mention
de la directive non transposée prouve en une phrase que nous ne sommes pas une
ferme de contenu.*

### T4 — Publication depuis un compte personnel — canal 1 temps B

> Cette année, la partie automatique de la taxe foncière augmente de 0,8 %.
> C'est la plus faible hausse depuis plusieurs années.
>
> Donc si votre avis 2026 a beaucoup plus augmenté, l'explication est ailleurs :
> le taux voté par votre commune, la fin d'une exonération, ou une donnée sur
> votre logement. Les deux premières ne se contestent pas. La troisième, oui — et
> c'est celle que presque personne ne vérifie, parce qu'elle se trouve sur un
> document qu'il faut demander : la fiche d'évaluation.
>
> J'ai mis en ligne trois outils gratuits pour ça. Pas de compte, pas de
> paiement, pas de connexion bancaire, aucune économie annoncée. Ils disent ce
> qui mérite un contrôle, et quand il n'y a rien, ils le disent aussi.
>
> Un exemple de ce qu'ils refusent de faire : si la surface de votre fiche ne
> correspond pas à votre mètre ruban, l'outil ne vous dira pas que c'est une
> erreur. La surface cadastrale n'est pas de même nature : des correctifs
> peuvent l'augmenter comme la diminuer, et des mètres carrés fictifs s'ajoutent
> pour les équipements.
> Réclamer sur cette base, c'est perdre son temps et faire perdre le sien à un
> service qui traitera moins bien le dossier suivant.
>
> [lien]
>
> C'est tout neuf. Si quelque chose est faux ou incompréhensible, dites-le-moi.

*L'exemple de ce que l'outil refuse de faire est le meilleur argument de
crédibilité dont nous disposons — et il est vrai.*

### T5 — Fiche de réutilisation data.gouv.fr — canal 3

- **Titre** : *Repère de prix de vente par commune pour la vérification d'une taxe foncière*
- **Type** : Application
- **URL** : `https://[domaine]/taxe-fonciere.html`
- **Jeux de données à associer** : Demandes de valeurs foncières (DGFiP) ; Découpage administratif / Code officiel géographique
- **Description** :

> Outil gratuit d'aide à la vérification d'une taxe foncière pour les
> particuliers. Les transactions DVF sont agrégées par commune pour fournir un
> repère de prix de vente, affiché à côté du résultat du questionnaire. Millésime
> 2024, 20 départements, 379 171 transactions retenues après filtrage, soit
> 7 120 communes couvertes. Le référentiel des communes provient du Code
> officiel géographique 2026 et de la base des codes postaux de La Poste,
> diffusés par geo.api.gouv.fr — 34 917 communes au total, ce qui signifie que
> le questionnaire fonctionne partout mais que le repère de prix n'apparaît que
> pour une commune sur cinq.
>
> Précision importante sur l'usage des données : le repère DVF n'est **pas**
> utilisé comme motif fiscal. La taxe foncière repose sur une valeur locative
> cadastrale, pas sur les prix de vente ; le repère sert uniquement de contexte
> pour le lecteur. Les communes sans transaction comparable sont signalées comme
> telles au lieu d'être extrapolées.
>
> Calcul effectué dans le navigateur, sans compte ni envoi des réponses.

*Descriptive et non promotionnelle, comme la documentation l'exige. La phrase sur
le non-usage fiscal de DVF est là parce qu'elle est vraie, et parce qu'un
producteur de données la lira avec intérêt.*

### T6 — Grille d'observation des 5 sessions du J2

Un tableau par personne. **On note, on ne souffle pas.** En reprenant la
séparation posée pour T1 : comprendre, faire et dire sont trois choses
différentes, et aucune ne prouve les autres.

| Ce qu'on note | Comment |
|---|---|
| Arrive-t-elle à un résultat **sans aide** ? | oui / non / après combien de temps |
| **Où** hésite-t-elle ? | numéro d'étape, question exacte |
| **Comprendre** — sait-elle redire ce que le résultat dit, et ce qu'il ne dit pas ? | ses mots, notés tels quels |
| Comprend-elle la différence entre surface réelle et surface pondérée ? | oui / non / « pas sûr » |
| Comprend-elle qu'elle doit **demander sa fiche** ? | oui / non |
| **Faire** — demande-t-elle sa fiche dans les 7 jours ? | vérifié au J7, c'est le seul acte coûteux |
| **Dire** — que dit-elle qu'elle ferait ? | noté séparément. **Ne prouve rien** |
| A-t-elle cru à un site officiel ? | oui / non — si oui, défaut grave à corriger |
| Ce qu'elle a cherché et n'a pas trouvé | verbatim |

---

## 11. Critères de décision, fixés avant de commencer

Écrits maintenant pour ne pas être réinterprétés au J7 en fonction du résultat.

**Ce qui vaut un feu vert pour continuer :**

- **au moins 3 des 5 sessions** du J2 arrivent à un résultat **sans aide** ;
- **au moins 3 des 5** savent redire ce que le résultat **ne** dit **pas** ;
- **au moins 1 personne** demande effectivement sa fiche 6675-M dans les 7 jours ;
- **au moins 1 réponse** d'intermédiaire, même critique.

**Ce qui doit faire arrêter la diffusion et revenir au produit :**

- **4 sessions sur 5** ne comprennent pas la distinction surface réelle / surface
  pondérée → c'est un problème de produit, pas de diffusion. Diffuser plus ne
  ferait que multiplier les malentendus ;
- **quelqu'un croit avoir affaire à un site officiel** → défaut grave, corriger
  avant tout autre envoi ;
- **zéro réponse sur 30 messages individuels** → ce n'est pas le canal, c'est le
  message. Le réécrire avant d'élargir.

**Ce qui ne prouve rien, et ne doit pas être présenté comme un succès :**

- des visites sans aucune session observée ;
- des « ah oui c'est intéressant » polis — le biais de complaisance est maximal
  dans un réseau personnel, et c'est le défaut structurel du canal 1 ;
- une réutilisation data.gouv.fr publiée, à elle seule.

---

## 12. Recommandation franche

### À faire dès la mise en ligne

1. **Les cinq champs des mentions légales.** Ce n'est pas du lancement, c'est la
   condition pour en faire un. Rien ne part avant.
2. **Les 5 sessions accompagnées du J2.** Si vous ne devez faire qu'une seule
   chose de ce plan, faites celle-là. Le site n'a **aucun** utilisateur réel à ce
   jour ; cinq personnes sur leur propre téléphone révéleront en une heure ce
   qu'aucun test automatisé ne voit. Cela ne demande aucun canal, aucun budget,
   aucune autorisation.
3. **Les 20 à 30 messages individuels**, après correction. Seul canal à
   livraison certaine.
4. **Ouvrir l'indexation le jour 1** — parce que le délai court à partir de
   maintenant, et en comptant zéro visiteur de recherche cette semaine.
5. **Trancher l'adresse du site** (section 6.2). Un lien qui porte un autre nom
   que le site abîme chaque envoi.

### Ce qui peut attendre, avec une date

- **Les abonnements : début octobre.** Pour les contrats à échéance au
  31 décembre, la fenêtre d'information légale s'ouvre le 1er octobre. L'outil
  devient utile à ce moment précis, pas maintenant.
- **Vercel Web Analytics : après cette semaine.** Décidez quand vous saurez s'il
  y a quelque chose à mesurer — et si oui, mettez `confidentialite.html` à jour
  dans le même mouvement.
- **La presse locale : quand vous aurez dix utilisateurs réels et un nom
  définitif.** C'est le meilleur canal gratuit qui existe pour ce produit, et on
  ne le sollicite qu'une fois.
- **Les deux manques de contenu** relevés en passant : le remboursement sous
  trente jours (section 1.3) et les causes d'augmentation que l'outil ne détecte
  pas (section 4.1).

### Ce qui serait une perte de temps maintenant

- **Poster sur les forums de consommation.** Règles lues et citées : liens
  interdits ou désactivés, publicité interdite, bannissement possible. Allez-y
  pour **lire**, jamais pour publier.
- **Produire des articles pour le référencement.** Des sites dédiés occupent déjà
  ces requêtes avec des pages à jour, et nous partons de zéro. Un article de plus
  cette semaine ne sera lu par personne.
- **Ouvrir des comptes sur les réseaux sociaux au nom du site.** Un compte neuf,
  sans audience, sous un nom provisoire, pour un site à trois outils : cela
  consomme du temps chaque semaine et ne rapporte rien avant des mois.
- **Choisir un nom définitif et refaire l'identité avant d'avoir dix
  utilisateurs.** Vous changeriez de nom sans savoir ce que les gens comprennent
  du produit.
- **Reddit cette semaine.** Non parce que c'est mauvais, mais parce que je n'ai
  pu en vérifier aucune règle (section 7.4) et qu'un bannissement au jour 3
  coûterait plus que les visites espérées.

### Le risque principal de ce plan, dit clairement

Le canal 1 est le seul qui livre à coup sûr, **et c'est aussi celui dont les
retours sont les moins fiables** : vos proches vous diront que c'est bien. Les
trois garde-fous sont dans le plan et doivent être tenus : on **observe** au lieu
de demander (T6), on compte un **acte coûteux** — la demande de fiche — plutôt
qu'une intention, et les « c'est intéressant » sont explicitement exclus des
critères de succès (section 11).

Deuxième risque, plus difficile : notre réponse honnête est souvent décevante.
« Rien à vérifier » est la bonne réponse et la moins satisfaisante. Un concurrent
qui affiche un montant paraîtra plus utile. C'est le prix du positionnement, et
il faut le payer sans le regretter à mi-parcours.

---

## 13. Sources

Toutes consultées le 18 septembre 2026, sauf mention contraire.

**Taxe foncière**
- impots.gouv.fr — À quelle date vais-je recevoir mon avis de taxe foncière (page modifiée le 17/09/2026)
- impots.gouv.fr — Comment est calculée ma taxe foncière ? Pourquoi a-t-elle augmenté en 2026 ? (modifiée le 03/09/2026)
- impots.gouv.fr — Comment puis-je contester mon avis (modifiée le 07/07/2026)
- impots.gouv.fr — échéances PART 15/10/2026 et PART 20/10/2026
- BOFiP — BOI-IF-TFB-10-60, exonération de droit commun de deux ans (art. 1383 CGI)
- Légifrance — art. R*196-2 LPF (délai de réclamation)

**Consommation**
- service-public.gouv.fr — F11094, garantie légale de conformité (vérifié le 17/08/2026)
- service-public.gouv.fr — F33991, résiliation d'un contrat à tacite reconduction
- Légifrance — art. L217-7, L215-1, L215-1-1 c. conso.
- signal.conso.gouv.fr — SignalConso (DGCCRF)

**Intermédiaires**
- economie.gouv.fr et impots.gouv.fr — France Services : 2 800+ lieux, 12 partenaires dont les Finances publiques
- anil.org — périmètre du réseau des ADIL

**Règles des canaux**
- forum.quechoisir.org — charte du forum ; fil « Liens dans les messages » (suppression du BBCode annoncée le 05/10/2022)
- droit-finances.commentcamarche.com — charte d'utilisation (liens URL prohibés sauf organismes à but non lucratif)
- guides.data.gouv.fr — publier une réutilisation
- journalduhacker.net — page « à propos » (inscription sur invitation)

**Concurrents**
- recalcul-taxe-fonciere.fr — guide de contestation (mis à jour le 07/09/2026) et page d'accueil
- 2ndmarket.fr — page « Contester sa taxe foncière » (liste d'attente)

**Infrastructure**
- vercel.com/docs — Runtime Logs, *Limits* (doc du 28/08/2026)
- vercel.com/docs — Pricing for Web Analytics (doc du 25/08/2026)
- vercel.com/docs — Web Analytics, Privacy and Compliance (doc du 26/06/2026)

**Constaté sur la branche** (`grep`, lecture des fichiers, 18/09/2026) : les
événements émis par chaque page et leurs collisions, l'absence de mesure sur les
trois guides, l'état `noindex` des 12 pages, `Disallow: /` dans `robots.txt`,
l'avertissement « Brouillon non finalisé » des mentions légales, l'absence du
délai de trente jours dans les pages abonnements, et le volume de chaque page.

**Non vérifié, et signalé comme tel** : Reddit et les groupes Facebook
(inaccessibles), et le rendu déployé sur Vercel (prévisualisation protégée).
