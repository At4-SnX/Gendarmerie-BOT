const {
  EmbedBuilder,
  AttachmentBuilder,
  SlashCommandBuilder,
} = require('discord.js');
const { COLOR, EMOJIS } = require('../config');
const { getPlayerByDiscordName, getPlayer } = require('../utils/database');
const { getRobloxAvatar } = require('../utils/roblox');
const { generateCarteIdentite } = require('../utils/carteIdentite');

module.exports = {
  // Données pour l'enregistrement slash
  data: new SlashCommandBuilder()
    .setName('ciretrouver')
    .setDescription('Retrouver la carte d\'identité d\'un joueur')
    .addStringOption(opt =>
      opt.setName('pseudo')
        .setDescription('Pseudo Discord du joueur (ou une partie)')
        .setRequired(true)
    ),

  // Exécution
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const query  = interaction.options.getString('pseudo');
    let player   = getPlayerByDiscordName(query);

    // Essai par mention/ID
    if (!player) {
      const mentionId = query.replace(/[<@!>]/g, '');
      if (/^\d+$/.test(mentionId)) player = getPlayer(mentionId);
    }

    if (!player) {
      return interaction.editReply({ content: `${EMOJIS.id} Aucun joueur trouvé pour **"${query}"**.` });
    }

    if (player.status !== 'accepted') {
      return interaction.editReply({ content: `${EMOJIS.id} Ce joueur n'a pas de whitelist acceptée.` });
    }

    try {
      const robloxAvatar = player.robloxId ? await getRobloxAvatar(player.robloxId) : null;
      if (robloxAvatar) player.robloxAvatarUrl = robloxAvatar;

      const cardBuffer = await generateCarteIdentite(player);
      const attachment = new AttachmentBuilder(cardBuffer, { name: `carte-${player.discordUsername || 'joueur'}.png` });

      const embed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(`${EMOJIS.id} Carte d'Identité — ${player.nomPrenom || 'Inconnu'}`)
        .setDescription(`Dossier de <@${player.discordId}>`)
        .setImage(`attachment://carte-${player.discordUsername || 'joueur'}.png`)
        .addFields(
          { name: '🎮 Roblox', value: player.robloxUsername ? `@${player.robloxUsername}` : 'Non lié', inline: true },
          { name: '📅 Whitelisté', value: player.updatedAt ? `<t:${Math.floor(new Date(player.updatedAt) / 1000)}:D>` : '—', inline: true },
        )
        .setFooter({ text: 'Nancy RP — Registre Civil' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (err) {
      console.error('[CIretrouver]', err);
      await interaction.editReply({ content: '❌ Erreur lors de la génération de la carte.' });
    }
  },
};
