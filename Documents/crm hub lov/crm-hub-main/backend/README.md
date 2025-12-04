# CRM Hub Backend API

Backend API pour le système d'authentification personnalisé et la gestion des abonnements.

## 🚀 Installation

```bash
cd backend
npm install
```

## ⚙️ Configuration

1. Copiez le fichier `.env.example` vers `.env`:
```bash
copy .env.example .env
```

2. Configurez les variables d'environnement dans `.env`:
   - Configuration MySQL
   - Clé secrète JWT
   - Clés API Stripe
   - Clé API OpenAI

## 📊 Base de Données

1. Créez la base de données MySQL:
```bash
mysql -u root -p < config/database.sql
```

Ou manuellement:
```sql
CREATE DATABASE crm_hub_auth;
```

2. Les tables seront créées automatiquement via le script SQL.

## 🏃 Démarrage

### Mode développement (avec nodemon)
```bash
npm run dev
```

### Mode production
```bash
npm start
```

Le serveur démarre sur `http://localhost:3001`

## 📡 Endpoints API

### Authentication (`/api/auth`)
- `POST /signup` - Inscription (essai gratuit 7 jours)
- `POST /login` - Connexion
- `POST /logout` - Déconnexion
- `POST /refresh` - Rafraîchir le token
- `GET /me` - Informations utilisateur

### Subscriptions (`/api/subscriptions`)
- `GET /plans` - Liste des plans d'abonnement
- `GET /current` - Abonnement actuel
- `POST /create-checkout` - Créer session de paiement Stripe
- `POST /webhook` - Webhook Stripe
- `POST /cancel` - Annuler l'abonnement

### AI Chat (`/api/ai-chat`) - Premium/Ultra uniquement
- `POST /message` - Envoyer un message au chat IA
- `GET /history` - Historique des conversations
- `DELETE /history` - Effacer l'historique
- `GET /stats` - Statistiques d'utilisation

## 🔐 Authentification

Toutes les routes protégées nécessitent un token JWT dans le header:
```
Authorization: Bearer <token>
```

## 💳 Plans d'Abonnement

- **Trial** (7 jours gratuits) - Accès complet
- **Initial** ($45/mois) - Fonctionnalités de base
- **Premium** ($99/mois) - Chat IA illimité + fonctionnalités avancées
- **Ultra** (Sur mesure) - Hébergement dédié + tout Premium

## 🛠️ Technologies

- Node.js + Express
- MySQL
- JWT (jsonwebtoken)
- Bcrypt
- Stripe
- OpenAI GPT-4
- CORS

## 📝 Notes

- Les webhooks Stripe nécessitent une configuration supplémentaire en production
- Assurez-vous de changer le JWT_SECRET en production
- Configurez les clés API Stripe en mode test pour le développement
