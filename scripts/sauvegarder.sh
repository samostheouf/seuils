#!/data/data/com.termux/files/usr/bin/bash
# sauvegarder.sh — archive complete et restaurable du travail Seuils.
#
# Contenu : le projet, les skills, la memoire, la veille, les livrables de prospection.
# EXCLU : node_modules, .next, .vercel, et TOUT fichier .env (secrets).
#         Une sauvegarde qui contient des cles est une fuite qui attend son heure.
#
# Usage: bash scripts/sauvegarder.sh
set -euo pipefail

DATE="$(date +%Y%m%d-%H%M)"
HOME_DIR="/data/data/com.termux/files/home"
STAGE="$HOME_DIR/sauvegarde-seuils-$DATE"
ARCHIVE="$HOME_DIR/SAUVEGARDE_SEUILS_$DATE.tar.gz"

echo "== Sauvegarde Seuils — $DATE =="
rm -rf "$STAGE"
mkdir -p "$STAGE"

# --- 1. le projet, sans les artefacts ni les secrets -------------------------
echo "1/6 Projet..."
mkdir -p "$STAGE/seuils"
tar -cf - -C "$HOME_DIR/seuils" \
  --exclude=node_modules --exclude=.next --exclude=.vercel \
  --exclude='.env' --exclude='.env.*' --exclude='*.log' \
  . | tar -xf - -C "$STAGE/seuils"
echo "   $(find "$STAGE/seuils" -type f | wc -l) fichiers"

# --- 2. les skills (la memoire procedurale) ---------------------------------
echo "2/6 Skills..."
mkdir -p "$STAGE/hermes"
cp -r "$HOME_DIR/.hermes/skills" "$STAGE/hermes/skills"
echo "   $(find "$STAGE/hermes/skills" -name SKILL.md | wc -l) skills"

# --- 3. la memoire ----------------------------------------------------------
echo "3/6 Memoire..."
mkdir -p "$STAGE/hermes/memories"
cp "$HOME_DIR/.hermes/memories/MEMORY.md" "$HOME_DIR/.hermes/memories/USER.md" "$STAGE/hermes/memories/"

# --- 4. les scripts Hermes lies au projet -----------------------------------
echo "4/6 Scripts Hermes..."
mkdir -p "$STAGE/hermes/scripts"
cp "$HOME_DIR/.hermes/scripts/seuils-veille.py" "$STAGE/hermes/scripts/" 2>/dev/null || echo "   (veille absente)"

# --- 5. les livrables de prospection ----------------------------------------
echo "5/6 Prospection..."
if [ -d "$HOME_DIR/porte-a-frapper" ]; then
  cp -r "$HOME_DIR/porte-a-frapper" "$STAGE/porte-a-frapper"
fi

# --- 6. manifeste + script de restauration ----------------------------------
echo "6/6 Manifeste et restauration..."

cat > "$STAGE/RESTAURER.sh" <<'RESTORE'
#!/data/data/com.termux/files/usr/bin/bash
# Restaure la sauvegarde Seuils a sa place.
# Usage: bash RESTAURER.sh [--ecraser]
set -euo pipefail

ICI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOME_DIR="/data/data/com.termux/files/home"
ECRASER=0
[ "${1:-}" = "--ecraser" ] && ECRASER=1

copier() {
  local src="$1" dst="$2"
  if [ -e "$dst" ] && [ "$ECRASER" -eq 0 ]; then
    echo "  IGNORE (existe deja) : $dst"
    echo "    -> relancer avec --ecraser pour remplacer"
    return
  fi
  mkdir -p "$(dirname "$dst")"
  rm -rf "$dst"
  cp -r "$src" "$dst"
  echo "  OK  $dst"
}

