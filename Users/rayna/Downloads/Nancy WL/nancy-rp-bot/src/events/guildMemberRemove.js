const { EmbedBuilder } = require('discord.js');
const { CHANNELS, COLOR, EMOJIS } = require('../config');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    try {
      const channel = await client.channels.fetch(CHANNELS.LEAVE).catch(() => null);
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(`${EMOJIS.leave} Un membre a quitté le serveur`)
        .setDescription(`**${member.user.tag}** vient de quitter **Nancy RP**.\nNous lui souhaitons bonne route. ${EMOJIS.leave}`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '👤 Membre', value: `<@${member.user.id}>`, inline: true },
          { name: '📅 Rejoint le', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt / 1000)}:D>` : 'Inconnu', inline: true },
        )
        .setFooter({ text: 'Nancy RP — Au revoir !' })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('[Leave] Erreur :', err);
    }
  },
};
