const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

// Commande !identification
client.on('messageCreate', async (message) => {
    if (message.content === '!identification') {
        const embed = new EmbedBuilder()
            .setTitle('Gendarmerie Nationale - Identification')
            .setDescription('Cliquez sur le bouton pour vous enregistrer.')
            .setColor(0x0000FF);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('start_id').setLabel('S\'identifier').setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// Gestion de la commande /ajouter
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ajouter') {
        // 1. Vérification du rôle gradé
        if (!interaction.member.roles.cache.has('1508184761380638820')) {
            return interaction.reply("Accès réservé aux gradés.");
        }

        const nigend = interaction.options.getString('nigend');
        const info = interaction.options.getString('info');

        // 2. Appel de la fonction pour modifier le fichier
        const success = updateDossier(nigend, info);

        if (success) {
            await interaction.reply(`✅ Information ajoutée au dossier ${nigend}.`);
        } else {
            await interaction.reply("❌ Dossier introuvable.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);