# Guide de déploiement – Van Prestige Service

## Identifiants admin par défaut
- **Email** : admin@vanprestige.com
- **Mot de passe** : Admin@2024!

> ⚠️ Changez ce mot de passe dès votre première connexion !

---

## 1. Pousser sur GitHub

```bash
cd C:\Users\beyen\Desktop\van-prestige-service
git init
git add .
git commit -m "Initial commit - Van Prestige Service"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/van-prestige-service.git
git push -u origin main
```

---

## 2. Déployer sur Railway

1. Ouvrez [railway.app](https://railway.app) → **New Project**
2. Choisissez **Deploy from GitHub repo**
3. Sélectionnez votre repo `van-prestige-service`
4. Railway détecte automatiquement Node.js et lance `node server.js`

### Variables d'environnement (Settings → Variables)

| Variable | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | une longue chaîne aléatoire |
| `ADMIN_PASSWORD` | votre nouveau mot de passe |
| `DATA_DIR` | `/data` (si vous utilisez un Volume) |

### Persistance des données (optionnel mais recommandé)

1. Dans Railway : **New** → **Volume**
2. Attachez le volume à votre service
3. Mount path : `/data`
4. Ajoutez `DATA_DIR=/data` dans les variables

---

## 3. Accès à l'application

- **Site public** : `https://votre-app.railway.app`
- **Réservation** : `https://votre-app.railway.app/reservation.html`
- **Admin** : `https://votre-app.railway.app/admin/login.html`

---

## Structure des fichiers

```
van-prestige-service/
├── server.js          # Serveur Express
├── db.js              # Base SQLite
├── package.json
├── Procfile           # web: node server.js
├── railway.json       # Config Railway
├── middleware/
│   └── auth.js        # JWT middleware
├── routes/
│   ├── reservations.js
│   └── admin.js
└── public/
    ├── index.html     # Page d'accueil
    ├── reservation.html
    ├── css/style.css
    ├── js/main.js
    ├── images/logo.svg
    └── admin/
        ├── login.html
        ├── dashboard.html
        ├── reservations.html
        ├── users.html
        ├── css/admin.css
        └── js/admin.js
```
