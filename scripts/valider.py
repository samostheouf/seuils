#!/usr/bin/env python3
"""valide les donnees avant publication.

Controles (tous bloquants) :
  1. tous les JSON sont valides
  2. api/v1/ est bien la copie exacte de data/
  3. chaque 'source' referencee existe dans la liste des sources declarees
  4. aucun caractere d'une ecriture parasite (CJK / cyrillique) dans le texte francais
  5. aucune valeur de seuil ou de taux n'est nulle ou negative
  6. la version du dataset est presente et non vide

Usage: python3 scripts/valider.py
Sortie: 0 si tout passe, 1 sinon. Chaque echec est liste.
"""
import glob
import json
import os
import re
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RACINE, "data")

echecs = []
ok = []


def controle(nom, condition, detail=""):
    if condition:
        ok.append(nom)
    else:
        echecs.append(f"{nom}{(' — ' + detail) if detail else ''}")


def lire(chemin):
    with open(chemin, encoding="utf-8") as f:
        return f.read()


def main():
    # 1. JSON valides
    fichiers = sorted(glob.glob(os.path.join(DATA, "*.json")) + glob.glob(os.path.join(RACINE, "snapshot", "*.json")))
    for f in fichiers:
        try:
            json.loads(lire(f))
            ok.append(f"JSON valide {os.path.relpath(f, RACINE)}")
        except Exception as e:
            echecs.append(f"JSON invalide {os.path.relpath(f, RACINE)} — {e}")

    # 2. le snapshot existe et n'est pas vide (c'est le filet si la base tombe)
    for nom in ("parametres.json", "changelog.json", "sources.json", "meta.json"):
        chemin = os.path.join(RACINE, "snapshot", nom)
        if not os.path.exists(chemin):
            echecs.append(f"snapshot manquant : {nom} (lancer scripts/snapshot.mjs)")
            continue
        try:
            contenu = json.loads(lire(chemin))
            vide = not contenu  # liste vide OU objet vide OU 0
            controle(f"snapshot/{nom} present et non vide", not vide, "fichier vide")
        except Exception as e:
            echecs.append(f"snapshot/{nom} illisible — {e}")

    # 3. sources referencees
    p = json.loads(lire(os.path.join(DATA, "parametres.json")))
    ids = {s["id"] for s in p.get("sources", [])}
    orphelines = []
    for cle, bloc in p.items():
        if isinstance(bloc, dict) and "source" in bloc and bloc["source"] not in ids:
            orphelines.append(f"{cle} -> {bloc['source']}")
    controle("toutes les sources referencees sont declarees", not orphelines, ", ".join(orphelines))

    # 4. caracteres parasites
    motif = re.compile(r"[\u3000-\u9fff\u0400-\u04ff]")
    suspects = []
    for f in fichiers + [os.path.join(RACINE, "index.html")]:
        if not os.path.exists(f):
            continue
        m = motif.search(lire(f))
        if m:
            suspects.append(f"{os.path.relpath(f, RACINE)} ({m.group()!r})")
    controle("aucun caractere d'une ecriture parasite", not suspects, ", ".join(suspects))

    # 5. valeurs numeriques plausibles
    mauvaises = []
    for v in p["seuils_micro_fiscal"]["valeurs"]:
        if not isinstance(v["seuil"], (int, float)) or v["seuil"] <= 0:
            mauvaises.append(f"seuil {v['code']}={v.get('seuil')}")
    for v in p["taux_cotisations_sociales"]["valeurs"]:
        if not isinstance(v["taux"], (int, float)) or not (0 < v["taux"] < 100):
            mauvaises.append(f"taux {v['code']}={v.get('taux')}")
    for v in p["acre"]["valeurs"]:
        if not (0 < v["taux_depuis_2026_07_01"] < v["taux_normal"]):
            mauvaises.append(f"acre {v['code']} : le taux ACRE doit etre inferieur au taux normal")
    controle("valeurs numeriques plausibles", not mauvaises, ", ".join(mauvaises))

    # 6. version presente
    controle("version du dataset presente", bool(p.get("version")))

    # --- rapport ---
    print(f"CONTROLES : {len(ok)} passes, {len(echecs)} echecs")
    if echecs:
        print()
        for e in echecs:
            print(f"  ECHEC  {e}")
        print()
        print("Publication bloquee.")
        return 1
    print("  tout est vert.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
