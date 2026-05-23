const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');

/**
 * Génère une carte d'identité RP en image PNG.
 * Retourne un Buffer PNG.
 */
async function generateCarteIdentite(player) {
  const W = 800, H = 500;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ── Fond dégradé bleu foncé ───────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0a1628');
  bg.addColorStop(1, '#0d2347');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Bordure bleue ─────────────────────────────────────
  ctx.strokeStyle = '#237FEB';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, W - 16, H - 16);

  // ── Ligne décorative ──────────────────────────────────
  ctx.strokeStyle = '#1a5fad';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(250, 30);
  ctx.lineTo(250, H - 30);
  ctx.stroke();

  // ── En-tête ───────────────────────────────────────────
  ctx.fillStyle = '#237FEB';
  ctx.fillRect(0, 0, W, 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🪪  CARTE D\'IDENTITÉ — NANCY RP', W / 2, 38);

  ctx.font = '13px Arial';
  ctx.fillStyle = '#a8cfff';
  ctx.fillText('République de Nancy — Serveur Roleplay', W / 2, 55);

  // ── Photo / Avatar Roblox ─────────────────────────────
  try {
    if (player.robloxAvatarUrl) {
      const avatar = await loadImage(player.robloxAvatarUrl);
      // Cadre photo
      ctx.strokeStyle = '#237FEB';
      ctx.lineWidth = 3;
      ctx.strokeRect(35, 85, 170, 170);
      ctx.drawImage(avatar, 35, 85, 170, 170);
    } else {
      // Placeholder
      ctx.fillStyle = '#1a3a6e';
      ctx.fillRect(35, 85, 170, 170);
      ctx.fillStyle = '#237FEB';
      ctx.font = '60px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👤', 120, 190);
    }
  } catch {
    ctx.fillStyle = '#1a3a6e';
    ctx.fillRect(35, 85, 170, 170);
  }

  // Roblox username sous la photo
  ctx.fillStyle = '#a8cfff';
  ctx.font = '13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`@${player.robloxUsername || 'Non lié'}`, 120, 278);

  // ── Infos RP ──────────────────────────────────────────
  const leftX = 275;
  let y = 90;
  const lineH = 38;

  function drawField(label, value) {
    ctx.fillStyle = '#6aa3e8';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label.toUpperCase(), leftX, y);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(value || '—', leftX, y + 18);
    // Séparateur
    ctx.strokeStyle = '#1a3a6e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftX, y + 26);
    ctx.lineTo(W - 30, y + 26);
    ctx.stroke();
    y += lineH;
  }

  drawField('Nom & Prénom RP', player.nomPrenom);
  drawField('Origine', player.origine);
  drawField('Date de naissance', player.dateNaissance);
  drawField('Âge', player.age ? `${player.age} ans` : '—');
  drawField('Ambition RP', player.ambition);
  drawField('Discord', player.discordTag || '—');

  // ── Numéro de dossier ─────────────────────────────────
  ctx.fillStyle = '#1a3a6e';
  ctx.fillRect(30, H - 70, 200, 35);
  ctx.fillStyle = '#6aa3e8';
  ctx.font = '11px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('N° DOSSIER', 40, H - 52);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Arial';
  ctx.fillText(`NRP-${player.discordId?.slice(-6) || '000000'}`, 40, H - 38);

  // ── Date d'émission ───────────────────────────────────
  const today = new Date().toLocaleDateString('fr-FR');
  ctx.fillStyle = '#6aa3e8';
  ctx.font = '11px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`Émis le ${today}`, W - 30, H - 20);

  // ── Watermark ─────────────────────────────────────────
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#237FEB';
  ctx.font = 'bold 100px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('NANCY RP', W / 2, H / 2 + 40);
  ctx.globalAlpha = 1;

  return canvas.toBuffer('image/png');
}

module.exports = { generateCarteIdentite };
