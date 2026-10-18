#!/usr/bin/env python3
"""
Audit de performance du site Seuils.

Mesure TTFB, temps total, et analyse les headers de réponse.
Génère un rapport avec recommandations.

Usage :
    python3 scripts/audit-performance.py [--url URL] [--verbose]

Dépendances : requests (pip install requests)
"""

import argparse
import json
import sys
import time
from dataclasses import dataclass, field
from typing import Optional
from urllib.parse import urlparse

try:
    import requests
except ImportError:
    print("❌ Dépendance manquante : pip install requests")
    sys.exit(1)


# ── Configuration ────────────────────────────────────────────────────────────

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

# Seuils de performance (en ms)
SEUILS = {
    "TTFB": {"bon": 200, "acceptable": 800, "mauvais": 2000},
    "Total": {"bon": 500, "acceptable": 1500, "mauvais": 3000},
    "DNS": {"bon": 20, "acceptable": 50, "mauvais": 150},
    "Connect": {"bon": 50, "acceptable": 150, "mauvais": 400},
    "TLS": {"bon": 80, "acceptable": 200, "mauvais": 500},
}


# ── Data classes ─────────────────────────────────────────────────────────────

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
    headers: dict = field(default_factory=dict)


@dataclass
class Rapport:
    url: str
    date: str = ""
    resultats: list[Metriques] = field(default_factory=list)
    recommandations: list[str] = field(default_factory=list)
    score_global: int = 0


# ── Fonctions de mesure ──────────────────────────────────────────────────────

def mesure_endpoint(nom: str, url: str, timeout: int = 15) -> Metriques:
    """Mesure les métriques de performance d'un endpoint."""
    m = Metriques(url=url)
    
    try:
        # Premier mesure : TTFB et temps total
        t0 = time.time()
        resp = requests.get(url, timeout=timeout, allow_redirects=True)
        t1 = time.time()
        
        m.total = (t1 - t0) * 1000  # en ms
        m.status_code = resp.status_code
        m.content_length = len(resp.content)
        
        # TTFB depuis les headers (approximation via le temps de réponse)
        # requests ne donne pas directement le TTFB, donc on utilise une approximation
        m.ttfb = m.total  # approximation si pas de métriques fines
        
        # Headers utiles
        m.cache_control = resp.headers.get("Cache-Control", "")
        m.x_vercel_cache = resp.headers.get("x-vercel-cache", "")
        m.x_vercil_id = resp.headers.get("x-vercel-id", "")
        m.content_type = resp.headers.get("Content-Type", "")
        m.headers = dict(resp.headers)
        
        # Mesure détaillée avec une seconde requête pour TLS/DNS
        import socket
        import ssl
        parsed = urlparse(url)
        host = parsed.hostname or ""
        port = 443
        sock = None
        
        # DNS
        t0 = time.time()
        try:
            ip = socket.gethostbyname(host)
            m.dns = (time.time() - t0) * 1000
        except Exception:
            m.dns = -1
        
        # Connect
        t0 = time.time()
        try:
            sock = socket.create_connection((host, port), timeout=timeout)
            m.connect = (time.time() - t0) * 1000
        except Exception:
            m.connect = -1
        
        # TLS handshake
        if m.connect > 0 and sock is not None:
            t0 = time.time()
            try:
                context = ssl.create_default_context()
                with context.wrap_socket(sock, server_hostname=host) as ssock:
                    m.tls = (time.time() - t0) * 1000
            except Exception:
                m.tls = -1
        
        if sock is not None:
            try:
                sock.close()
            except Exception:
                pass
        
    except requests.exceptions.Timeout:
        m.ttfb = timeout * 1000
        m.total = timeout * 1000
    except Exception as e:
        m.ttfb = -1
        m.total = -1
        m.status_code = -1
    
    return m


# ── Analyse et recommandations ───────────────────────────────────────────────

