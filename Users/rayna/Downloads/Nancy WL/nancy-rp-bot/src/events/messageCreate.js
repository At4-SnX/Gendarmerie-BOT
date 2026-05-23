const { OWNER_ID } = require('../config');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    // Commandes réservées au propriétaire
    if (command.ownerOnly && message.author.id !== OWNER_ID) {
      return message.reply('❌ Tu n\'as pas la permission d\'utiliser cette commande.');
    }

    try {
      await command.execute(message, args, client);
    } catch (err) {
      console.error(`[Erreur commande ${commandName}]`, err);
      message.reply('❌ Une erreur est survenue lors de l\'exécution de la commande.').catch(() => {});
    }
  },
};
