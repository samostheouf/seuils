#!/data/data/com.termux/files/usr/bin/bash
# publier.sh — la chaine complete, de la donnee au site en ligne.
#
#   1 base (schema + seed)   2 controle du contenu   3 snapshot (filet)
#   4 validation             5 deploiement           6 verification live
#   7 IndexNow + git
#
# Un echec a n'importe quelle etape ARRETE la chaine. Rien ne part a moitie.
#
# Usage:
#   bash scripts/publier.sh                    # chaine complete
#   bash scripts/publier.sh --sans-deploy      # preparation seulement
#   bash scripts/publier.sh --sans-git         # sans commit/push
#   bash scripts/publier.sh -m "message"       # message de commit
set -euo pipefail

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RACINE"

SCOPE="team_AkhUHK5QceCtfS9rOx16SLHS"
DOMAINE="https://seuils-virid.vercel.app"
MESSAGE=""
SANS_GIT=0
SANS_DEPLOY=0

while [ $# -gt 0 ]; do
  case "$1" in
    -m|--message) MESSAGE="${2:-}"; shift 2 ;;
    --sans-git) SANS_GIT=1; shift ;;
    --sans-deploy) SANS_DEPLOY=1; shift ;;
    *) echo "option inconnue: $1"; exit 2 ;;
  esac
done

etape() { echo; echo "=== $* ==="; }
# Le pilote pg emet un avertissement SSL bruyant sur chaque appel : on le tait.
filtre() { grep -v "SECURITY WARNING\|ssl mode\|sslmode\|libpq\|postgresql.org\|trace-warnings\|prepare for this change\|current behavior\|libpq compatibility"; }

etape "1/7 Base — schema + donnees"
node scripts/appliquer-schema.mjs 2>&1 | filtre
node scripts/seed.mjs 2>&1 | filtre

etape "2/7 Base — controle du contenu"
node scripts/verifier-base.mjs 2>&1 | filtre

etape "3/7 Snapshot (filet de secours committe)"
node scripts/snapshot.mjs 2>&1 | filtre

etape "4/7 Validation"
python3 scripts/valider.py

if [ "$SANS_DEPLOY" -eq 1 ]; then
  etape "5/7 Deploiement — IGNORE (--sans-deploy)"
  echo "Preparation terminee. Rien n'a ete publie."
  exit 0
fi

etape "5/7 Deploiement Vercel"
npx vercel --prod --yes --scope "$SCOPE" 2>&1 | grep -E '"readyState"|Error|error' | head -3
sleep 5

etape "6/7 Verification en live"
python3 scripts/verifier-live.py --domaine "$DOMAINE"

etape "7/7 IndexNow + Git"
python3 scripts/indexnow.py --domaine "$DOMAINE" || echo "  IndexNow non bloquant : soumission ignoree"

if [ "$SANS_GIT" -eq 1 ]; then
  echo "  git — IGNORE (--sans-git)"
elif [ -z "$(git status --porcelain)" ]; then
  echo "  rien a committer"
else
  [ -n "$MESSAGE" ] || MESSAGE="Publication $(date +%Y-%m-%d)"
  git add -A
  git commit -q -m "$MESSAGE"
  git push -q origin "$(git rev-parse --abbrev-ref HEAD)" 2>&1 | tail -2 || true
  echo "  commit : $(git log --oneline -1)"
fi

echo
echo "Publication terminee : $DOMAINE"
