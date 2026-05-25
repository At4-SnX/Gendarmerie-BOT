const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes } = require('discord.js');
const { updateDossier, saveDossier } = require('./dataManager');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

// 1. Enregistrement des commandes (exécuté au démarrage)
const commands = [
    { name: 'ajouter', description: 'Ajouter une info', options: [
        { name: 'nigend', type: 3, description: 'Le NIGEND', required: true },
        { name: 'info', type: 3, description: 'L\'info à ajouter', required: true }
    ]}
];

client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('Bot en ligne et commandes enregistrées !');
});

// 2. Commande !identification (envoi du bouton)
client.on('messageCreate', async (message) => {
    if (message.content === '!identification') {
        const embed = new EmbedBuilder().setTitle('Gendarmerie - Identification').setColor(0x0000FF);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('start_id').setLabel('S\'identifier').setStyle(ButtonStyle.Primary)
        );
        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// 3. Gestion des interactions (Bouton, Modal, Commande)
client.on('interactionCreate', async (interaction) => {
    // Bouton identification
    if (interaction.isButton() && interaction.customId === 'start_id') {
        const modal = new ModalBuilder().setCustomId('id_modal').setTitle('Identification');
        const input = new TextInputBuilder().setCustomId('nomInput').setLabel('Nom Prénom RP').setStyle(TextInputStyle.Short);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    }

        // Modal identification
    if (interaction.isModalSubmit() && interaction.customId === 'id_modal') {

        try {

            const nom = interaction.fields.getTextInputValue('nomInput');

            const nigend = Math.floor(
                100000 + Math.random() * 900000
            ).toString();

            const pseudo = `[${nigend}] ${nom}`.slice(0, 32);

            await interaction.member.setNickname(pseudo);

            saveDossier(nigend, {
                nom: nom,
                notes: []
            });

            await interaction.reply({
                content:
                    `✅ Identification terminée\n\n` +
                    `👤 Nom : ${nom}\n` +
                    `🪪 Matricule : ${nigend}`,
                ephemeral: true
            });

        } catch (error) {

            console.error("Erreur identification :", error);

            await interaction.reply({
                content:
                    "❌ Impossible de terminer l'identification.",
                ephemeral: true
            });
        }
    }

    // Commande /ajouter
    if (interaction.isChatInputCommand() && interaction.commandName === 'ajouter') {
        if (!interaction.member.roles.cache.has('1508184761380638820')) return interaction.reply("Accès réservé.");
        const nigend = interaction.options.getString('nigend');
        const info = interaction.options.getString('info');
        
        if (updateDossier(nigend, info)) {
            await interaction.reply(`✅ Ajouté : ${info}`);
        } else {
            await interaction.reply("❌ Dossier introuvable.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);