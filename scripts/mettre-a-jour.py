#!/usr/bin/env python3
"""mettre-a-jour.py — detecte ce qui a change dans les sources officielles.

PRINCIPE : ce script PROPOSE, il ne decide pas. Par defaut il n'ecrit rien.
Il repond a une seule question : « les valeurs que je publie sont-elles
encore celles des pages officielles ? »

Pour chaque valeur surveillee :
  CONFORME   la valeur est toujours presente sur la page source
  ABSENTE    la valeur a disparu -> quelque chose a change, a verifier a la main
  INDISPONIBLE  la page n'a pas repondu -> ce n'est PAS un changement

Usage:
  python3 scripts/mettre-a-jour.py              # diagnostic seul, n'ecrit rien
  python3 scripts/mettre-a-jour.py --candidats  # affiche les nombres trouves pres du libelle
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RACINE, "data")
UA = "Mozilla/5.0 (compatible; seuils-veille/2.0)"
TIMEOUT = 30

# Chaque entree : une valeur publiee, la page qui la porte, et le motif a retrouver.
# Ajouter une entree ici = surveiller une nouvelle valeur.
SURVEILLANCE = [
    {
        "id": "tva-general",
        "libelle": "Franchise TVA — ventes/hébergement",
        "url": "https://entreprendre.service-public.gouv.fr/vosdroits/F21746",
        "attendus": ["85 000", "93 500"],
    },
    {
        "id": "tva-services",
        "libelle": "Franchise TVA — services",
        "url": "https://entreprendre.service-public.gouv.fr/vosdroits/F21746",
        "attendus": ["37 500", "41 250"],
    },
    {
        "id": "micro-fiscal",
        "libelle": "Seuils micro-fiscaux",
        "url": "https://entreprendre.service-public.gouv.fr/vosdroits/F23267",
        "attendus": ["203 100", "83 600"],
    },
    {
        "id": "acre",
        "libelle": "Taux ACRE (nouveau régime)",
        "url": "https://www.service-public.gouv.fr/particuliers/vosdroits/F11677",
        "attendus": ["75 %", "15,9 %"],
    },
]


def texte(html):
    """Retire balises et entites pour eviter les faux negatifs dus au balisage."""
    t = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    for a, b in (("&nbsp;", " "), ("\u202f", " "), ("\xa0", " "), ("&amp;", "&")):
        t = t.replace(a, b)
    return re.sub(r"\s+", " ", t)


def recuperer(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.read().decode("utf-8", "replace")


def candidats_proches(t, motif):
    """Nombres au format francais apparaissant dans les 200 caracteres qui suivent le libelle."""
    mots = [m for m in re.findall(r"[A-Za-zÀ-ÿ]{4,}", motif) if len(m) > 4][:2]
    for mot in mots:
        i = t.find(mot)
        if i >= 0:
            fenetre = t[i:i + 200]
            trouves = re.findall(r"\d{1,3}(?: \d{3})*(?:,\d+)?\s*%?", fenetre)
            return [x.strip() for x in trouves][:6]
    return []


def main():
    afficher_candidats = "--candidats" in sys.argv
    silencieux = "--silencieux" in sys.argv
    en_json = "--json" in sys.argv

    if not silencieux and not en_json:
        print("Diagnostic des sources officielles — aucun fichier ne sera modifie.")
        print()

    a_verifier = 0
    indisponibles = 0
    resultats = []

    for cible in SURVEILLANCE:
        try:
            t = texte(recuperer(cible["url"]))
        except urllib.error.HTTPError as e:
            indisponibles += 1
            resultats.append({"cible": cible["id"], "libelle": cible["libelle"],
                              "resultat": "INDISPONIBLE", "detail": f"HTTP {e.code}",
                              "url": cible["url"]})
            if not silencieux and not en_json:
                print(f"  INDISPONIBLE  {cible['libelle']} — HTTP {e.code}")
            continue
        except Exception as e:
            indisponibles += 1
            resultats.append({"cible": cible["id"], "libelle": cible["libelle"],
                              "resultat": "INDISPONIBLE", "detail": type(e).__name__,
                              "url": cible["url"]})
            if not silencieux and not en_json:
                print(f"  INDISPONIBLE  {cible['libelle']} — {type(e).__name__}")
            continue

        absents = [v for v in cible["attendus"] if v not in t]
        if not absents:
            resultats.append({"cible": cible["id"], "libelle": cible["libelle"],
                              "resultat": "CONFORME", "detail": ", ".join(cible["attendus"]),
                              "url": cible["url"]})
            if not silencieux and not en_json:
                print(f"  CONFORME      {cible['libelle']}  ({', '.join(cible['attendus'])})")
            continue

        a_verifier += 1
        candidats = candidats_proches(t, cible["libelle"]) if afficher_candidats else []
        resultats.append({"cible": cible["id"], "libelle": cible["libelle"],
                          "resultat": "ABSENTE", "detail": ", ".join(absents),
                          "url": cible["url"]})
        if not en_json:
            print("ALERTE seuils — valeur absente de la source officielle")
            print(f"  {cible['libelle']} : {', '.join(absents)}")
            print(f"  source : {cible['url']}")
            if candidats:
                print(f"  nombres trouvés près du libellé : {', '.join(candidats)}")

    # Mode machine : le journal de veille est ecrit dans la base par l'appelant.
    if en_json:
        print(json.dumps(resultats, ensure_ascii=False, indent=2))
        return 1 if a_verifier else 0

    if a_verifier:
        print()
        print("PROCHAINE ETAPE (manuelle, volontairement) :")
        print("  1. ouvrir la source citée et lire la nouvelle valeur")
        print("  2. éditer data/parametres.json")
        print("  3. ajouter une entrée datée dans data/changelog.json")
        print("  4. bash scripts/publier.sh -m \"mise a jour <valeur>\"")
        print()
        print("Ce script ne réécrit JAMAIS une valeur tout seul : le projet repose")
        print("sur la justesse, et un nombre mal extrait d'une page détruirait la confiance.")
        return 1

    if not silencieux:
        print()
        print(f"Bilan : {len(SURVEILLANCE) - indisponibles} conformes, 0 à vérifier, "
              f"{indisponibles} sources injoignables.")
    # En mode silencieux avec tout conforme : aucune sortie -> le cron ne delivre rien.
    return 0


if __name__ == "__main__":
    sys.exit(main())