echo "Restauration depuis $ICI"
copier "$ICI/seuils"            "$HOME_DIR/seuils"
copier "$ICI/hermes/skills"     "$HOME_DIR/.hermes/skills"
copier "$ICI/hermes/memories"   "$HOME_DIR/.hermes/memories"
copier "$ICI/hermes/scripts/seuils-veille.py" "$HOME_DIR/.hermes/scripts/seuils-veille.py"
[ -d "$ICI/porte-a-frapper" ] && copier "$ICI/porte-a-frapper" "$HOME_DIR/porte-a-frapper"

echo
echo "ETAPES MANUELLES (non automatisables) :"
echo "  1. recreer ~/seuils/.env avec DATABASE_URL (voir .env.example)"
echo "     la chaine est dans ~/ai-empire/.env — meme base Prisma Postgres"
echo "  2. cd ~/seuils && npm install"
echo "  3. bash ~/seuils/scripts/publier.sh --sans-deploy   # verifier"
echo "  4. recreer le cron : hermes cron create --name seuils-veille-quotidienne \\"
echo "       --schedule '0 8 * * *' --script seuils-veille.py --no-agent"
RESTORE
chmod +x "$STAGE/RESTAURER.sh"

{
  echo "# Sauvegarde Seuils — $DATE"
  echo
  echo "## Contenu"
  echo
  echo "| Dossier | Quoi |"
  echo "|---|---|"
  echo "| \`seuils/\` | le projet complet (code, donnees, snapshot, scripts) |"
  echo "| \`hermes/skills/\` | $(find "$STAGE/hermes/skills" -name SKILL.md | wc -l) skills — la memoire procedurale |"
  echo "| \`hermes/memories/\` | MEMORY.md + USER.md — la memoire longue |"
  echo "| \`hermes/scripts/\` | la veille appelee par le cron |"
  echo "| \`porte-a-frapper/\` | livrables de prospection locale |"
  echo
  echo "## Ce qui n'est PAS dedans (volontairement)"
  echo
  echo "- \`node_modules/\`, \`.next/\`, \`.vercel/\` — regeneres par \`npm install\`"
  echo "- **tout fichier \`.env\`** — une sauvegarde qui contient des cles est une fuite qui attend son heure"
  echo
  echo "## Restaurer"
  echo
  echo '```bash'
  echo 'tar -xzf SAUVEGARDE_SEUILS_'"$DATE"'.tar.gz'
  echo 'cd sauvegarde-seuils-'"$DATE"
  echo 'bash RESTAURER.sh'
  echo '```'
  echo
  echo "Puis suivre les etapes manuelles affichees a la fin (recréer .env, npm install, cron)."
  echo
  echo "## Etat au moment de la sauvegarde"
  echo
  echo '```'
  cd "$HOME_DIR/seuils" && git log --oneline -1 2>/dev/null | sed 's/^/commit: /'
  echo "base  : $(cd "$HOME_DIR/seuils" && node scripts/verifier-base.mjs 2>/dev/null | grep -c '  OK' || echo '?') controles verts"
  echo '```'
} > "$STAGE/MANIFESTE.md"

# --- inventaire -------------------------------------------------------------
( cd "$STAGE" && find . -type f | sort > CONTENU.txt )
echo "   $(wc -l < "$STAGE/CONTENU.txt") fichiers inventories"

# --- archive ----------------------------------------------------------------
echo
echo "Creation de l'archive..."
tar -czf "$ARCHIVE" -C "$HOME_DIR" "sauvegarde-seuils-$DATE"
rm -rf "$STAGE"

TAILLE="$(du -h "$ARCHIVE" | cut -f1)"
SOMME="$(sha256sum "$ARCHIVE" | cut -d' ' -f1)"
echo "$SOMME  $(basename "$ARCHIVE")" > "$ARCHIVE.sha256"

echo
echo "TERMINE"
echo "  fichier : $ARCHIVE"
echo "  taille  : $TAILLE"
echo "  sha256  : $SOMME"
echo "  somme   : $ARCHIVE.sha256"