def analyse_metriques(m: Metriques) -> list[str]:
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
            recos.append(f"🟡 Cache-Control '{m.cache_control}' — agressif, augmente les cold starts.")
    else:
        recos.append("🟡 Pas de Cache-Control — le CDN ne met pas en cache.")
    
    # Vercel cache status
    if m.x_vercel_cache == "MISS":
        recos.append("🟡 x-vercel-cache: MISS — pas de hit ISR/edge cache sur cette requête.")
    elif m.x_vercel_cache == "HIT":
        recos.append(f"🟢 x-vercel-cache: HIT — servi depuis le edge cache.")
    
    return recos


def calcule_score(resultats: list[Metriques]) -> int:
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


def format_rapport(rapport: Rapport, verbose: bool = False) -> str:
    """Formate le rapport final."""
    lignes = []
    lignes.append("=" * 72)
    lignes.append(f"  AUDIT PERFORMANCE — {rapport.url}")
    lignes.append(f"  {rapport.date}")
    lignes.append("=" * 72)
    lignes.append("")
    
    # Tableau des métriques
    lignes.append(f"{'Endpoint':<22} {'Status':>6} {'TTFB':>8} {'Total':>8} {'Cache':>10} {'Vercel':>8}")
    lignes.append("-" * 72)
    
    for m in rapport.resultats:
        status = str(m.status_code)
        ttfb = f"{m.ttfb:.0f}ms"
        total = f"{m.total:.0f}ms"
        cache = "HIT" if m.x_vercel_cache == "HIT" else "MISS" if m.x_vercel_cache == "MISS" else "—"
        vercel = m.x_vercel_cache if m.x_vercel_cache else "—"
        lignes.append(f"{m.url.split('//')[1][:21]:<22} {status:>6} {ttfb:>8} {total:>8} {cache:>10} {vercel:>8}")
    
    lignes.append("")
    
    # Détails par endpoint
    if verbose:
        lignes.append("─" * 72)
        lignes.append("DÉTAILS PAR ENDPOINT")
        lignes.append("─" * 72)
        for m in rapport.resultats:
            lignes.append(f"\n📍 {m.url}")
            lignes.append(f"   Status: {m.status_code} | Content-Type: {m.content_type}")
            lignes.append(f"   Taille: {m.content_length:,} bytes")
            lignes.append(f"   Cache-Control: {m.cache_control or '(absent)'}")
            lignes.append(f"   x-vercel-id: {m.x_vercel_id or '(absent)'}")
            if m.dns >= 0:
                lignes.append(f"   DNS: {m.dns:.0f}ms | Connect: {m.connect:.0f}ms | TLS: {m.tls:.0f}ms")
        lignes.append("")
    
    # Recommandations
    lignes.append("─" * 72)
    lignes.append("RECOMMANDATIONS")
    lignes.append("─" * 72)
    
    if rapport.recommandations:
        for r in rapport.recommandations:
            lignes.append(f"  {r}")
    else:
        lignes.append("  ✅ Toutes les métriques sont dans les clous.")
    
    lignes.append("")
    
    # Score
    lignes.append("─" * 72)
    score = rapport.score_global
    emoji = "🟢" if score >= 80 else "🟡" if score >= 60 else "🔴"
    lignes.append(f"  SCORE GLOBAL : {emoji} {score}/100")
    lignes.append("=" * 72)
    
    return "\n".join(lignes)


# ── Main ─────────────────────────────────────────────────────────────────────

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
    rapport = Rapport(
        url=args.url,
        date=time.strftime("%Y-%m-%d %H:%M:%S"),
        resultats=resultats,
        recommandations=recommandations,
        score_global=score,
    )
    
    # Sortie
    if args.json:
        print(json.dumps([{
            "url": m.url,
            "ttfb": round(m.ttfb, 1),
            "total": round(m.total, 1),
            "dns": round(m.dns, 1),
            "connect": round(m.connect, 1),
            "tls": round(m.tls, 1),
            "status": m.status_code,
            "cache_control": m.cache_control,
            "x_vercel_cache": m.x_vercel_cache,
        } for m in resultats], indent=2))
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
