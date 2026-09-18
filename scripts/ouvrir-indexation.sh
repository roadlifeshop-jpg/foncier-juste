#!/bin/sh
# Ouvre le site à l'indexation, sur le domaine définitif.
#
#   sh scripts/ouvrir-indexation.sh https://exemple.fr
#
# NE PAS LANCER avant que les quatre conditions de MISE-EN-LIGNE.md soient
# réunies : nom arrêté, domaine branché, mentions légales complètes, version
# examinée sur le domaine réel. Le script ne pousse rien : il modifie les
# fichiers, à relire puis à committer.
#
# LE PIÈGE QU'IL ÉVITE
# --------------------
# « Disallow » et « noindex » ne se cumulent pas : ils se contredisent. Un robot
# à qui robots.txt interdit d'explorer une page NE LA TÉLÉCHARGE PAS, donc ne
# lit jamais la balise noindex qu'elle contient. L'URL peut alors rester
# référencée, sans titre ni description, sur la seule foi des liens entrants.
# Pour qu'une page soit DÉSINDEXÉE, il faut au contraire AUTORISER son
# exploration et la laisser répondre « noindex ».
# D'où la règle appliquée ici : robots.txt autorise tout, et les deux pages qui
# doivent rester hors index gardent leur balise.
set -e
[ -n "$1" ] || { echo "Usage : sh scripts/ouvrir-indexation.sh https://votre-domaine.fr" >&2; exit 1; }
DOMAINE=$(printf '%s' "$1" | sed 's:/*$::')
cd "$(dirname "$0")/.."

# Pages qui restent hors index même après ouverture :
#   succes.html — page de retour d'un paiement, sans intérêt pour un visiteur
#   cgv.html    — décrit une offre retirée
HORS_INDEX="succes.html cgv.html"

echo "Domaine visé : $DOMAINE"
echo
echo "1. Retrait de la balise noindex, sauf sur : $HORS_INDEX"
for f in web/*.html; do
  garde=0
  for h in $HORS_INDEX; do [ "$(basename "$f")" = "$h" ] && garde=1; done
  if [ "$garde" = "1" ]; then
    echo "   conservée : $(basename "$f")"
  else
    sed -i '' '/name="robots" content="noindex, nofollow"/d' "$f"
  fi
done

echo "2. Réécriture des URL canoniques et du sitemap"
grep -rl 'foncier-juste\.vercel\.app' web/*.html web/sitemap.xml 2>/dev/null \
  | xargs sed -i '' "s|https://foncier-juste\.vercel\.app|$DOMAINE|g"

echo "3. Retrait des deux pages hors index du sitemap, si elles y figuraient"
for h in $HORS_INDEX; do
  sed -i '' "\|<loc>$DOMAINE/$h</loc>|d" web/sitemap.xml
done

echo "4. robots.txt : exploration autorisée — voir l'explication en tête de ce script"
cat > web/robots.txt <<TXT
# Exploration autorisée. Les pages qui ne doivent pas être indexées portent une
# balise <meta name="robots" content="noindex"> et doivent donc rester
# explorables : un robot bloqué par robots.txt ne lirait jamais cette balise.
User-agent: *
Allow: /

Sitemap: $DOMAINE/sitemap.xml
TXT

echo
echo "5. Contrôles"
echo "   pages portant encore noindex : $(grep -rl 'content="noindex' web/*.html | xargs -n1 basename | tr '\n' ' ')"
echo "   (attendu : $HORS_INDEX)"
reste=$(grep -rl 'foncier-juste\.vercel\.app' web/ 2>/dev/null || true)
echo "   références au domaine provisoire : ${reste:-aucune}"
echo
echo "Relire git diff, committer, puis déployer. Après déploiement :"
echo "  curl -s $DOMAINE/robots.txt"
echo "  curl -s $DOMAINE/ | grep -c 'content=\"noindex\"'      # attendu : 0"
echo "  curl -s $DOMAINE/cgv.html | grep -c 'content=\"noindex\"' # attendu : 1"
echo "  puis déposer le sitemap dans la Search Console du domaine."
