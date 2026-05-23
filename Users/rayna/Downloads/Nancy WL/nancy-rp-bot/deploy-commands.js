// ─────────────────────────────────────────────────────────
//  deploy-commands.js
//  Lance ce script UNE SEULE FOIS pour enregistrer les
//  commandes slash (/ciretrouver) auprès de Discord.
//
//  node deploy-commands.js
// ─────────────────────────────────────────────────────────
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('ciretrouver')
    .setDescription('Retrouver la carte d\'identité d\'un joueur')
    .addStringOption(opt =>
      opt.setName('pseudo')
        .setDescription('Pseudo Discord du joueur (ou une partie)')
        .setRequired(true)
    )
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('Déploiement des commandes slash…');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Commandes slash déployées avec succès !');
  } catch (err) {
    console.error('❌ Erreur :', err);
  }
})();
