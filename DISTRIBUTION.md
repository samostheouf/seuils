# PLAN DE DISTRIBUTION — Dataset Seuils Micro-Entrepreneur

> **Contexte** : Jeu de données public français (seuils micro-fiscaux 2026, historique daté). Site live : https://seuils-virid.vercel.app  
> **Contrainte** : 0€, aucun compte payant. Comptes humains gratuits OK (GitHub: samostheouf, email: samilaboulette21@gmail.com).  
> **Objectif** : Maximiser la visibilité et la réutilisation du dataset.

---

## TIER 1 — Effort Faible / Résultat Élevé (Faire en premier, cette semaine)

### 1. data.gouv.fr — Publication directe du dataset

| Champ | Détail |
|---|---|
| **URL** | https://www.data.gouv.fr/fr/admin/ → "Publiez un jeu de données" |
| **Coût** | 0€ (100% gratuit) |
| **Compte humain** | OUI — compte utilisateur gratuit (email + mot de passe) |
| **Qui peut publier** | Tout le monde. Sous son nom propre (particulier) OU sous une organisation |
| **Création organisation** | Optionnelle mais recommandée pour la crédibilité. Gratuit. Pas besoin de SIRET (recommandé mais non obligatoire pour créer l'org). |

**Procédure exacte :**
1. Créer compte : https://www.data.gouv.fr/fr/login/ → "Créer un compte"
2. (Optionnel mais recommandé) Créer organisation : https://www.data.gouv.fr/fr/admin/organizations/new/
3. Publier : https://www.data.gouv.fr/fr/admin/dataset/new/
4. Remplir : Titre*, Description*, Fréquence de mise à jour*, Licence (Licence Ouverte 2.0 recommandée)
5. Importer fichier CSV (ou lien vers ressource distante)
6. Publier

**Alternative API** (si mises à jour fréquentes) :
- Clé API dans paramètres de profil → header `X-API-KEY`
- Doc : https://doc.data.gouv.fr/api/intro/
- Création dataset via `POST /api/1/datasets/`

**⚠️ Note** : Un dataset similaire existe déjà — "Chiffres du régime micro-entrepreneur" par MicroBoussole (https://www.data.gouv.fr/datasets/chiffres-du-regime-micro-entrepreneur). Publier quand même le vôtre : angle différent (API+site vs CSV statique), historique daté, sources multiples. Pas de conflit, c'est complémentaire.

**Estimation effort** : 30-45 min | **Visibilité** : Très élevée (portail national français)

---

### 2. Hugging Face Datasets

| Champ | Détail |
|---|---|
| **URL** | https://huggingface.co/datasets |
| **Coût** | 0€ |
| **Compte humain** | OUI — compte Hugging Face gratuit |

**Procédure :**
1. Créer compte : https://www.huggingface.co/join
2. New Dataset → nom : `seuils-micro-entrepreneur`
3. Upload drag & drop du CSV
4. Rédiger Dataset Card (README avec métadonnées)
5. Public par défaut

**Pourquoi ici** : Data Viewer intégré, API `load_dataset()` disponible, indexing par moteurs de recherche ML, communauté de réutilisateurs de données.

**Estimation effort** : 15 min | **Visibilité** : Élevée (communauté ML/data science internationale)

---

### 3. Kaggle Datasets

| Champ | Détail |
|---|---|
| **URL** | https://www.kaggle.com/datasets |
| **Coût** | 0€ |
| **Compte humain** | OUI — compte Google requis |

**Procédure :**
1. Créer compte Kaggle (via Google)
2. New Dataset → upload CSV
3. Titre, description, licence (CC BY 4.0 ou Licence Ouverte)
4. Publier

**Estimation effort** : 15 min | **Visibilité** : Élevée (data scientists, compétitions)

---

### 4. GitHub — Dépôt du code + soumission Awesome Lists

| Champ | Détail |
|---|---|
| **URLs** | https://github.com/samostheouf/seuils (ou nom choisi) |
| **Coût** | 0€ |
| **Compte humain** | Déjà existant (samostheouf) |

**Actions :**
1. Créer dépôt public GitHub avec le code source du scraper/générateur de données
2. Licence MIT ou ouverte
3. Soumettre aux listes "awesome" :
   - **Woxup-France/awesome-french-open-data** : https://github.com/Woxup-France/awesome-french-open-data → PR dans README
   - **Evan-Crx/awesome-france-api** : https://github.com/Evan-Crx/awesome-france-api → PR (si API publique)
   - **betagouv/mon-entreprise** : pas directement, mais peut être mentionné dans les issues

**Estimation effort** | 30 min (dépôt) + 10 min par PR | **Visibilité** : Élevée (développeurs, contributeurs open data)

---

## TIER 2 — Effort Moyen / Résultat Moyen (Ce mois-ci)

### 5. DataHub (CKAN instance — Open Knowledge Foundation)

| Champ | Détail |
|---|---|
| **URL** | https://datahub.ckan.io |
| **Coût** | 0€ |
| **Compte humain** | OUI — compte + demande d'organisation |

**Procédure :**
1. Créer compte sur datahub.ckan.io
2. Demander une organisation via le forum/community page (anti-spam)
3. Ajouter dataset dans l'organisation
4. 100MB max par fichier

**Estimation effort** : 1h (incl. attente validation org) | **Visibilité** : Moyenne (répertoire CKAN international)

---

### 6. Journal du Hacker — Soumission d'article

| Champ | Détail |
|---|---|
| **URL** | https://www.journalduhacker.net |
| **Coût** | 0€ |
| **Compte humain** | OUI — sur invitation (demander sur le site ou réseaux) |

**Règle** : Communauté style lobste.rs. Soumission d'articles tech légitime si le projet est open source et utile à la communauté. Pas de spam.

**Action** : Demander une invitation → soumettre un article décrivant le projet (comment les données sont collectées, pourquoi, comment les réutiliser).

**Estimation effort** | 1h (rédaction article) | **Visibilité** : Moyenne-élective (lecteurs tech FR exigeants)

---

### 7. Reddit — r/developpeurs

| Champ | Détail |
|---|---|
| **URL** | https://www.reddit.com/r/developpeurs/ |
| **Coût** | 0€ |
| **Compte humain** | OUI — Reddit gratuit |

**Règles d'auto-promotion (STRICTES) :**
- ❌ Auto-promo interdite par défaut
- ✅ Exception : projet **open source** (lien repo obligatoire) + **participation préalable** sur le sub + post en **français**
- ✅ Demande de retours autorisée si conditions ci-dessus remplies
- ⚠️ Compte non créé le jour même, pas de karma négatif
- ⚠️ Les mods sont stricts — suppriment sans avertissement

**Action** :
1. Participer d'abord (commenter 3-5 posts sur 2-3 semaines)
2. Puis poster : "[Projet open source] J'ai construit une API+dataset des seuils micro-entrepreneur 2026, depuis les données Urssaf/BOFiP. Retours bienvenus."
3. Lien vers repo GitHub obligatoire

**Estimation effort** : 2-3 semaines (participation préalable) | **Visibilité** : Élevée si accepté, sinon suppression

---

## TIER 3 — Effort Élevé / Résultat Spéculatif (Long terme)

### 8. data.europa.eu — Moissonnage européen

| Champ | Détail |
|---|---|
| **URL** | https://data.europa.eu/en/about/add-your-open-data-catalogue |
| **Coût** | 0€ |
| **Compte humain** | OUI |

**Reality check** : data.europa.eu **ne publie pas directement** les datasets tiers. Le mécanisme est le **moissonnage** : votre portail doit être harvesté par eux.

**Conditions :**
- Avoir un portail avec catalogue DCAT-AP, CKAN API, ou OAI-PMH
- Remplir le checklist technique (13 points)
- Soumettre via formulaire de contact : "Get harvested by the European Data Portal"

**Pour le projet Seuils** : À moins de déployer un portail CKAN/DCAT complet, ce n'est pas réaliste à court terme. Data.gouv.fr suffit — data.europa.eu harveste déjà data.gouv.fr automatiquement.

**Verdict** : ❌ Skip pour l'instant. Revenir si le projet devient un portail multi-datasets.

---

### 9. Discord — Communautés francophones

| Serveur | URL | Taille | Salon projets | Règle auto-promo |
|---|---|---|---|---|
| **DevHub Community** | https://devhub-community.fr/ | ~350 membres | "Showcase" dédié | OK dans le salon showcase |
| **Nexus Community** | https://discord.me/nexus-community-fr | Grande | Canaux projets/entrepreneuriat | OK si pas spam |
| **Vibe Code France** | https://discord.gg/6RKYx8fVdz | ~350 membres | Forum projets lancés | Explicitement prévu pour montrer ses projets |
| **DevCord** | https://discord.com/servers/devcord-1215070204611133510 | Grande | Salons projets | Toléré si pas répétitif |

**Action** : Rejoindre DevHub (bienveillant, taille humaine) + Vibe Code France (espace prévu pour les projets). Poster une courte description + lien.

**Estimation effort** : 30 min | **Visibilité** : Variable (communauté restreinte mais engagée)

---

## TIER 4 — Newsletters (Soumission indirecte / Contacter)

| Newsletter | URL | Méthode soumission | Accepte tiers ? |
|---|---|---|---|
| **Le Courrier du hacker** | https://lecourrierduhacker.com/ | Curation par fondateur (Carl Chenet) | Pas de formulaire → contacter via site |
| **Human Coders News** | https://news.humancoders.com/ | Contacter Camille Roux | Possible si projet dev FR |
| **Veille techno (Camille Roux)** | https://www.camilleroux.com/veille/ | Contact via site | Curation manuelle |

**Action** : Contacter par email en présentant le projet en 3 phrases (problème résolu, données, lien). Pas de garantie de publication.

---

## RÉCAPITULATIF — Plan d'action ordonné

| # | Canal | Coût | Compte | Effort | Résultat | Priorité |
|---|---|---|---|---|---|---|
| 1 | **data.gouv.fr** | 0€ | OUI | 45 min | ★★★★★ | FAIRE |
| 2 | **Hugging Face** | 0€ | OUI | 15 min | ★★★★ | FAIRE |
| 3 | **Kaggle** | 0€ | OUI | 15 min | ★★★★ | FAIRE |
| 4 | **GitHub dépôt + Awesome lists** | 0€ | Déjà | 40 min | ★★★★ | FAIRE |
| 5 | **Journal du Hacker** | 0€ | OUI (invit) | 1h | ★★★ | Ce mois |
| 6 | **Reddit r/developpeurs** | 0€ | OUI | 2-3 sem | ★★★ | Après participation |
| 7 | **Discord DevHub + Vibe Code** | 0€ | OUI | 30 min | ★★ | Optionnel |
| 8 | **DataHub CKAN** | 0€ | OUI | 1h | ★★ | Optionnel |
| 9 | **data.europa.eu** | 0€ | OUI | Portail requis | ★★★ | Skip |
| 10 | **Newsletters** | 0€ | Contact | Variable | ★★ | Long terme |

---

## CE QUI NÉCESSITE UNE ACTION HUMAINE (Montrable automatiquement)

| Action | Pourquoi humain |
|---|---|
| Créer compte data.gouv.fr | Email + mot de passe |
| Créer compte Hugging Face | Email + mot de passe |
| Créer compte Kaggle | Compte Google |
| Demande invitation Journal du Hacker | Processus manuel |
| Participation Reddit avant post | Règle communauté |
| Contact newsletters | Email manuel |

**Aucun de ces canaux n'exige un compte payant.** Tous sont gratuits mais nécessitent une inscription humaine.

---

## NOTES IMPORTANTES

1. **Doublon potentiel** : Le dataset "Chiffres du régime micro-entrepreneur" par MicroBoussole existe déjà sur data.gouv.fr. Vérifiez que le vôtre apporte une valeur distinctive (historique daté, API, granularité différente) avant de publier.

2. **Licence** : Utilisez la **Licence Ouverte 2.0** (data.gouv.fr) ou **CC BY 4.0** (international). Cohérent entre tous les canaux.

3. **API data.gouv.fr** : Si vous utilisez l'API pour publier, attention — par défaut le dataset est public à chaque modification. Utilisez `private: true` pour maintenir en brouillon.

4. **SEO** : Le dataset sur data.gouv.fr bénéficie du référencement du portail national. C'est le canal à plus forte valeur pour le SEO français.
