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

| À fournir | Emplacement | Pourquoi avant la fusion |
|---|---|---|
| **Nom et prénoms** | `mentions-legales.html:40` | LCEN art. 1-1, I, 1° |
| **Adresse** (domicile ou domiciliation) | `mentions-legales.html:42` | LCEN art. 1-1, I, 1° |
| **Téléphone** | `mentions-legales.html:43` | LCEN art. 1-1, I, 1° — explicitement exigé depuis la loi du 21 mai 2024 |
| **Directeur de la publication** | `mentions-legales.html:45` | LCEN art. 1-1, I, 3° |
| **Email de contact** | `mentions-legales.html:44`, `confidentialite.html` | exercice des droits RGPD (art. 13) ; c'est aussi le contact de l'éditeur |

Le bandeau « brouillon non finalisé » de la page mentions légales dit
honnêtement que le document n'est pas valable. **Il ne remplace pas les
informations manquantes** : un avertissement n'est pas une identification.

### À compléter dès l'immatriculation, pas avant la fusion

| À fournir | Emplacement | Quand |
|---|---|---|
| **Statut juridique** | `mentions-legales.html:40` | dès qu'il existe |
| **SIRET** | `mentions-legales.html:41` | dès l'immatriculation — l'article 1-1 demande le numéro d'inscription « le cas échéant » |

### Seulement s'il y a de nouveau une vente

| À fournir | Emplacement |
|---|---|
| **Régime de TVA** | `cgv.html:49` |
| **Médiateur de la consommation** | `cgv.html:78` |
| **Email de réclamation** | `cgv.html:74` |

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
3. les **mentions légales** sont complètes — les onze emplacements ;
4. la **version publiée** a été examinée sur le domaine réel.

**Les quatre changements à faire alors, tous préparés :**

```bash
# 1. retirer le noindex des 12 pages
grep -rl 'name="robots" content="noindex, nofollow"' web/*.html \
  | xargs sed -i '' '/name="robots" content="noindex, nofollow"/d'

# 2. réécrire les 11 URL canoniques et le sitemap vers le domaine définitif
grep -rl 'foncier-juste.vercel.app' web/*.html web/sitemap.xml \
  | xargs sed -i '' 's|https://foncier-juste\.vercel\.app|https://LE-DOMAINE-DEFINITIF|g'

# 3. remplacer robots.txt
printf 'User-agent: *\nAllow: /\n\nSitemap: https://LE-DOMAINE-DEFINITIF/sitemap.xml\n' > web/robots.txt

# 4. contrôler qu'il ne reste rien
grep -rn 'noindex\|foncier-juste.vercel.app' web/ || echo "rien à corriger"
```

Puis, après déploiement : vérifier `robots.txt` en ligne, l'absence de balise
`robots` dans le source d'une page, et déposer le sitemap dans la Search
Console du domaine.

**Deux pages ne doivent pas être indexées même après ouverture** :
`succes.html` (page de retour d'un paiement, sans intérêt public) et `cgv.html`
(document décrivant une offre retirée). Leur `noindex` doit être conservé — la
commande 1 ci-dessus les décocherait aussi, il faut donc les exclure ou les
remettre ensuite.

## 8. Ce qui bloque, et à quel moment

| Blocage | Empêche quoi | Qui peut le lever |
|---|---|---|
| Cinq informations d'éditeur manquantes — nom, adresse, téléphone, directeur de la publication, email | **la fusion**, puisqu'elle rend le site accessible au public | toi, aucune ne dépend de l'immatriculation |
| Statut juridique et SIRET | rien tant que l'activité n'est pas immatriculée ; à ajouter dès qu'elle l'est | le guichet unique INPI, puis toi |
| Aucun médiateur de la consommation (art. L616-1 c. conso.) | une reprise des ventes, pas la mise en ligne gratuite | toi, après immatriculation ; adhésion payante |
| Nom et domaine non arrêtés | l'ouverture aux moteurs | toi |
| Test Prolific en cours | le changement de production | le calendrier de l'étude |
