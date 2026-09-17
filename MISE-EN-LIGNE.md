# Mise en ligne de la refonte — procédure préparée, non exécutée

État au 17/09/2026. **Rien n'a été fusionné ni déployé.** Ce document décrit
exactement ce qui sera fait au feu vert, et comment revenir en arrière.

| | |
|---|---|
| Branche de travail | `refonte-trois-outils` (miroir court : `trois-outils`) |
| Dernier commit de la branche | `b1a2a89` |
| `main` — local et distant | `52ab6ac` (identiques) |
| Commits à fusionner | 6 |
| Production actuelle | `52ab6ac`, servie sur foncier-juste.vercel.app |

---

## 1. Avant le feu vert — trois vérifications qui ne dépendent pas de moi

1. **Le test Prolific est-il terminé ?** La fusion change le parcours testé.
   Tant que l'étude tourne, fusionner mélange deux versions dans les réponses.
2. **La prévisualisation a-t-elle été examinée ?** Le lien est dans Vercel →
   projet `foncier-juste` → Deployments → ligne `trois-outils` → Visit.
3. **Le `noindex` reste-t-il en place ?** Oui, et c'est voulu. La fusion met la
   refonte sur le domaine, elle ne l'ouvre pas aux moteurs. L'ouverture est une
   décision séparée, qui suppose les onze champs légaux complétés
   (`INFORMATIONS-LEGALES.md`) et le nom définitif arrêté.

## 2. La fusion

```bash
git checkout main && git pull --ff-only && git merge --no-ff refonte-trois-outils -m "Refonte : trois outils gratuits" && git push origin main
```

`--no-ff` crée un commit de fusion unique : c'est lui qui rend le retour arrière
simple, en une commande. Sans lui, les six commits seraient reversés un par un.

## 3. Le déploiement

Automatique. Vercel est relié au dépôt GitHub et redéploie `main` à chaque
poussée — comportement constaté à chaque commit de cette session. Aucune action
manuelle, aucune commande à lancer. Compter une à deux minutes.

**Contrôle après déploiement** — trois requêtes qui suffisent à savoir si la
bonne version est servie :

```bash
curl -s https://foncier-juste.vercel.app/ | grep -o "<title>[^<]*</title>"
curl -s -o /dev/null -w "%{http_code}\n" https://foncier-juste.vercel.app/abonnements.html
curl -sI https://foncier-juste.vercel.app/ | grep -i content-security-policy
```

Attendu : le titre « Dépense·Juste — vérifier ce que vous payez », un `200` sur
`abonnements.html` (page qui n'existe pas en production aujourd'hui, donc preuve
directe que la refonte est en ligne), et une CSP sans `fonts.googleapis.com`.

Je relancerai ensuite les trois parcours sur le site réellement servi — les
mêmes que sur la branche, avec en plus `/api/track`, que le serveur local ne
sait pas traiter.

## 4. Le retour arrière

Deux voies, dans cet ordre de préférence.

**a) Par Vercel, immédiat et sans toucher au dépôt.** Deployments → le
déploiement `52ab6ac` → menu ⋯ → **Promote to Production**. Le site revient à
l'état actuel en quelques secondes. C'est la voie à privilégier si quelque chose
ne va pas : elle ne demande ni git, ni attente de build.

**b) Par git, si le problème doit disparaître de l'historique de `main`.**

```bash
git revert -m 1 <sha-du-commit-de-fusion> && git push origin main
```

`-m 1` indique que l'on revient au premier parent, c'est-à-dire à l'état de
`main` avant la fusion. Le commit de fusion sera affiché par la commande de
l'étape 2 ; il apparaît aussi en tête de `git log --oneline main`.

Dans les deux cas, la branche `refonte-trois-outils` reste intacte : rien n'est
perdu, et une seconde tentative ne demande aucun travail de récupération.

## 5. Ce que la fusion ne fait pas

- **Elle n'ouvre pas les paiements.** Il n'y a plus de parcours de paiement dans
  l'interface. Les fonctions `api/create-checkout-session.js` et
  `verify-session.js` restent en place mais ne sont appelées par aucune page.
- **Elle n'ouvre pas le site aux moteurs.** `noindex` sur les onze pages et
  `Disallow: /` dans `robots.txt`.
- **Elle ne complète pas les mentions légales.** Nom, SIRET, téléphone,
  médiateur de la consommation : toujours à faire, et signalés comme tels sur
  les pages concernées.
