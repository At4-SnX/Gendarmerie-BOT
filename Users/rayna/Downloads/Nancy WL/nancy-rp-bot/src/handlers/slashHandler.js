const { Events } = require('discord.js');

// Gère les commandes slash en plus des commandes préfixe
function registerSlashHandler(client) {
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command || !command.data) return; // Pas une slash command

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`[Slash /${interaction.commandName}]`, err);
      const msg = { content: '❌ Erreur lors de l\'exécution.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
  });
}

module.exports = { registerSlashHandler };
