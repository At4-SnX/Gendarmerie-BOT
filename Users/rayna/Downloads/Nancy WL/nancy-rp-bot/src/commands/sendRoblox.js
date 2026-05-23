const {
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { COLOR, EMOJIS } = require('../config');

module.exports = {
  name: 'sendroblox',
  ownerOnly: true,
  description: 'Poste le panneau de liaison compte Roblox.',

  async execute(message) {
    await message.delete().catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`${EMOJIS.roblox} Liaison Compte Roblox — Nancy RP`)
      .setDescription(
        `${EMOJIS.welcome} **Lie ton compte Roblox à ton profil Discord !**\n\n` +
        `${EMOJIS.arrow} Ton pseudo Discord affichera ton **@ Roblox** à côté.\n` +
        `${EMOJIS.arrow} Ta **carte d'identité** sera enrichie de ton avatar Roblox.\n` +
        `${EMOJIS.arrow} La vérification prouve que le compte t'appartient.\n\n` +
        `> Clique sur le bouton ci-dessous pour commencer.`
      )
      .setFooter({ text: 'Nancy RP — Système Roblox' })
      .setTimestamp();

    const linkBtn = new ButtonBuilder()
      .setCustomId('roblox_open_modal')
      .setLabel(`${EMOJIS.roblox} Lier mon compte Roblox`)
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(linkBtn);

    const panelMsg = await message.channel.send({ embeds: [embed], components: [row] });

    // Collecteur pour le bouton du panel — ouvre le modal
    const collector = panelMsg.createMessageComponentCollector({
      filter: i => i.customId === 'roblox_open_modal',
    });

    collector.on('collect', async i => {
      const modal = new ModalBuilder()
        .setCustomId('roblox_link_modal')
        .setTitle('🎮 Liaison Roblox — Nancy RP');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('robloxUsername')
            .setLabel('Ton nom d\'utilisateur Roblox exact')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(50)
            .setPlaceholder('Ex: NancyPlayer123')
        )
      );

      await i.showModal(modal);
    });
  },
};
