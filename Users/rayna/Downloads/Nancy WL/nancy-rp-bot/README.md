# 💙 Nancy RP Bot

Bot Discord complet pour la gestion des Whitelists du serveur RP **Nancy RP**.

---

## 📁 Structure du projet

```
nancy-rp-bot/
├── src/
│   ├── index.js                  ← Point d'entrée
│   ├── config.js                 ← ⚙️ TOUS les IDs à modifier ici
│   ├── commands/
│   │   ├── sendWL.js             ← Commande !sendWL
│   │   └── sendAppelStaff.js     ← Commande !sendAppelStaff
│   ├── events/
│   │   ├── ready.js              ← Bot connecté
│   │   ├── messageCreate.js      ← Préfixe commandes
│   │   ├── interactionCreate.js  ← Boutons, menus, modals
│   │   └── guildMemberRemove.js  ← Départ d'un membre
│   └── handlers/
│       ├── eventHandler.js
│       └── commandHandler.js
├── .env.example
├── .gitignore
├── package.json
├── Procfile                      ← Pour Railway
└── README.md
```

---

## ⚙️ Configuration — `src/config.js`

Tous les IDs et options sont centralisés dans ce fichier. **Ne modifiez que ce fichier** pour adapter le bot :

| Clé | Description |
|-----|-------------|
| `ROLES.STAFF` | Rôle qui peut claim/lock/accepter/refuser |
| `ROLES.CIVIL` | Rôle qui ouvre les tickets WL |
| `ROLES.WL` | Rôle ajouté à l'acceptation |
| `CHANNELS.WL_CATEGORY` | Catégorie pour créer les tickets |
| `CHANNELS.WELCOME` | Salon de bienvenue (acceptation) |
| `CHANNELS.LEAVE` | Salon de départ |
| `CHANNELS.APPEL_STAFF` | Salon des appels staff |
| `OWNER_ID` | Ton ID Discord (accès aux commandes owner) |
| `COLOR` | Couleur des embeds (hex) |

---

## 🚀 Installation locale

```bash
# 1. Cloner le projet
git clone <ton-repo>
cd nancy-rp-bot

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env
cp .env.example .env
# Puis remplis BOT_TOKEN dans .env

# 4. Lancer le bot
npm start
```

---

## 🚂 Déploiement sur Railway (Hobby 5€/mois)

1. **Créer un repo GitHub** avec ce code
2. **Aller sur [railway.app](https://railway.app)** → New Project → Deploy from GitHub
3. **Sélectionner ton repo**
4. Dans l'onglet **Variables**, ajouter :
   ```
   BOT_TOKEN = ton_token_discord
   ```
5. Railway détecte automatiquement le `Procfile` et démarre `node src/index.js`
6. **Aucun port n'est nécessaire** — c'est un worker, pas un serveur web

> ⚠️ Sur Railway Hobby, le bot tourne en continu sans s'endormir.

---

## 🤖 Permissions Discord (Bot)

Sur le **portail développeur Discord**, active ces permissions :
- `bot` scope
- `applications.commands` scope
- Permissions : `Manage Channels`, `Manage Roles`, `Send Messages`, `Embed Links`, `Read Message History`, `View Channels`, `Manage Messages`

Active aussi ces **Intents privilegiés** :
- ✅ Server Members Intent
- ✅ Message Content Intent

---

## 📋 Commandes disponibles

| Commande | Accès | Description |
|----------|-------|-------------|
| `!sendWL` | Owner uniquement | Poste le panneau de demande WL dans le salon actuel |
| `!sendAppelStaff` | Owner uniquement | Poste le panneau d'appel staff dans le salon actuel |

---

## 🎫 Fonctionnalités des tickets WL

| Action | Qui peut | Effet |
|--------|----------|-------|
| **Claim** | Staff | Annonce la prise en charge du ticket |
| **Lock / Unlock** | Staff | Empêche / permet au civil d'écrire |
| **Appeler le Staff** | N'importe qui | Ping Staff (1 seule fois par ticket) |
| **Accepter** | Staff | Ajoute le rôle WL + message de bienvenue + ferme le ticket |
| **Refuser** | Staff | Retire tous les rôles + ferme le ticket |

---

## ➕ Ajouter une nouvelle fonctionnalité

### Nouvelle commande préfixe
1. Créer `src/commands/maCommande.js`
2. Exporter `{ name, ownerOnly, execute }`
3. Elle est chargée automatiquement au démarrage

### Nouvelle action dans le ticket
1. Ajouter une option dans `StringSelectMenuBuilder` (fichier `interactionCreate.js`, fonction `handleOpenTicket`)
2. Ajouter un `case` dans le switch du select menu
3. Créer la fonction `handleMonAction(interaction)`

### Nouvel événement Discord
1. Créer `src/events/monEvent.js`
2. Exporter `{ name, once?, execute }`
3. Il est chargé automatiquement

---

## 🐛 Dépannage

| Problème | Solution |
|----------|----------|
| `Missing Permissions` | Vérifie que le bot est **au-dessus** des rôles qu'il gère dans la hiérarchie |
| Ticket non créé | Vérifie l'ID de la catégorie dans `config.js` |
| Rôle WL non ajouté | Vérifie que le rôle bot est au-dessus du rôle WL |
| Bot ne répond pas | Vérifie que le `BOT_TOKEN` est correct et que les Intents sont activés |
