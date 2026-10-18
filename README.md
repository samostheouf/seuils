# Seuils

**Les paramètres officiels du régime micro-entrepreneur français — lisibles par machine, versionnés, avec leur historique.**

Site : https://seuils-virid.vercel.app  
Données : CC0 (domaine public) — réutilisables librement, y compris commercialement.  
Code : MIT.

## Le problème

Les seuils, taux de cotisations et seuils de TVA de la micro-entreprise existent, mais :

- ils sont dispersés entre l'Urssaf, Service Public, impots.gouv.fr et le ministère de l'Économie ;
- ils sont publiés en HTML ou en PDF, jamais dans un format lisible par un programme ;
- **ils changement sans que personne ne conserve l'historique** — quand un taux bouge, il faut fouiller des pages d'actualité pour retrouver l'ancienne valeur et sa date.

Résultat : tout développeur qui construit un outil de facturation, de comptabilité ou de simulation pour les indépendants français doit recopier ces valeurs à la main, et les laisse périmer.

## API

| Endpoint | Contenu |
|---|---|
| `GET /api/v1/parametres.json` | Toutes les valeurs (82+), chacune avec sa source |
| `GET /api/v1/changelog.json` | Les changements datés (avant / après / raison) |
| `GET /api/v1/sources.json` | Les pages officielles d'où vient chaque valeur |
| `GET /api/v1/historique.json` | Historique des seuils (2022→2026) |
| `GET /api/v1/tva.json` | Seuils de franchise en base de TVA |
| `GET /api/v1/acre.json` | Taux ACRE (réduction cotisations créateurs) |
| `GET /api/v1/drom.json` | Taux DOM-TOM et Mayotte |
| `GET /api/v1/csv` | Export CSV complet |
| `GET /api/v1/parametres.csv` | Export CSV (alias) |
| `GET /feed` | Flux RSS 2.0 des derniers changements |
| `GET /api/health` | État du service (base joignable, volumétrie) |

Gratuit, sans clé, sans inscription. Chaque réponse porte `Cache-Control` et `Access-Control-Allow-Origin: *`.

### Exemples

```bash
# Tous les paramètres
curl https://seuils-virid.vercel.app/api/v1/parametres.json

# Historique des seuils micro-fiscaux
curl https://seuils-virid.vercel.app/api/v1/historique.json

# Flux RSS
curl https://seuils-virid.vercel.app/feed
```

## Architecture

```
              Prisma Postgres (db.prisma.io) = SOURCE DE VÉRITÉ UNIQUE
              seuils_source · seuils_parametre · seuils_changement · seuils_verification
                              │
        ┌─────────────────────┼─────────────────────┐
  seed (pg, Termux)   Next.js API (Vercel)   snapshot/ committe
  depuis data/*.json  lit la base en direct  filet si la base tombe
```

**Pourquoi cette forme.** Les moteurs natifs de Prisma ne tournent pas sur Termux/Android.
Le schéma est donc appliqué en SQL via `pg` (pur JavaScript) depuis Termux, et
`prisma generate` tourne au build **sur Vercel** (Linux x86_64), pas en local.

**La garantie anti-panne.** L'API lit la base. Si la base est injoignable, elle sert le
dernier snapshot committé — qui est **toujours généré depuis la base**, jamais édité à
la main. Résultat : une panne de base donne un site dégradé mais juste, jamais faux, jamais une 500.

## Règles de qualité (non négociables)

1. **Aucune valeur inventée.** Chaque chiffre vient d'une source officielle listée dans `sources`, et porte l'identifiant de cette source.
2. **Une valeur non vérifiée est signalée comme telle.** L'incertitude est publiée, pas masquée.
3. **L'historique est la valeur du projet.** Un chiffre seul se copie en une seconde ; savoir *quand* il a changé et *pourquoi* ne se copie pas.
4. **Les changements à venir sont annoncés.** Voir `changelog.json` (recodification TVA au 01/01/2027).

## Sources

- Ministère de l'Économie — cotisations sociales des micro-entreprises
- Service Public Entreprendre — régime fiscal de la micro-entreprise, franchise TVA
- Urssaf — évolution des taux de cotisations, DOM-TOM
- impots.gouv.fr — micro-entrepreneur et TVA
- Légifrance — décrets et lois (norme)

## Avertissement

Ce projet n'est affilié à aucune administration et ne remplace pas la lecture des textes officiels. En cas de divergence, la source officielle fait foi.
