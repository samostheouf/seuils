#!/usr/bin/env python3
"""
Audit de performance du site Seuils — mesure TTFB, temps total, headers.

Dépendances : aucune (curl + stdlib uniquement)
Usage : python3 scripts/audit-performance.py [--verbose] [--json]
"""

import argparse
import json
import subprocess
import sys
import time
from dataclasses import dataclass, field

DEFAULT_URL = "https://seuils-virid.vercel.app"

ENDPOINTS = [
    ("Homepage", "/"),
    ("API Paramètres", "/api/v1/parametres.json"),
    ("API Changelog", "/api/v1/changelog.json"),
    ("API Sources", "/api/v1/sources.json"),
    ("API Historique", "/api/v1/historique.json"),
    ("API TVA", "/api/v1/tva.json"),
    ("API ACRE", "/api/v1/acre.json"),
    ("API DROM", "/api/v1/drom.json"),
    ("API CSV", "/api/v1/parametres.csv"),
    ("Health", "/api/health"),
]


@dataclass
class Metriques:
    url: str
    ttfb: float = 0.0
    total: float = 0.0
    dns: float = 0.0
    connect: float = 0.0
    tls: float = 0.0
    status_code: int = 0
    cache_control: str = ""
    x_vercel_cache: str = ""
    x_vercel_id: str = ""
    content_type: str = ""
    content_length: int = 0


def mesure_curl(url: str, timeout: int = 15) -> dict:
    """Mesure détaillée via curl -w (timing précis)."""
    cmd = [
        "curl", "-s", "-o", "/dev/null",
        "-w", "%{time_namelookup}|%{time_connect}|%{time_appconnect}|%{time_pretransfer}|%{time_starttransfer}|%{time_total}|%{http_code}|%{size_download}",
        "--max-time", str(timeout),
        url
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 2)
        parts = result.stdout.strip().split("|")
        if len(parts) >= 8:
            return {
                "dns": float(parts[0]) * 1000,
                "connect": float(parts[1]) * 1000,
                "tls": float(parts[2]) * 1000,
                "pretransfer": float(parts[3]) * 1000,
                "ttfb": float(parts[4]) * 1000,
                "total": float(parts[5]) * 1000,
                "status": int(parts[6]),
                "size": int(parts[7]),
            }
    except Exception:
        pass
    return {}


def mesure_headers(url: str, timeout: int = 15) -> dict:
    """Récupère les headers de réponse via curl -I."""
    cmd = ["curl", "-s", "-I", "--max-time", str(timeout), url]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 2)
        headers = {}
        for line in result.stdout.split("\n"):
            if ":" in line:
                key, val = line.split(":", 1)
                headers[key.strip().lower()] = val.strip()
        return headers
    except Exception:
        return {}


def mesure_endpoint(nom: str, url: str, timeout: int = 15) -> Metriques:
    """Mesure les métriques de performance d'un endpoint."""
    m = Metriques(url=url)

    # Mesure curl (timing précis)
    curl_data = mesure_curl(url, timeout)
    if curl_data:
        m.ttfb = curl_data.get("ttfb", 0)
        m.total = curl_data.get("total", 0)
        m.dns = curl_data.get("dns", 0)
        m.connect = curl_data.get("connect", 0)
        m.tls = curl_data.get("tls", 0)
        m.status_code = curl_data.get("status", 0)
        m.content_length = curl_data.get("size", 0)

    # Headers
    headers = mesure_headers(url, timeout)
    m.cache_control = headers.get("cache-control", "")
    m.x_vercel_cache = headers.get("x-vercel-cache", "").upper()
    m.x_vercel_id = headers.get("x-vercel-id", "")
    m.content_type = headers.get("content-type", "")

    return m


def analyse_metriques(m: Metriques) -> list:
    """Analyse les métriques et génère des recommandations."""
    recos = []

    # Analyse TTFB
    if m.ttfb > 800:
        recos.append(f"🔴 TTFB {m.ttfb:.0f}ms > 800ms — froid de fonction ou lenteur DB")
        if "MISS" in m.x_vercel_cache:
            recos.append("   → Cache MISS : la requête a traversé le CDN. Vérifiez revalidate/ISR.")
        if not m.cache_control:
            recos.append("   → Pas de Cache-Control : ajoutez s-maxage pour le CDN Vercel.")

    # Analyse cache
    if m.cache_control:
        if "no-cache" in m.cache_control or "no-store" in m.cache_control:
            recos.append(f"🟡 Cache-Control '{m.cache_control}' — agressif, augmente cold starts.")
    else:
        recos.append("🟡 Pas de Cache-Control — le CDN ne met pas en cache.")

    # Vercel cache status
    if m.x_vercel_cache == "MISS":
        recos.append("🟡 x-vercel-cache: MISS — pas de hit ISR/edge cache sur cette requête.")
    elif m.x_vercel_cache == "HIT":
        recos.append("🟢 x-vercel-cache: HIT — servi depuis le edge cache.")

    # Analyse temps de connexion
    if m.dns > 50:
        recos.append(f"🟡 DNS {m.dns:.0f}ms > 50ms — envisagez dns-prefetch")
    if m.tls > 200:
        recos.append(f"🟡 TLS {m.tls:.0f}ms > 200ms — handshake lent")

    return recos


