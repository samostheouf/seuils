#!/usr/bin/env python3
"""Warmup — pré-cache tous les endpoints du site Seuils.

Après un déploiement, les endpoints secondaires (changelog, sources, historique,
tva, acre, drom, csv, feed) n'ont pas encore de cache HIT. Ce script les visite
pour déclencher la génération ISR et les mettre en cache.

Usage: python3 scripts/warmup.py [--url https://...]
"""
import sys
import time
import urllib.request

URLS = [
    "/",
    "/api/v1/parametres.json",
    "/api/v1/changelog.json",
    "/api/v1/sources.json",
    "/api/v1/historique.json",
    "/api/v1/tva.json",
    "/api/v1/acre.json",
    "/api/v1/drom.json",
    "/api/v1/csv",
    "/api/v1/parametres.csv",
    "/api/health",
    "/feed",
    "/sitemap.xml",
    "/robots.txt",
]


def main():
    base = "https://seuils-virid.vercel.app"
    if "--url" in sys.argv:
        base = sys.argv[sys.argv.index("--url") + 1]

    print(f"Warmup: {base}")
    ok = 0
    fail = 0
    for path in URLS:
        url = base + path + "?cb=" + str(int(time.time() * 1000))
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "seuils-warmup/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                body = r.read()
                if r.status == 200 and body:
                    ok += 1
                    print(f"  OK    {r.status}  {path}  ({len(body)} o)")
                else:
                    fail += 1
                    print(f"  FAIL  {r.status}  {path}")
        except Exception as e:
            fail += 1
            print(f"  FAIL  {path}: {e}")

    print(f"\n{ok}/{len(URLS)} OK, {fail} échecs")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
