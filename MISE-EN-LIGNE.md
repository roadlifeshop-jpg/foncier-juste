# Mise en ligne de la refonte — procédure préparée, non exécutée

État au 17/09/2026, références relevées dans Git le jour même. **Rien n'a été
fusionné ni déployé.**

| | |
|---|---|
| Branche de travail | `refonte-trois-outils` |
| Miroir court, même commit | `trois-outils` |
| `main` — local et distant | `52ab6ac` (`52ab6ac29b59d6774f30509b2ae817a6e6e50fe1`) |
| Production actuelle | déploiement de `52ab6ac` |

**Le commit de tête de la branche et le nombre de commits d'écart ne sont pas
écrits ici, volontairement.** Ce document en portait deux, et ils se sont
périmés à la poussée suivante. Ils se lisent à la demande :

```bash
sh scripts/etat-mise-en-ligne.sh
```

Ce script imprime les deux têtes, l'écart réel, l'alignement de la branche avec
son miroir, l'adresse de prévisualisation et la version actuellement servie en
production. **Le lancer avant toute décision.** Seul `main` est cité en dur
ci-dessus, parce qu'il ne bougera pas avant la fusion — et s'il a bougé, le
script le dira.

---

## 1. La prévisualisation

Les déploiements de prévisualisation **existent**, un par commit de la branche.
Adresse stable de la branche, indépendante du dernier commit :

```
https://foncier-juste-git-trois-outils-roadlifeshop-6695.vercel.app
```

Vercel crée aussi une adresse par commit, de la forme
`foncier-juste-<identifiant>-roadlifeshop-6695.vercel.app`. Elle se périme à
chaque poussée&nbsp;: préférer l'adresse de branche ci-dessus, qui suit
toujours le dernier commit.

**Ces adresses demandent une connexion Vercel** : la protection des
déploiements de prévisualisation est active sur le projet. Connecté au compte,
la page s'ouvre directement. Pour la faire examiner par quelqu'un d'autre sans
lui donner l'accès au compte : Vercel → le déploiement → **Share** produit un
lien qui contourne la protection, ou Settings → Deployment Protection permet de
la désactiver pour les prévisualisations.

Où retrouver ces liens à la main : vercel.com → projet **foncier-juste** →
onglet **Deployments** → la ligne la plus récente dont la branche est
`trois-outils` — son commit doit être celui qu'imprime
`sh scripts/etat-mise-en-ligne.sh` → bouton **Visit**, ou menu ⋯ → **Copy URL**.

## 2. Avant le feu vert — trois états à ne pas confondre

Un site peut être dans trois états distincts, et `noindex` n'en gouverne qu'un
seul.

| État | Ce que cela signifie | Ce qui le gouverne aujourd'hui |
|---|---|---|
| **Accessible publiquement** | n'importe qui disposant de l'URL ouvre le site, sans mot de passe | **la fusion sur `main`.** Rien ne protège l'accès : `foncier-juste.vercel.app` est ouvert |
| **Indexé** | les moteurs le référencent et amènent du trafic | `noindex` sur 12 pages et `Disallow: /` |
| **Commercialisé** | le site vend quelque chose | rien : plus aucun parcours de paiement |

**La correction importante par rapport à la version précédente de ce
document&nbsp;:** j'y présentais le maintien de `noindex` comme ce qui rendait
l'absence de mentions légales acceptable. C'était faux. `noindex` et
`Disallow: /` empêchent le référencement, **ils ne rendent pas le site privé**.
Une fusion sur `main` met la refonte en ligne, accessible par son adresse, et
les obligations d'identification d'un éditeur s'appliquent à ce moment-là — pas
au moment de l'ouverture aux moteurs.

### À compléter AVANT la fusion

Ce sont les informations que l'article 1-1, I de la LCEN demande à un éditeur
professionnel de mettre à disposition du public, et le contact que l'article 13
du RGPD exige dès lors que des données sont traitées — ici les journaux de
l'hébergeur, qui contiennent des adresses IP.

| À fournir | Où, dans la page | Pourquoi avant la fusion |
|---|---|---|
| **Nom et prénoms** | mentions légales, bloc « Éditeur du site », champ `[Nom / raison sociale]` | LCEN art. 1-1, I, 1° |
| **Adresse** (domicile ou domiciliation) | même bloc, champ `[adresse]` | LCEN art. 1-1, I, 1° |
| **Téléphone** | même bloc, champ `[numéro à publier…]` | LCEN art. 1-1, I, 1° — explicitement exigé depuis la loi du 21 mai 2024 |
| **Directeur de la publication** | même bloc, champ `[nom]` | LCEN art. 1-1, I, 3° |
| **Email de contact** | même bloc, champ `[email]` — **et** page Confidentialité, section « Vos droits » | exercice des droits RGPD (art. 13) ; c'est aussi le contact de l'éditeur |

