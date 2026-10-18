#!/usr/bin/env python3
"""verifie que tout ce qui est publie est reellement servi.

Controle chaque endpoint en live, valide le JSON recu, et compare la version
servie a celle du depot local. Un site qui repond 200 avec un JSON casse
n'est pas un site qui fonctionne.

Usage: python3 scripts/verifier-live.py [--domaine https://...] [--json-uniquement]
Sortie: 0 si tout est conforme, 1 sinon.
"""
import json
import os
import sys
import urllib.error
import urllib.request

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOMAINE_DEFAUT = "https://seuils-virid.vercel.app"
UA = "Mozilla/5.0 (compatible; seuils-verif/1.0)"

ENDPOINTS_JSON = [
    "/api/v1/parametres.json",
    "/api/v1/changelog.json",
    "/api/v1/sources.json",
    "/api/v1/historique.json",
    "/api/v1/tva.json",
    "/api/v1/acre.json",
    "/api/v1/drom.json",
    "/api/health",
]
ENDPOINTS_TEXTE = [
    "/",
    "/api/v1/parametres.csv",
    "/api/v1/csv",
    "/feed",
    "/sitemap.xml",
    "/robots.txt",
]


def recuperer(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.status, r.read()


def main():
    domaine = DOMAINE_DEFAUT
    if "--domaine" in sys.argv:
        domaine = sys.argv[sys.argv.index("--domaine") + 1]

    echecs = []
    print(f"Verification live : {domaine}")

    for chemin in ENDPOINTS_TEXTE:
        try:
            code, corps = recuperer(domaine + chemin)
            if code == 200 and corps:
                print(f"  OK    {code}  {chemin}  ({len(corps)} o)")
            else:
                echecs.append(f"{chemin} : HTTP {code}, {len(corps)} octets")
        except urllib.error.HTTPError as e:
            echecs.append(f"{chemin} : HTTP {e.code}")
        except Exception as e:
            echecs.append(f"{chemin} : {type(e).__name__}")

    version_servie = None
    nb_parametres_servis = None
    resultats_json = {}
    for chemin in ENDPOINTS_JSON:
        try:
            code, corps = recuperer(domaine + chemin)
            donnees = json.loads(corps)
            resultats_json[chemin] = donnees
            print(f"  OK    {code}  {chemin}  (JSON valide, {len(corps)} o)")
            if chemin.endswith("parametres.json"):
                version_servie = donnees.get("version_donnees")
                nb_parametres_servis = len(donnees.get("parametres", []))
        except json.JSONDecodeError as e:
            echecs.append(f"{chemin} : JSON invalide ({e})")
        except Exception as e:
            echecs.append(f"{chemin} : {type(e).__name__}")

    # La version servie doit correspondre au depot local.
    # Attention : un endpoint en 404 renvoie version_servie = None. Ne PAS conclure
    # « OK » dans ce cas — c'est precisement le faux positif qui a masque un 404.
    # On compare le NOMBRE de valeurs, pas un numero de version : l'API renvoie la
    # date de derniere modification en base, le depot un numero de version — ils ne
    # sont pas comparables. Le compte, lui, prouve que le deploiement sert bien les
    # donnees courantes.
    snap = os.path.join(RACINE, "snapshot", "parametres.json")
    attendu = None
    if os.path.exists(snap):
        with open(snap, encoding="utf-8") as f:
            attendu = len(json.load(f))

    if version_servie is None:
        echecs.append("version servie illisible — un endpoint JSON n'a pas repondu correctement")
    elif attendu is not None and nb_parametres_servis != attendu:
        echecs.append(
            f"l'API sert {nb_parametres_servis} valeurs, le snapshot en contient {attendu} "
            "— deploiement non propage ?"
        )
    else:
        print(f"  OK    {nb_parametres_servis} valeurs servies = {attendu} dans le snapshot")

    # Verifier que les nouveaux endpoints ont du contenu
    for chemin, donnees in resultats_json.items():
        if chemin == "/api/health":
            continue
        if chemin.endswith(".json"):
            cle = chemin.replace("/api/v1/", "").replace(".json", "")
            liste = donnees.get(cle, donnees.get("parametres", donnees.get("historique", donnees.get("changements", donnees.get("tva", donnees.get("acre", donnees.get("drom", [])))))))
            if isinstance(liste, list) and len(liste) == 0:
                echecs.append(f"{chemin} : 0 entrees — endpoint vide")
            elif isinstance(liste, list):
                print(f"  OK    {chemin} : {len(liste)} entrees")

    print()
    if echecs:
        print(f"ECHECS ({len(echecs)}) :")
        for e in echecs:
            print(f"  - {e}")
        return 1
    print("Tout est conforme en live.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
