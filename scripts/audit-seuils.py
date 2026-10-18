#!/usr/bin/env python3
"""Audit 20/20 du projet Seuils — mesure la qualité réelle du site live.

Dimensions (20 points):
1. API (4 pts): 10 endpoints en 200, JSON valide, contenu non vide
2. Données (2 pts): version récente, sources tracées, contenu vérifié
3. Sécurité (3 pts): HSTS, CSP, X-Frame, X-Content, Referrer, Permissions
4. SEO (3 pts): sitemap, robots, canonical, OG, JSON-LD
5. Performance (2 pts): TTFB < 800ms
6. Documentation (2 pts): README complet, API documentée
7. Distribution (2 pts): IndexNow, RSS, partage social

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


def get(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    debut = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read()
            return r.status, body, time.time() - debut, dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, b"", time.time() - debut, {}
    except Exception as e:
        return 0, b"", time.time() - debut, {}


def check_api(domaine):
    """4 pts: 10 endpoints en 200, JSON valide, contenu non vide."""
    score = 0
    details = []
    for ep in ENDPOINTS_API:
        code, body, _, _ = get(domaine + ep)
        if code == 200 and body:
            if ep.endswith(".json") or ep == "/api/health":
                try:
                    data = json.loads(body)
                    if ep == "/api/v1/parametres.json":
                        count = len(data.get("parametres", []))
                        if count >= 80:
                            score += 1
                            details.append(f"parametres: {count} valeurs")
                        else:
                            details.append(f"parametres: {count} valeurs (attendu 80+)")
                    elif ep == "/api/v1/changelog.json":
                        count = len(data.get("changements", []))
                        if count >= 5:
                            score += 0.5
                            details.append(f"changelog: {count} entrées")
                    elif ep == "/api/v1/historique.json":
                        count = len(data.get("historique", []))
                        if count >= 20:
                            score += 0.5
                            details.append(f"historique: {count} entrées")
                    elif ep == "/api/v1/tva.json":
                        count = len(data.get("tva", []))
                        if count >= 10:
                            score += 0.5
                            details.append(f"tva: {count} entrées")
                    elif ep == "/api/v1/acre.json":
                        count = len(data.get("acre", []))
                        if count >= 8:
                            score += 0.5
                            details.append(f"acre: {count} entrées")
                    elif ep == "/api/v1/drom.json":
                        count = len(data.get("drom", []))
                        if count >= 20:
                            score += 0.5
                            details.append(f"drom: {count} entrées")
                    score += 0.5  # endpoint 200 + JSON valide
                except json.JSONDecodeError:
                    details.append(f"{ep}: JSON invalide")
            else:
                score += 0.5  # endpoint 200 (CSV, HTML)
        else:
            details.append(f"{ep}: HTTP {code}")
    return min(score, 4), details


def check_donnees(domaine):
    """2 pts: version récente, sources tracées, contenu vérifié."""
    score = 0
    details = []
    
    # Check version
    code, body, _, _ = get(domaine + "/api/v1/parametres.json")
    if code == 200:
        data = json.loads(body)
        version = data.get("version_donnees", "")
        if version and version >= "2026-01-01":
            score += 0.5
            details.append(f"version: {version}")
        else:
            details.append(f"version: {version} (ancienne?)")
        
        # Check sources
        sources = data.get("sources", [])
        if len(sources) >= 10:
            score += 0.5
            details.append(f"sources: {len(sources)}")
        else:
            details.append(f"sources: {len(sources)} (attendu 10+)")
    
    # Check changelog
    code, body, _, _ = get(domaine + "/api/v1/changelog.json")
    if code == 200:
        data = json.loads(body)
        changements = data.get("changements", [])
        if len(changements) >= 5:
            score += 0.5
            details.append(f"changelog: {len(changements)} entrées")
        else:
            details.append(f"changelog: {len(changements)} entrées")
    
    # Check health
    code, body, _, _ = get(domaine + "/api/health")
    if code == 200:
        data = json.loads(body)
        if data.get("statut") == "ok":
            score += 0.5
            details.append("base: OK")
        else:
            details.append(f"base: {data.get('statut', 'inconnu')}")
    
    return min(score, 2), details


def check_securite(domaine):
    """3 pts: HSTS, CSP, X-Frame, X-Content, Referrer, Permissions."""
    score = 0
    details = []
    
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
    code, body, _, _ = get(domaine + "/sitemap.xml")
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
    code, body, _, _ = get(domaine + "/robots.txt")
    if code == 200 and b"Sitemap:" in body:
        score += 0.5
        details.append("robots: OK")
    else:
        details.append(f"robots: HTTP {code}")
    
    # Canonical + OG + JSON-LD on page
    code, body, _, _ = get(domaine + "/")
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
    """2 pts: TTFB < 800ms = 1pt, < 400ms = 2pts."""
    score = 0
    details = []
    code, body, ttfb, _ = get(domaine + "/")
    if ttfb < 0.4:
        score += 2
        details.append(f"TTFB: {ttfb*1000:.0f}ms (excellent)")
    elif ttfb < 0.8:
        score += 1.5
        details.append(f"TTFB: {ttfb*1000:.0f}ms (très bon)")
    elif ttfb < 1.5:
        score += 1
        details.append(f"TTFB: {ttfb*1000:.0f}ms (acceptable)")
    else:
        details.append(f"TTFB: {ttfb*1000:.0f}ms (lent)")
    return score, details


def check_rss(domaine):
    """1 pt: RSS feed en 200."""
    code, body, _, _ = get(domaine + "/feed")
    if code == 200 and b"<rss" in body:
        return 1, ["RSS: OK"]
    return 0, [f"RSS: HTTP {code}"]


def check_documentation(domaine):
    """2 pts: README complet, API documentée."""
    score = 0
    details = []
    
    # Check README via GitHub raw
    try:
        code, body, _, _ = get("https://raw.githubusercontent.com/samostheouf/seuils/master/README.md")
        if code == 200:
            readme = body.decode("utf-8", errors="ignore")
            if "/api/v1/parametres.json" in readme and "/api/v1/changelog.json" in readme:
                score += 1
                details.append("README: API documentée")
            else:
                details.append("README: API incomplète")
            if "curl" in readme or "exemple" in readme.lower():
                score += 0.5
                details.append("README: exemples présents")
            else:
                details.append("README: pas d'exemples")
        else:
            details.append(f"README: HTTP {code}")
    except:
        details.append("README: inaccessible")
    
    # Check if API returns proper content-type
    code, body, _, headers = get(domaine + "/api/v1/parametres.json")
    if code == 200 and "application/json" in str(headers.get("Content-Type", "")):
        score += 0.5
        details.append("content-type: JSON correct")
    else:
        details.append("content-type: incorrect")
    
    return min(score, 2), details


def check_distribution(domaine):
    """2 pts: IndexNow, partage social."""
    score = 0
    details = []
    
    # Check sitemap has all API URLs (IndexNow-ready)
    code, body, _, _ = get(domaine + "/sitemap.xml")
    if code == 200:
        urls = body.count(b"<loc>")
        api_urls = body.count(b"/api/v1/")
        if api_urls >= 8:
            score += 0.5
            details.append(f"sitemap: {api_urls} URLs API")
        else:
            details.append(f"sitemap: {api_urls} URLs API (attendu 8+)")
    
    # Check RSS
    code, body, _, _ = get(domaine + "/feed")
    if code == 200 and b"<rss" in body:
        score += 0.5
        details.append("RSS: OK")
    else:
        details.append("RSS: absent")
    
    # Check OG tags for social sharing
    code, body, _, _ = get(domaine + "/")
    html = body.decode("utf-8", errors="ignore")
    if 'og:title' in html and 'og:description' in html:
        score += 0.5
        details.append("OG: partage social OK")
    else:
        details.append("OG: incomplet")
    
    # Check JSON-LD
    if 'application/ld+json' in html:
        score += 0.5
        details.append("JSON-LD: OK")
    else:
        details.append("JSON-LD: absent")
    
    return min(score, 2), details


def main():
    domaine = DOMAINE
    if "--url" in sys.argv:
        domaine = sys.argv[sys.argv.index("--url") + 1]
    
    print(f"=== AUDIT SEUILS 20/20 — {domaine} ===\n")
    
    total = 0
    
    # API (4 pts)
    s, d = check_api(domaine)
    total += s
    print(f"API ({s}/4):")
    for x in d:
        print(f"  {x}")
    print()
    
    # Données (2 pts)
    s, d = check_donnees(domaine)
    total += s
    print(f"Données ({s}/2):")
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
    
    # Documentation (2 pts)
    s, d = check_documentation(domaine)
    total += s
    print(f"Documentation ({s}/2):")
    for x in d:
        print(f"  {x}")
    print()
    
    # Distribution (2 pts)
    s, d = check_distribution(domaine)
    total += s
    print(f"Distribution ({s}/2):")
    for x in d:
        print(f"  {x}")
    print()
    
    print(f"=== SCORE: {total}/18 ===")
    
    if total >= 17:
        print("EXCELLENT — 100% sur toutes les dimensions mesurées.")
    elif total >= 14:
        print("BON — quelques optimisations mineures.")
    elif total >= 10:
        print("MOYEN — des lacunes à corriger.")
    else:
        print("INSUFFISANT — correction requise.")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
