# Seuils

**Les paramètres officiels du régime micro-entrepreneur français — lisibles par machine, versionnés, avec leur historique.**

Site : https://seuils-virid.vercel.app

## Le problème

Les seuils, taux de cotisations et seuils de TVA de la micro-entreprise existent, mais :

- ils sont dispersés entre l'Urssaf, Service Public, impots.gouv.fr et le ministère de l'Économie ;
- ils sont publiés en HTML ou en PDF, jamais dans un format lisible par un programme ;
- **ils changent sans que personne ne conserve l'historique** — quand un taux bouge, il faut fouiller des pages d'actualité pour retrouver l'ancienne valeur et sa date.

Résultat : tout développeur qui construit un outil de facturation, de comptabilité ou de simulation pour les indépendants français doit recopier ces valeurs à la main, et les laisse périmer.

## Architecture

```
                    Prisma Postgres (db.prisma.io)
                    = SOURCE DE VÉRITÉ UNIQUE
                    ┌──────────────────────────────┐
                    │ Source       pages officielles│
                    │ Parametre    valeur + année   │
                    │ Changement   avant/après/date │
                    │ Verification journal de veille│
                    └───────────────┬──────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
        seed (pg, Termux)    Next.js API (Vercel)   snapshot/ committé
        depuis data/*.json   lit la base en direct   filet si la base tombe
```

**Pourquoi cette forme.** Les moteurs natifs de Prisma ne tournent pas sur Termux/Android.
Le schéma est donc appliqué en SQL via `pg` (pur JavaScript) depuis Termux, et
`prisma generate` tourne au build **sur Vercel** (Linux x86_64), pas en local.

**La garantie anti-panne.** L'API lit la base. Si la base est injoignable, elle sert le
dernier snapshot committé — qui est **toujours généré depuis la base**, jamais édité à la
main. Résultat : une panne de base donne un site dégradé mais juste, jamais faux, jamais une 500.

## Ce que ce projet fournit

| Ressource | Chemin | Contenu |
|---|---|---|
| API paramètres | `GET /api/v1/parametres.json` | Toutes les valeurs, chacune avec sa source |
| API changements | `GET /api/v1/changelog.json` | Les changements datés (avant / après / raison) |
| API sources | `GET /api/v1/sources.json` | Les pages officielles |
| CSV | `GET /api/v1/parametres.csv` | Le même contenu à plat, pour un tableur |
| État du service | `GET /api/health` | Base joignable ? combien de valeurs ? |
| Page humaine | `GET /` | Les mêmes chiffres, lisibles en trente secondes |

Gratuit, sans clé, sans inscription. Données dans le domaine public (CC0) — réutilisables
librement, y compris commercialement.

## Règles de qualité (non négociables)

1. **Aucune valeur inventée.** Chaque chiffre vient d'une source officielle listée dans `sources`, et porte l'identifiant de cette source.
2. **Une valeur non vérifiée est signalée comme telle.** Voir `acre.a_verifier` : l'incertitude est publiée, pas masquée.
3. **L'historique est la valeur du projet.** Un chiffre seul se copie en une seconde ; savoir *quand* il a changé et *pourquoi* ne se copie pas.
4. **Les changements à venir sont annoncés.** Voir `changement_a_venir` (recodification TVA au 01/01/2027).

## Structure

```
seuils/
├── data/
│   ├── parametres.json     ← source de vérité
│   └── changelog.json      ← historique
├── api/v1/                 ← copies servies publiquement
├── index.html              ← page humaine
├── robots.txt
└── sitemap.xml
```

## Mettre à jour

1. Vérifier la valeur sur la source officielle.
2. Modifier `data/parametres.json`.
3. Ajouter une entrée datée dans `data/changelog.json` (avant / après / raison / source).
4. `cp data/*.json api/v1/`
5. Déployer.

## Sources

- Ministère de l'Économie — cotisations sociales des micro-entreprises
- Service Public Entreprendre — régime fiscal de la micro-entreprise (vérifié 13/05/2026), franchise en base de TVA (vérifié 01/01/2026), cotisations sociales
- Urssaf — évolution des taux de cotisations
- impots.gouv.fr — micro-entrepreneur et TVA

## Avertissement

Ce projet n'est affilié à aucune administration et ne remplace pas la lecture des textes officiels. En cas de divergence, la source officielle fait foi.
