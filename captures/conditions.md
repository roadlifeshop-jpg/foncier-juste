# Captures avant / après — comparaison Attention Insight

Douze images, six couples. Chaque couple ne diffère que par la version du site :
tout le reste est identique, faute de quoi la comparaison ne mesurerait rien.

## Conditions, identiques des deux côtés

| Paramètre | Valeur |
|---|---|
| Navigateur | Chromium (Playwright), sans extension |
| Fenêtre | 1440 × 900 pour `desktop`, 390 × 844 pour `mobile` |
| Densité | `device_scale_factor = 2` — les fichiers font donc 2880 × 1800 et 780 × 1688 |
| Thème | clair, forcé par `data-theme="light"` |
| Cadrage | premier écran uniquement, défilement remis à zéro |
| Attente | fin du réseau, puis 500 ms — les polices sont chargées, les montants calculés |

Le cadrage au premier écran est volontaire : Attention Insight analyse une image
fixe, et une capture pleine page ferait porter l'attention sur des zones qu'un
visiteur ne voit pas sans défiler.

## Les six couples

| Écran | Fichiers | Analyse prévue |
|---|---|---|
| Accueil | `accueil--desktop--{avant,apres}.png` | Message Emphasis |
| Accueil | `accueil--mobile--{avant,apres}.png` | Message Emphasis |
| Tableau de bord | `tableau-de-bord--desktop--{avant,apres}.png` | CTA Visibility |
| Tableau de bord | `tableau-de-bord--mobile--{avant,apres}.png` | CTA Visibility |
| Écran intermédiaire | `ecran-intermediaire--desktop--{avant,apres}.png` | CTA Visibility |
| Écran intermédiaire | `ecran-intermediaire--mobile--{avant,apres}.png` | CTA Visibility |

L'écran intermédiaire est la première étape du bilan (`bilan.html`) : une seule
question, huit réponses.

## Ce que ces images ne prouvent pas

Les captures « avant » viennent du commit `36744fb`, dernier état avant la
refonte. Elles ne sont pas les captures d'origine analysées par Attention
Insight : celles-ci ne m'ont pas été transmises, et leur cadrage exact n'est
donc pas connu. Les chiffres cités dans le brief — 63 de score, 39 % sur le
message principal, 7 % sur l'entrée — servent de point de départ, pas de
référence reproductible.

Un score Attention Insight reste un modèle de saillance visuelle. Il ne dit rien
de la compréhension, de la confiance ni de l'action réelle. Deux personnes
devant l'écran en apprendront davantage.

## Refaire ces captures

```bash
python3 scripts/captures-comparaison.py
```

Le script sert la version courante et la version `36744fb` sur deux ports, et
réécrit les douze fichiers. Il ne modifie rien dans `web/`.
