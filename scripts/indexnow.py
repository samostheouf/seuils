#!/usr/bin/env python3
"""soumet les URLs a IndexNow (Bing, Yandex, Seznam, Naver).

La cle publique doit etre servie a la racine du domaine :
    https://<domaine>/<cle>.txt
Elle est lue dans .indexnow-key a la racine du depot.

Usage: python3 scripts/indexnow.py [--domaine https://...]
Sortie: 0 si accepte (200/202), 1 sinon. Non bloquant pour la publication.
"""
import json
import os
import sys
import urllib.error
import urllib.request

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOMAINE_DEFAUT = "https://seuils-virid.vercel.app"
ENDPOINT = "https://api.indexnow.org/indexnow"

CHEMINS = [
    "/",
    "/api/v1/parametres.json",
    "/api/v1/historique.json",
    "/api/v1/changelog.json",
    "/api/v1/parametres.csv",
]


def main():
    domaine = DOMAINE_DEFAUT
    if "--domaine" in sys.argv:
        domaine = sys.argv[sys.argv.index("--domaine") + 1]
    host = domaine.replace("https://", "").replace("http://", "").rstrip("/")

    fichier_cle = os.path.join(RACINE, ".indexnow-key")
    if not os.path.exists(fichier_cle):
        print("  pas de .indexnow-key — soumission ignoree")
        return 1
    with open(fichier_cle, encoding="utf-8") as f:
        cle = f.read().strip()

    charge = {
        "host": host,
        "key": cle,
        "keyLocation": f"{domaine}/{cle}.txt",
        "urlList": [f"{domaine}{c}" for c in CHEMINS],
    }

    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(charge).encode(),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"  IndexNow HTTP {r.status} — {len(charge['urlList'])} URLs soumises")
            return 0
    except urllib.error.HTTPError as e:
        print(f"  IndexNow HTTP {e.code} : {e.read().decode(errors='replace')[:200]}")
        return 1
    except Exception as e:
        print(f"  IndexNow indisponible : {type(e).__name__}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
