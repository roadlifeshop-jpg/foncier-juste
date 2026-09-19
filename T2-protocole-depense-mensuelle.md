# T2 — Protocole, outil Dépense mensuelle

**Cinq sessions accompagnées, trois questions, une décision — pas une validation.**
Critères arrêtés le 19/09/2026, avant la première session.
Protocole frère de `T1-protocole.md`, qui porte sur la taxe foncière.

---

## Ce que ces cinq sessions peuvent établir, et ce qu'elles ne peuvent pas

**Elles peuvent** montrer qu'une promesse est fausse. Si trois personnes sur cinq
n'arrivent pas à dresser leur inventaire, la promesse « deux champs par contrat,
moins de deux minutes » ne tient pas, et cinq cas suffisent à le savoir.

**Elles ne peuvent pas** montrer qu'une promesse est vraie. Cinq personnes ne
mesurent ni un taux d'adoption, ni une préférence, ni un marché. Aucun chiffre
tiré de ces sessions ne sera présenté comme une proportion.

**Aucun utilisateur réel n'a jamais parcouru cet outil.** C'est la première fois.
Le but est de trouver ce qui casse, pas de se rassurer.

---

## Les trois questions

### Question 1 — Les montants sont-ils disponibles ?

L'outil demande deux champs par contrat : un nom et un montant. **Le nom est
gratuit, le montant ne l'est pas.** Personne ne connaît par cœur ce qu'il paie
pour sept contrats. Si les testeurs quittent la page pour chercher dans leur
banque, leurs courriels ou leurs factures, la promesse de deux minutes est
fausse — et le défaut n'est pas dans l'interface, il est dans le postulat.

**Ce qu'on observe :** pour chaque contrat saisi, d'où vient le montant.
De mémoire, d'une appli bancaire, d'un courriel, d'une facture, ou pas du tout.
**Ne pas aider.** Si la personne demande « je peux regarder mon appli ? »,
répondre « faites comme vous feriez chez vous » et noter le temps.

**Ce qu'on note aussi :** le contrat qu'elle n'arrive pas à chiffrer et qu'elle
abandonne. C'est le plus instructif — il dit ce que l'inventaire manque toujours.

### Question 2 — Le résultat produit-il une intention d'agir ?

L'outil n'annonce aucune économie, ne compare aucune offre et ne chiffre aucun
remboursement. Il rend un total, une répartition, et une démarche gratuite par
contrat. **C'est un pari :** que le total suffise à déclencher quelque chose, et
que la démarche proposée soit assez concrète pour être faite.

Le risque est qu'une personne lise « 1 228 € par an », ait un mouvement de recul,
et reparte sans rien faire — parce que l'outil, par construction, refuse de lui
dire quoi résilier.

**Ce qu'on observe :** à la fin, sans question dirigée, demander
« qu'est-ce que vous faites en sortant d'ici ? ». Noter la réponse mot pour mot.
Puis, seulement après : « est-ce qu'il y a une de ces démarches que vous feriez
cette semaine ? Laquelle, et quand ? »

Une intention datée compte. « C'est intéressant » ne compte pas.

### Question 3 — Faut-il demander la date de prochaine échéance dans le parcours ?

**Hypothèse à trancher.** Les fiches signalent presque toutes que la date de
prochaine échéance manque, parce que le parcours ne la demande pas : il pose la
catégorie, puis l'engagement, puis les dates d'engagement seulement. L'échéance
reste accessible dans « Vérifier ce contrat », que rien n'oblige à ouvrir.

Or c'est l'échéance qui situe la fenêtre d'information sur la reconduction, donc
la seule démarche de l'outil qui puisse mener à un remboursement.

**Les deux branches, et ce qui les départage :**

- *L'ajouter au parcours* si les testeurs disposent de cette date, ou savent où
  la trouver en moins d'une minute. Le parcours s'allonge d'un tiers, mais rend
  une vérification réelle au lieu d'un constat de manque.
- *La laisser où elle est* si personne ne l'a sous la main. Une question à
  laquelle cinq personnes sur cinq répondent « je ne sais pas » n'informe rien et
  décourage.

**Ce qu'on observe :** après le parcours, montrer une fiche portant la mention
« la date de prochaine échéance n'est pas connue » et demander simplement :
« celle-là, vous sauriez la trouver ? En combien de temps ? »

---

## Critères de décision, arrêtés avant la première session

Sur cinq sessions. Ces seuils sont écrits maintenant pour ne pas être ajustés
après coup en fonction de ce qui arrange.

| Constat | Seuil | Décision |
|---|---|---|
| Inventaire mené à son terme, au moins trois contrats saisis | **≥ 4 / 5** | La promesse tient. Continuer. |
| | 2 ou 3 / 5 | Le postulat des deux champs est fragile. Chercher d'où viennent les montants avant de retoucher l'interface. |
| | ≤ 1 / 5 | La promesse est fausse. Revoir le point de départ de l'outil, pas son habillage. |
| Une intention d'action **datée**, en sortant | **≥ 3 / 5** | Le refus de chiffrer une économie est tenable. |
| | 1 ou 2 / 5 | L'outil informe sans mobiliser. Travailler les démarches, pas les chiffres. |
| | 0 / 5 | L'outil répond à une question que personne ne se pose. Poser franchement la question de son abandon. |
| Sait trouver sa date d'échéance en moins d'une minute | **≥ 3 / 5** | Ajouter la question au parcours. |
| | ≤ 2 / 5 | La laisser dans « Vérifier ce contrat ». Reformuler la fiche pour que le manque ne ressemble pas à un reproche. |

