// ─────────────────────────────────────────────────────────
//  Utilitaire API Roblox
// ─────────────────────────────────────────────────────────

/**
 * Récupère les infos d'un utilisateur Roblox par son username.
 * Retourne { id, name, displayName } ou null si introuvable.
 */
async function getRobloxUser(username) {
  try {
    const res = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    });
    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;
    return data.data[0]; // { id, name, displayName }
  } catch {
    return null;
  }
}

/**
 * Récupère la bio d'un utilisateur Roblox par son ID.
 */
async function getRobloxBio(robloxId) {
  try {
    const res = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
    const data = await res.json();
    return data.description || '';
  } catch {
    return '';
  }
}

/**
 * Récupère l'URL de l'avatar (headshot) d'un utilisateur Roblox.
 */
async function getRobloxAvatar(robloxId) {
  try {
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=420x420&format=Png`
    );
    const data = await res.json();
    return data.data?.[0]?.imageUrl || null;
  } catch {
    return null;
  }
}

/**
 * Vérifie si un code de vérification est présent dans la bio Roblox.
 */
async function verifyCode(robloxId, code) {
  const bio = await getRobloxBio(robloxId);
  return bio.includes(code);
}

/**
 * Génère un code de vérification unique pour un utilisateur Discord.
 */
function generateVerifyCode(discordId) {
  return `NANCY-${discordId.slice(-5)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

module.exports = { getRobloxUser, getRobloxBio, getRobloxAvatar, verifyCode, generateVerifyCode };