def calcule_score(resultats: list) -> int:
    """Calcule un score global de performance (0-100)."""
    if not resultats:
        return 0

    scores = []
    for m in resultats:
        s = 100
        # Pénalité TTFB
        if m.ttfb > 2000:
            s -= 40
        elif m.ttfb > 800:
            s -= 25
        elif m.ttfb > 200:
            s -= 10

        # Pénalité cache miss
        if m.x_vercel_cache == "MISS":
            s -= 15

        # Pénalité pas de cache-control
        if not m.cache_control:
            s -= 10

        scores.append(max(0, s))

    return int(sum(scores) / len(scores))


def format_rapport(rapport: dict, verbose: bool = False) -> str:
    """Formate le rapport final."""
    lignes = []
    lignes.append("=" * 72)
    lignes.append(f"  AUDIT PERFORMANCE — {rapport['url']}")
    lignes.append(f"  {rapport['date']}")
    lignes.append("=" * 72)
    lignes.append("")

    # Tableau des métriques
    lignes.append(f"{'Endpoint':<22} {'Status':>6} {'TTFB':>8} {'Total':>8} {'Cache':>10} {'Vercel':>8}")
    lignes.append("-" * 72)

    for m in rapport["resultats"]:
        status = str(m["status_code"])
        ttfb = f"{m['ttfb']:.0f}ms"
        total = f"{m['total']:.0f}ms"
        cache = "HIT" if m["x_vercel_cache"] == "HIT" else "MISS" if m["x_vercel_cache"] == "MISS" else "—"
        vercel = m["x_vercel_cache"] if m["x_vercel_cache"] else "—"
        host = m["url"].split("//")[1].split("/")[0] if "//" in m["url"] else m["url"]
        path = "/" + "/".join(m["url"].split("//")[1].split("/")[1:]) if "//" in m["url"] else m["url"]
        name = f"{host}{path}"[:21]
        lignes.append(f"{name:<22} {status:>6} {ttfb:>8} {total:>8} {cache:>10} {vercel:>8}")

    lignes.append("")

    # Détails par endpoint
    if verbose:
        lignes.append("─" * 72)
        lignes.append("DÉTAILS PAR ENDPOINT")
        lignes.append("─" * 72)
        for m in rapport["resultats"]:
            lignes.append(f"\n📍 {m['url']}")
            lignes.append(f"   Status: {m['status_code']} | Content-Type: {m['content_type']}")
            lignes.append(f"   Taille: {m['content_length']:,} bytes")
            lignes.append(f"   Cache-Control: {m['cache_control'] or '(absent)'}")
            lignes.append(f"   x-vercel-id: {m['x_vercel_id'] or '(absent)'}")
            if m["dns"] >= 0:
                lignes.append(f"   DNS: {m['dns']:.0f}ms | Connect: {m['connect']:.0f}ms | TLS: {m['tls']:.0f}ms")
        lignes.append("")

    # Recommandations
    lignes.append("─" * 72)
    lignes.append("RECOMMANDATIONS")
    lignes.append("─" * 72)

    if rapport["recommandations"]:
        for r in rapport["recommandations"]:
            lignes.append(f"  {r}")
    else:
        lignes.append("  ✅ Toutes les métriques sont dans les clous.")

    lignes.append("")

    # Score
    lignes.append("─" * 72)
    score = rapport["score_global"]
    emoji = "🟢" if score >= 80 else "🟡" if score >= 60 else "🔴"
    lignes.append(f"  SCORE GLOBAL : {emoji} {score}/100")
    lignes.append("=" * 72)

    return "\n".join(lignes)


def main():
    parser = argparse.ArgumentParser(description="Audit de performance Seuils")
    parser.add_argument("--url", default=DEFAULT_URL, help="URL de base du site")
    parser.add_argument("--verbose", "-v", action="store_true", help="Affichage détaillé")
    parser.add_argument("--json", action="store_true", help="Sortie JSON")
    args = parser.parse_args()

    print(f"\n🔍 Audit de performance — {args.url}\n")

    # Mesure de chaque endpoint
    resultats = []
    for nom, path in ENDPOINTS:
        url = f"{args.url.rstrip('/')}{path}"
        print(f"  Mesure de {nom}...", end=" ", flush=True)
        m = mesure_endpoint(nom, url)
        resultats.append(m)
        print(f"TTFB={m.ttfb:.0f}ms Total={m.total:.0f}ms Cache={m.x_vercel_cache or '—'}")

    # Analyse
    recommandations = []
    for m in resultats:
        recommandations.extend(analyse_metriques(m))

    # Score
    score = calcule_score(resultats)

    # Rapport
    rapport = {
        "url": args.url,
        "date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "resultats": [m.__dict__ for m in resultats],
        "recommandations": recommandations,
        "score_global": score,
    }

    # Sortie
    if args.json:
        print(json.dumps(rapport["resultats"], indent=2))
    else:
        print(format_rapport(rapport, verbose=args.verbose))

    # Code de sortie basé sur le score
    if score >= 80:
        sys.exit(0)
    elif score >= 60:
        sys.exit(1)
    else:
        sys.exit(2)


if __name__ == "__main__":
    main()