**Un critère d'arrêt immédiat, indépendant des seuils :** si une personne repart
en croyant qu'elle peut résilier un contrat sans frais alors que l'outil ne l'a
jamais dit, la session est un échec grave. Le noter en toutes lettres, interrompre
la série et corriger — puis la reprendre de zéro, selon la règle de version ci-
dessous. C'est le risque que toute l'architecture du produit cherche à éviter ;
s'il se réalise, il prime sur tout le reste.

---

## Déroulé d'une session

**Durée : trente minutes.** Sur le téléphone de la personne, pas sur le nôtre.

1. **Deux minutes.** Dire ce qu'on fait : « je teste un outil, pas vous. Tout ce
   qui vous bloque est une information utile. Rien de ce que vous tapez ne sort
   de votre téléphone. » Ne pas expliquer l'outil.
2. **Une phrase de consigne**, toujours la même : « Vous êtes tombé sur ce site.
   Faites ce que vous feriez. » Puis se taire.
3. **Quinze minutes d'observation.** Ne pas aider, ne pas corriger, ne pas
   expliquer. Noter les hésitations, les retours en arrière, les phrases dites à
   voix haute.
4. **Dix minutes d'entretien**, dans cet ordre strict : question 2 d'abord
   (« qu'est-ce que vous faites en sortant ? »), puis question 3 (l'échéance),
   puis seulement les questions d'interface. Inverser l'ordre fausserait la
   première réponse.
5. **Trois minutes.** Demander à la personne d'effacer sa liste devant nous,
   pour qu'elle voie que rien ne reste, et répondre à ses questions.

**Ce qu'on ne fait pas :** aucun enregistrement audio ou vidéo, aucune capture
d'écran, aucune collecte de coordonnées, aucune conservation de ce qui a été
saisi. Les notes sont manuscrites et anonymes — un prénom seul ou un numéro de
session.

---

## Avant la première session

### Une version, et une seule, pour les cinq essais

**Les cinq sessions se font sur le même build.** Noter son identifiant de commit
avant la première et ne rien pousser jusqu'à la cinquième. Deux personnes qui
n'ont pas vu la même page ne se comparent pas, et cinq cas sont déjà trop peu
pour se permettre de mélanger deux versions.

**Seule exception : le critère d'arrêt immédiat.** S'il se réalise, la série
s'interrompt, la correction est faite, et **les sessions repartent de zéro** sur
le nouveau build. Les sessions déjà menées sont conservées comme observations,
mais ne comptent plus dans les seuils.

Cette règle a un effet utile de côté : la question de savoir si un lien d'accès
suit ou non les commits suivants ne se pose plus, puisqu'il n'y a pas de commit
suivant pendant la série.

### L'accès

**Vérifier le lien réel sur un téléphone déconnecté du compte Vercel**, avant la
première session et non devant la personne. Ce qui doit être constaté soi-même,
parce que la documentation ne le dit pas et qu'aucune session de préparation ne
l'a établi :

- la page s'ouvre bien sans compte, sur un appareil qui n'a jamais visité le
  site ;
- c'est bien la version attendue qui s'affiche — comparer un élément daté ou
  une formulation propre au build retenu ;
- le lien survit à une fermeture d'onglet et à un partage par message.

Prévoir un plan B si le lien échoue devant la personne, et le préparer avant.

### L'identification de l'éditeur

Deux choses distinctes, qu'il ne faut pas confondre.

**Le contact avec les testeurs** relève du confort de la session : sans adresse
de contact publiée, une personne qui veut revenir, poser une question ou
signaler une erreur n'a aucun moyen de le faire. C'est une gêne réelle, ce n'est
pas une question de droit.

**Les obligations d'identification de l'éditeur** sont une question séparée, et
elles ne se règlent pas par la présence physique de l'éditeur pendant la
session. `INFORMATIONS-LEGALES.md` en tient la liste, datée et sourcée sur
l'article 1-1 de la LCEN : nom et prénoms, adresse, téléphone, directeur de la
publication et email **n'attendent aucune immatriculation** et peuvent être
renseignés dès maintenant ; seuls le statut juridique et le SIRET dépendent du
guichet unique.

**Ce protocole ne tranche pas** si le partage d'un lien à des personnes
extérieures au projet déclenche ces obligations. Ce n'est ni une question
d'interface ni une question de méthode d'enquête, et y répondre au jugé
reviendrait à fabriquer une règle. Le site affiche lui-même, en haut de ses
mentions légales, que le document n'est pas légalement valable et qu'un
avertissement ne remplace pas une identification. Deux voies, et le choix
appartient à l'éditeur : renseigner les cinq champs qui n'attendent rien, ou
mener les sessions en connaissance de cause après avis qualifié.

### Le reste

**Une réponse préparée à « c'est vous qui avez fait ça ? »**, honnête et courte.
Mentir sur ce point contaminerait tout le reste de la session. Une personne qui
ouvre les mentions légales y lira l'avertissement : mieux vaut l'avoir dit avant
qu'elle le découvre.

---

## Après les cinq sessions

Écrire, dans l'ordre : les trois questions et leur réponse chiffrée sur cinq,
la décision qui découle de chaque seuil, ce qui a cassé et n'était pas prévu,
et ce que ces cinq sessions **ne permettent pas** de conclure.

Ne rien pousser pendant la série : les cinq essais se font sur le même build,
et la seule interruption admise est le critère d'arrêt immédiat, qui fait
repartir la série de zéro. Noter dans le rapport l'identifiant de commit utilisé.
