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
jamais dit, la session est un échec grave. Le noter en toutes lettres et corriger
avant la session suivante. C'est le risque que toute l'architecture du produit
cherche à éviter ; s'il se réalise, il prime sur tout le reste.

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

**Trois conditions.** Aucune n'est technique.

1. **Un accès qui fonctionne sur un téléphone inconnu**, et un plan B si le lien
   échoue devant la personne. Voir la note d'accès du rapport de session.
2. **Un email de contact publié** dans les mentions légales. C'est le seul champ
   dont l'absence se voit pendant une session : une personne qui veut revenir
   n'a aujourd'hui aucun moyen de le faire. Le reste — adresse, téléphone,
   SIRET, statut — conditionne une mise en ligne ouverte, pas cinq sessions
   accompagnées où l'éditeur est physiquement présent.
3. **Une réponse préparée à « c'est vous qui avez fait ça ? »**, honnête et
   courte. Mentir sur ce point contaminerait tout le reste de la session.

---

## Après les cinq sessions

Écrire, dans l'ordre : les trois questions et leur réponse chiffrée sur cinq,
la décision qui découle de chaque seuil, ce qui a cassé et n'était pas prévu,
et ce que ces cinq sessions **ne permettent pas** de conclure.

Ne pas ajouter de fonctionnalité pendant la série. Une correction entre deux
sessions ne se fait que pour le critère d'arrêt immédiat, et se note.
