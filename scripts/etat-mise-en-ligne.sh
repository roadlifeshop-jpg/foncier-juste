#!/bin/sh
# État réel de la mise en ligne, lu dans Git et sur le site.
# À lancer avant toute décision : les références d'un document figé se
# périment dès la poussée suivante — celle-là non.
#
#   sh scripts/etat-mise-en-ligne.sh
set -e
cd "$(dirname "$0")/.."

BRANCHE=refonte-trois-outils
echo "main                     : $(git rev-parse --short main)  ($(git rev-parse main))"
echo "origin/main              : $(git rev-parse --short origin/main)"
echo "$BRANCHE     : $(git rev-parse --short $BRANCHE)  ($(git rev-parse $BRANCHE))"
echo "origin/$BRANCHE : $(git rev-parse --short origin/$BRANCHE)"
echo "origin/trois-outils      : $(git rev-parse --short origin/trois-outils)"
echo
echo "commits d'écart main..$BRANCHE : $(git rev-list --count main..$BRANCHE)"
echo "arbre de travail propre        : $(test -z "$(git status --porcelain)" && echo oui || echo NON)"
echo "branche et miroir alignés      : $(test "$(git rev-parse origin/$BRANCHE)" = "$(git rev-parse origin/trois-outils)" && echo oui || echo NON)"
echo "main local et distant alignés  : $(test "$(git rev-parse main)" = "$(git rev-parse origin/main)" && echo oui || echo NON)"
echo
echo "Prévisualisation (adresse stable de la branche, toujours le dernier commit) :"
echo "  https://foncier-juste-git-trois-outils-roadlifeshop-6695.vercel.app"
echo
echo "Production servie actuellement :"
curl -s --max-time 20 https://foncier-juste.vercel.app/ | grep -o '<title>[^<]*</title>' || echo "  (injoignable)"
printf "  /abonnements.html -> HTTP "
curl -s -o /dev/null -w '%{http_code}\n' --max-time 20 https://foncier-juste.vercel.app/abonnements.html || echo "?"
echo "  (404 = ancienne version en ligne, 200 = refonte en ligne)"
echo
echo "Champs légaux encore vides :"
grep -c data-fill web/*.html | grep -v ':0' | sed 's/^/  /'
echo "  détail : grep -n data-fill web/*.html"