**Les emplacements ne sont plus désignés par un numéro de ligne&nbsp;:** ceux
d'une version précédente de ce document avaient glissé de cinq lignes à la
retouche suivante. Ils se retrouvent par leur libellé&nbsp;:

```bash
grep -n data-fill web/*.html
```

Le bandeau « brouillon non finalisé » de la page mentions légales dit
honnêtement que le document n'est pas valable. **Il ne remplace pas les
informations manquantes** : un avertissement n'est pas une identification.

### À compléter dès l'immatriculation, pas avant la fusion

| À fournir | Où, dans la page | Quand |
|---|---|---|
| **Statut juridique** | mentions légales, champ `[statut : auto-entrepreneur / société]` | dès qu'il existe |
| **SIRET** | mentions légales, champ `[à compléter après immatriculation…]` | dès l'immatriculation — l'article 1-1 demande le numéro d'inscription « le cas échéant » |

### Seulement s'il y a de nouveau une vente

| À fournir | Où, dans la page |
|---|---|
| **Régime de TVA** | CGV, section « Prix » |
| **Médiateur de la consommation** | CGV, section « Médiation de la consommation » |
| **Email de réclamation** | CGV, section « Réclamations et litiges » |

Ces trois-là ne bloquent pas la mise en ligne d'un site gratuit. Les CGV
décrivent une offre retirée&nbsp;; leur bandeau le dit.

### Et le reste

1. **Le test Prolific de l'ancien site doit être terminé.** La fusion change le
   parcours testé.
2. **La prévisualisation doit avoir été examinée.**

## 3. La fusion

```bash
git checkout main && git pull --ff-only && git merge --no-ff refonte-trois-outils -m "Refonte : trois outils gratuits" && git push origin main
```

`--no-ff` crée **un** commit de fusion. C'est lui qui rend le retour arrière
simple : un seul objet à annuler, au lieu de huit.

## 4. Le déploiement

Automatique. Vercel est relié au dépôt et déploie `main` à chaque poussée —
comportement constaté sur chacun des dix derniers commits. Compter une à deux
minutes.

**Contrôle après déploiement**, trois requêtes :

```bash
curl -s https://foncier-juste.vercel.app/ | grep -o "<title>[^<]*</title>"
curl -s -o /dev/null -w "%{http_code}\n" https://foncier-juste.vercel.app/abonnements.html
curl -sI https://foncier-juste.vercel.app/ | grep -i content-security-policy
```

Attendu : le titre « Dépense·Juste — vérifier ce que vous payez », un `200` sur
`abonnements.html` — page qui n'existe pas dans la version actuelle, donc
preuve directe que la refonte est servie — et une CSP sans
`fonts.googleapis.com`.

## 5. Le retour arrière — et la réconciliation Git / Vercel

Deux mécanismes distincts, qui n'agissent pas au même endroit. **Les confondre
laisse le dépôt et le site dans deux états différents.**

### a) Vercel — remettre l'ancienne version en ligne, tout de suite

