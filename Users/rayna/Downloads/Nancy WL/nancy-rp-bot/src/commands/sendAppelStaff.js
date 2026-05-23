const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { COLOR, EMOJIS } = require('../config');

module.exports = {
  name: 'sendappelstaff',
  ownerOnly: true,
  description: 'Poste le panneau d\'appel staff.',

  async execute(message) {
    await message.delete().catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`${EMOJIS.call} Appel Staff — Nancy RP`)
      .setDescription(
        `${EMOJIS.staff} **Besoin d\'aide d\'un membre du Staff ?**\n\n` +
        `${EMOJIS.arrow} Clique sur le bouton ci-dessous.\n` +
        `${EMOJIS.arrow} Une fenêtre s\'ouvrira pour que tu puisses **expliquer ta situation**.\n` +
        `${EMOJIS.arrow} Le staff sera alerté immédiatement.\n\n` +
        `> ⚠️ Merci de n\'utiliser cette fonction que pour des raisons légitimes.`
      )
      .setFooter({ text: 'Nancy RP — Support Staff' })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId('appel_staff_btn')
      .setLabel('📣 Appeler le Staff')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await message.channel.send({ embeds: [embed], components: [row] });
  },
};
