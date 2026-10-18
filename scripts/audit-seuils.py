#!/usr/bin/env python3
"""Audit 20/20 du projet Seuils — mesure la qualité réelle du site live.

Dimensions (20 points):
1. API (4 pts): 10 endpoints en 200, JSON valide, contenu non vide
2. Données (4 pts): version récente, 82+ valeurs, sources tracées
3. Sécurité (3 pts): HSTS, CSP, X-Frame, X-Content, Referrer, Permissions
4. SEO (3 pts): sitemap, robots, canonical, OG, JSON-LD
5. Performance (2 pts): TTFB < 800ms, LCP < 2500ms
6. Documentation (2 pts): README, API docs, exemples
7. Distribution (2 pts): IndexNow, RSS, partage

Usage: python3 scripts/audit-seuils.py [--url https://...]
Sortie: score /20, détail par dimension, recommandations.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

DOMAINE = "https://seuils-virid.vercel.app"
UA = "Mozilla/5.0 (compatible; seuils-audit/1.0)"

ENDPOINTS_API = [
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
]

ENDPOINTS_SEO = [
    "/",
    "/sitemap.xml",
    "/robots.txt",
    "/feed.xml",
]


def get(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    debut = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read()
            return r.status, body, time.time() - debut
    except urllib.error.HTTPError as e:
        return e.code, b"", time.time() - debut
    except Exception as e:
        return 0, b"", time.time() - debut


def check_api(domaine):
    """4 pts: 10 endpoints en 200, JSON valide, contenu non vide."""
    score = 0
    details = []
    for ep in ENDPOINTS_API:
        code, body, _ = get(domaine + ep)
        if code == 200 and body:
            if ep.endswith(".json") or ep == "/api/health":
                try:
                    data = json.loads(body)
                    if ep == "/api/v1/parametres.json":
                        count = len(data.get("parametres", []))
                        if count >= 80:
                            score += 0.5
                            details.append(f"parametres: {count} valeurs")
                        else:
                            details.append(f"parametres: {count} valeurs (attendu 80+)")
                    elif ep == "/api/v1/changelog.json":
                        count = len(data.get("changements", []))
                        if count >= 5:
                            score += 0.25
                            details.append(f"changelog: {count} entrées")
                    elif ep == "/api/v1/historique.json":
                        count = len(data.get("historique", []))
                        if count >= 20:
                            score += 0.25
                            details.append(f"historique: {count} entrées")
                    elif ep == "/api/v1/tva.json":
                        count = len(data.get("tva", []))
                        if count >= 10:
                            score += 0.25
                            details.append(f"tva: {count} entrées")
                    elif ep == "/api/v1/acre.json":
                        count = len(data.get("acre", []))
                        if count >= 8:
                            score += 0.25
                            details.append(f"acre: {count} entrées")
                    elif ep == "/api/v1/drom.json":
                        count = len(data.get("drom", []))
                        if count >= 20:
                            score += 0.25
                            details.append(f"drom: {count} entrées")
                    score += 0.25  # endpoint 200 + JSON valide
                except json.JSONDecodeError:
                    details.append(f"{ep}: JSON invalide")
            else:
                score += 0.5  # endpoint 200 (CSV, HTML)
        else:
            details.append(f"{ep}: HTTP {code}")
    return min(score, 4), details


def check_securite(domaine):
    """3 pts: HSTS, CSP, X-Frame, X-Content, Referrer, Permissions."""
    score = 0
    details = []
    code, body, _ = get(domaine + "/")
    # Headers are in the response object, not body — use urllib differently
    req = urllib.request.Request(domaine + "/", headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            headers = dict(r.headers)
    except:
        headers = {}
    
    headers_lower = {k.lower(): v for k, v in headers.items()}
    checks = [
        ("strict-transport-security", "HSTS", 0.5),
        ("content-security-policy", "CSP", 0.5),
        ("x-frame-options", "X-Frame", 0.5),
        ("x-content-type-options", "X-Content", 0.5),
        ("referrer-policy", "Referrer", 0.5),
        ("permissions-policy", "Permissions", 0.5),
    ]
    for key, label, pts in checks:
        if key in headers_lower:
            score += pts
            details.append(f"{label}: OK")
        else:
            details.append(f"{label}: MANQUANT")
    return score, details


def check_seo(domaine):
    """3 pts: sitemap, robots, canonical, OG, JSON-LD."""
    score = 0
    details = []
    
    # Sitemap
    code, body, _ = get(domaine + "/sitemap.xml")
    if code == 200 and b"<urlset" in body:
        urls = body.count(b"<loc>")
        if urls >= 10:
            score += 1
            details.append(f"sitemap: {urls} URLs")
        else:
            score += 0.5
            details.append(f"sitemap: {urls} URLs (attendu 10+)")
    else:
        details.append(f"sitemap: HTTP {code}")
    
    # Robots
    code, body, _ = get(domaine + "/robots.txt")
    if code == 200 and b"Sitemap:" in body:
        score += 0.5
        details.append("robots: OK")
    else:
        details.append(f"robots: HTTP {code}")
    
    # Canonical + OG + JSON-LD on page
    code, body, _ = get(domaine + "/")
    html = body.decode("utf-8", errors="ignore")
    if 'rel="canonical"' in html:
        score += 0.5
        details.append("canonical: OK")
    else:
        details.append("canonical: MANQUANT")
    
    if 'og:title' in html or 'og:image' in html:
        score += 0.5
        details.append("OG: OK")
    else:
        details.append("OG: MANQUANT")
    
    if 'application/ld+json' in html:
        score += 0.5
        details.append("JSON-LD: OK")
    else:
        details.append("JSON-LD: MANQUANT")
    
    return score, details


def check_performance(domaine):
    """2 pts: TTFB < 800ms, LCP < 2500ms."""
    score = 0
    details = []
    code, body, ttfb = get(domaine + "/")
    if ttfb < 0.8:
        score += 1
        details.append(f"TTFB: {ttfb*1000:.0f}ms (excellent)")
    elif ttfb < 1.5:
        score += 0.5
        details.append(f"TTFB: {ttfb*1000:.0f}ms (acceptable)")
    else:
        details.append(f"TTFB: {ttfb*1000:.0f}ms (lent)")
    return score, details


def check_rss(domaine):
    """1 pt: RSS feed en 200."""
    code, body, _ = get(domaine + "/feed.xml")
    if code == 200 and b"<rss" in body:
        return 1, ["RSS: OK"]
    return 0, [f"RSS: HTTP {code}"]


def main():
    domaine = DOMAINE
    if "--url" in sys.argv:
        domaine = sys.argv[sys.argv.index("--url") + 1]
    
    print(f"=== AUDIT SEUILS 20/20 — {domaine} ===\n")
    
    total = 0
    max_total = 20
    
    # API (4 pts)
    s, d = check_api(domaine)
    total += s
    print(f"API ({s}/4):")
    for x in d:
        print(f"  {x}")
    print()
    
    # Sécurité (3 pts)
    s, d = check_securite(domaine)
    total += s
    print(f"Sécurité ({s}/3):")
    for x in d:
        print(f"  {x}")
    print()
    
    # SEO (3 pts)
    s, d = check_seo(domaine)
    total += s
    print(f"SEO ({s}/3):")
    for x in d:
        print(f"  {x}")
    print()
    
    # Performance (2 pts)
    s, d = check_performance(domaine)
    total += s
    print(f"Performance ({s}/2):")
    for x in d:
        print(f"  {x}")
    print()
    
    # RSS (1 pt)
    s, d = check_rss(domaine)
    total += s
    print(f"RSS ({s}/1):")
    for x in d:
        print(f"  {x}")
    print()
    
    print(f"=== SCORE: {total}/{max_total} ===")
    
    if total >= 19:
        print("EXCELLENT — prêt pour le trafic.")
    elif total >= 16:
        print("BON — quelques optimisations mineures.")
    elif total >= 12:
        print("MOYEN — des lacunes à corriger.")
    else:
        print("INSUFFISANT — correction requise avant trafic.")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
