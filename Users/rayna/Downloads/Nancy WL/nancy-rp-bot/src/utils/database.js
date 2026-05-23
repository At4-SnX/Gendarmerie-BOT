const fs = require('fs');
const path = require('path');
const { DB_PATH } = require('../config');

const dbFile = path.resolve(DB_PATH);

// S'assure que le fichier existe
function ensureDB() {
  const dir = path.dirname(dbFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, '{}');
}

function readDB() {
  ensureDB();
  try {
    return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  } catch {
    return {};
  }
}

function writeDB(data) {
  ensureDB();
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

// Sauvegarde ou met à jour un joueur (clé = discordId)
function savePlayer(discordId, playerData) {
  const db = readDB();
  db[discordId] = { ...db[discordId], ...playerData, discordId, updatedAt: new Date().toISOString() };
  writeDB(db);
  return db[discordId];
}

// Récupère un joueur par son ID Discord
function getPlayer(discordId) {
  return readDB()[discordId] || null;
}

// Récupère un joueur par son pseudo Discord (tag ou username)
function getPlayerByDiscordName(name) {
  const db = readDB();
  const lower = name.toLowerCase();
  return Object.values(db).find(p =>
    p.discordTag?.toLowerCase().includes(lower) ||
    p.discordUsername?.toLowerCase().includes(lower)
  ) || null;
}

// Récupère un joueur par son pseudo Roblox
function getPlayerByRoblox(robloxUsername) {
  const db = readDB();
  return Object.values(db).find(p =>
    p.robloxUsername?.toLowerCase() === robloxUsername.toLowerCase()
  ) || null;
}

module.exports = { savePlayer, getPlayer, getPlayerByDiscordName, getPlayerByRoblox, readDB };
