// ============================================================
//  CONFIG — Nancy RP Bot
//  Modifiez ici tous les IDs sans toucher au reste du code
// ============================================================

module.exports = {
  // ── Rôles ──────────────────────────────────────────────
  ROLES: {
    STAFF:  '1507816128792105101',   // Rôle Staff (peut claim)
    CIVIL:  '1507816149923139815',   // Rôle Civil (ouvre les tickets WL)
    WL:     '1507818215965982870',   // Rôle attribué à l'acceptation
  },

  // ── Salons ─────────────────────────────────────────────
  CHANNELS: {
    WL_CATEGORY:    '1507810505597911060',   // Catégorie où créer les tickets WL
    WELCOME:        '1507797013146763315',   // Message de bienvenue (acceptation)
    LEAVE:          '1507797038006276197',   // Message de départ
    APPEL_STAFF:    '1507802454224539716',   // Salon appel staff
    ROBLOX_LINK:    '1507802454224539716',   // Salon où poster le panel !sendroblox (modifiable)
    CARTE_ID:       '1507797013146763315',   // Salon où envoyer les cartes d'identité (modifiable)
  },

  // ── Propriétaire du bot ────────────────────────────────
  OWNER_ID: '1022469165824606258',

  // ── Thème visuel ───────────────────────────────────────
  COLOR: 0x237FEB,   // Couleur principale des embeds

  // ── Emojis ─────────────────────────────────────────────
  EMOJIS: {
    ticket:   '🎫',
    staff:    '👮',
    lock:     '🔒',
    unlock:   '🔓',
    accept:   '✅',
    refuse:   '❌',
    call:     '📣',
    welcome:  '💙',
    leave:    '👋',
    claim:    '🙋',
    arrow:    '➡️',
    roblox:   '🎮',
    id:       '🪪',
  },

  // ── Base de données JSON (fichier local) ───────────────
  DB_PATH: './data/players.json',
};
