const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { COLOR, EMOJIS } = require('../config');

module.exports = {
  name: 'sendwl',
  ownerOnly: true,
  description: 'Poste le panneau de demande de Whitelist.',

  async execute(message) {
    // Supprime la commande
    await message.delete().catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`${EMOJIS.ticket} Demande de Whitelist — Nancy RP`)
      .setDescription(
        `${EMOJIS.welcome} **Bienvenue sur Nancy RP !**\n\n` +
        `Pour rejoindre notre serveur en tant que joueur officiel, tu dois passer notre **whitelist**.\n\n` +
        `${EMOJIS.arrow} Clique sur le bouton ci-dessous pour **ouvrir un ticket**.\n` +
        `${EMOJIS.arrow} Un membre du **Staff** te posera des questions pour valider ta candidature.\n` +
        `${EMOJIS.arrow} Sois **patient·e**, respectueux·se et bien préparé·e.\n\n` +
        `> 💙 Nous avons hâte de t\'accueillir dans la ville !`
      )
      .setImage('https://i.imgur.com/placeholder.png') // ← Remplace par ta bannière si tu en as une
      .setFooter({ text: 'Nancy RP — Whitelist System' })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId('open_wl_ticket')
      .setLabel('📋 Faire une demande de WL')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await message.channel.send({ embeds: [embed], components: [row] });
  },
};