Deployments → le déploiement de `52ab6ac` → ⋯ → **Promote to Production** (ou
**Instant Rollback** selon l'interface). Le site sert à nouveau l'ancienne
version en quelques secondes.

**Ce que cela ne fait pas : `main` n'est pas modifiée.** Elle contient toujours
le commit de fusion. Le dépôt et la production divergent alors :
`main` = refonte, site = ancienne version. C'est acceptable quelques heures,
pas durablement — la prochaine poussée sur `main`, même pour une virgule,
redéploierait la refonte et annulerait silencieusement le retour arrière.

### b) Git — faire redescendre `main`

```bash
git revert -m 1 <sha-du-commit-de-fusion> && git push origin main
```

**`git revert` n'efface rien.** Il ajoute un commit qui applique l'inverse des
changements : l'historique conserve la fusion *et* son annulation. C'est
voulu — c'est ce qui rend l'opération sûre sur une branche déjà publiée, au
contraire d'un `reset --hard` suivi d'une poussée forcée, qui réécrirait
l'historique et casserait tout clone existant. `-m 1` désigne le premier parent,
c'est-à-dire l'état de `main` avant la fusion.

Cette poussée déclenche un nouveau déploiement, dont le contenu est celui d'avant
la fusion. **Git et Vercel sont alors de nouveau d'accord**, et c'est le seul
état stable.

### Comment réconcilier, selon ce qui a été fait

| Situation | État | Ce qu'il reste à faire |
|---|---|---|
| Promotion Vercel seule | site ancien, `main` = refonte | lancer le `revert` ci-dessus : le déploiement qu'il produit rejoint l'état promu, et la divergence disparaît |
| `revert` seul | `main` = ancien état, site = ancien état après déploiement | rien ; vérifier avec les trois requêtes de la section 4 |
| Les deux, dans cet ordre | cohérent | rien |
| `revert` puis promotion d'un déploiement plus ancien encore | site antérieur à `main` | ne pas rester là : promouvoir le déploiement issu du `revert`, ou reverser davantage |

**Pour repartir ensuite**, la refonte n'est jamais perdue : la branche
`refonte-trois-outils` est intacte, et un `git revert` du commit de revert
(ou une nouvelle fusion) la remet en jeu.

## 6. Ce que la fusion ne fait pas

- **Elle n'ouvre pas les paiements.** Aucun parcours de paiement dans
  l'interface ; `api/create-checkout-session.js` et `verify-session.js` restent
  en place mais ne sont appelés par aucune page.
- **Elle n'ouvre pas le site aux moteurs de recherche.** Voir la section 7.
- **Mais elle rend le site accessible à quiconque connaît l'adresse.** C'est
  pourquoi les cinq informations de la section 2 doivent être en place avant, et
  non avant l'ouverture aux moteurs.

## 7. Ouvrir le site aux moteurs — préparé, pas activé

L'état actuel (`noindex` sur **12 pages** et `Disallow: /` dans `robots.txt`)
empêche tout trafic organique. Ce n'est pas une mesure de confidentialité — le
site reste accessible par son adresse — mais un choix de calendrier : une
indexation sous le nom provisoire « Dépense·Juste » et sur le domaine
`foncier-juste.vercel.app` créerait des adresses qu'il faudrait ensuite faire
oublier aux moteurs, ce qui prend des mois.

**Quatre conditions à réunir avant d'ouvrir**, dans cet ordre :

1. le **nom** définitif est arrêté (disponibilité et recherche INPI faites) ;
2. le **domaine** définitif est acheté et branché sur le projet Vercel ;
3. les **mentions légales** sont complètes — voir la section 2, et `sh scripts/etat-mise-en-ligne.sh` pour le décompte à jour ;
4. la **version publiée** a été examinée sur le domaine réel.

**Le changement est préparé dans un script**, à lancer avec le domaine
définitif — et pas avant :

```bash
sh scripts/ouvrir-indexation.sh https://le-domaine-definitif.fr
```

Il retire la balise `noindex` de toutes les pages **sauf** `succes.html` et
`cgv.html`, réécrit les URL canoniques et le sitemap, retire ces deux pages du
sitemap, et remplace `robots.txt`. Il ne pousse rien&nbsp;: il modifie les
fichiers, à relire avec `git diff` avant de committer.

**Le piège qu'il évite, et qui mérite d'être compris.** `Disallow` et `noindex`
ne se cumulent pas&nbsp;: ils se contredisent. Un robot à qui `robots.txt`
interdit d'explorer une page **ne la télécharge pas**, donc ne lit jamais la
balise `noindex` qu'elle contient — l'adresse peut rester référencée, sans titre
ni description, sur la seule foi des liens qui pointent vers elle. Pour qu'une
page soit **désindexée**, il faut au contraire **autoriser** son exploration et
la laisser répondre « noindex ». Le nouveau `robots.txt` autorise donc tout, et
ce sont les deux balises conservées qui tiennent les deux pages hors index.

**Ce que l'ouverture ne produit pas.** Aucun trafic immédiat. L'indexation rend
les pages *éligibles* à figurer dans les résultats&nbsp;: la découverte prend
des semaines, le classement dépend de la concurrence sur des requêtes déjà très
disputées, et un site neuf sans historique part loin. Ce n'est pas un levier de
lancement, c'est un investissement dont les premiers effets, s'il y en a, se
mesurent en mois.

## 8. Ce qui bloque, et à quel moment

| Blocage | Empêche quoi | Qui peut le lever |
|---|---|---|
| Cinq informations d'éditeur manquantes — nom, adresse, téléphone, directeur de la publication, email | **la fusion**, puisqu'elle rend le site accessible au public | toi, aucune ne dépend de l'immatriculation |
| Statut juridique et SIRET | rien tant que l'activité n'est pas immatriculée ; à ajouter dès qu'elle l'est | le guichet unique INPI, puis toi |
| Aucun médiateur de la consommation (art. L616-1 c. conso.) | une reprise des ventes, pas la mise en ligne gratuite | toi, après immatriculation ; adhésion payante |
| Nom et domaine non arrêtés | l'ouverture aux moteurs | toi |
| Test Prolific en cours | le changement de production | le calendrier de l'étude |
