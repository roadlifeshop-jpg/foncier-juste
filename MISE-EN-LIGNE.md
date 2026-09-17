# Mise en ligne de la refonte — procédure préparée, non exécutée

État au 17/09/2026, références relevées dans Git le jour même. **Rien n'a été
fusionné ni déployé.**

| | |
|---|---|
| Branche de travail | `refonte-trois-outils` |
| Miroir court (même commit) | `trois-outils` |
| Commit de tête de la branche | `015b9a9` (`015b9a92e97be9d2b6ebad7ea63e9a4f0adbd4c8`) |
| `main` — local et distant | `52ab6ac` (`52ab6ac29b59d6774f30509b2ae817a6e6e50fe1`), identiques |
| Commits d'écart | **8** |
| Production actuelle | déploiement de `52ab6ac`, servi sur foncier-juste.vercel.app |

> Les chiffres de ce tableau se revérifient par
> `git rev-parse main refonte-trois-outils` et
> `git rev-list --count main..refonte-trois-outils`. Toute nouvelle poussée sur
> la branche les périme : les relire avant d'agir.

---

## 1. La prévisualisation

Les déploiements de prévisualisation **existent**, un par commit de la branche.
Adresse stable de la branche, indépendante du dernier commit :

```
https://foncier-juste-git-trois-outils-roadlifeshop-6695.vercel.app
```

Adresse du commit `015b9a9` précisément :

```
https://foncier-juste-3co2ko3hl-roadlifeshop-6695.vercel.app
```

**Ces adresses demandent une connexion Vercel** : la protection des
déploiements de prévisualisation est active sur le projet. Connecté au compte,
la page s'ouvre directement. Pour la faire examiner par quelqu'un d'autre sans
lui donner l'accès au compte : Vercel → le déploiement → **Share** produit un
lien qui contourne la protection, ou Settings → Deployment Protection permet de
la désactiver pour les prévisualisations.

Où retrouver ces liens à la main : vercel.com → projet **foncier-juste** →
onglet **Deployments** → la ligne dont la branche est `trois-outils` et le
commit `015b9a9` → bouton **Visit**, ou menu ⋯ → **Copy URL**.

## 2. Avant le feu vert — ce qui ne dépend pas de moi

1. **Le test Prolific de l'ancien site doit être terminé.** La fusion change le
   parcours testé ; tant que l'étude tourne, les réponses porteraient sur deux
   versions différentes.
2. **La prévisualisation doit avoir été examinée.**
3. **Les mentions légales** restent incomplètes : voir la section 6.

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
- **Elle ne complète pas les mentions légales.** Onze emplacements attendent
  encore neuf informations distinctes : nom, statut juridique, SIRET, adresse,
  téléphone, email (à trois endroits), directeur de la publication, régime de
  TVA, médiateur de la consommation.

## 7. Ouvrir le site aux moteurs — préparé, pas activé

L'état actuel (`noindex` sur **12 pages** et `Disallow: /` dans `robots.txt`)
empêche tout trafic organique. C'est délibéré : un site indexé dont les mentions
légales sont incomplètes s'expose plus qu'un site fermé, et une indexation sous
le nom provisoire « Dépense·Juste » sur le domaine `foncier-juste.vercel.app`
créerait des adresses qu'il faudrait ensuite faire oublier aux moteurs.

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

## 8. Ce qui empêche aujourd'hui une publication publique complète

| Blocage | Qui peut le lever |
|---|---|
| Mentions légales incomplètes — neuf informations manquantes | toi, dont quatre après immatriculation |
| Aucun médiateur de la consommation désigné (art. L616-1 c. conso., amende jusqu'à 3 000 €) | toi, après immatriculation ; adhésion payante |
| Nom et domaine non arrêtés | toi |
| Test Prolific en cours sur l'ancienne version | le calendrier de l'étude |
