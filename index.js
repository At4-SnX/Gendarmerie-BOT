const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes } = require('discord.js');
const { updateDossier, saveDossier, isAlreadyRegistered } = require('./dataManager');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

// 1. Enregistrement des commandes
const commands = [
    { name: 'ajouter', description: 'Ajouter une info', options: [
        { name: 'nigend', type: 3, description: 'Le NIGEND', required: true },
        { name: 'info', type: 3, description: 'L\'info à ajouter', required: true }
    ]}
];

client.once('ready', async () => {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✅ Bot en ligne et commandes Slash (/) enregistrées !');
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement des commandes :', error);
    }
});

// 2. Commande !identification
client.on('messageCreate', async (message) => {
    if (message.content === '!identification') {
        const embed = new EmbedBuilder()
            .setTitle('Gendarmerie Nationale - Identification')
            .setDescription('Cliquez sur le bouton ci-dessous pour vous enregistrer officiellement.')
            .setColor(0x3498DB); // Bleu clair professionnel

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('start_id').setLabel('S\'identifier').setStyle(ButtonStyle.Primary)
        );
        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// 3. Interactions
client.on('interactionCreate', async (interaction) => {
    // Bouton identification
    if (interaction.isButton() && interaction.customId === 'start_id') {
        // Vérification anti-multi-identification
        if (isAlreadyRegistered(interaction.user.id)) {
            return interaction.reply({ content: "❌ Tu es déjà identifié dans la base de données.", ephemeral: true });
        }

        const modal = new ModalBuilder().setCustomId('id_modal').setTitle('Identification Gendarmerie');
        const input = new TextInputBuilder().setCustomId('nomInput').setLabel('Nom Prénom RP').setStyle(TextInputStyle.Short);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    }

    // Modal identification
    if (interaction.isModalSubmit() && interaction.customId === 'id_modal') {
        const nom = interaction.fields.getTextInputValue('nomInput');
        const nigend = Math.floor(100000 + Math.random() * 900000).toString();
        
        try {
            await interaction.member.setNickname(`[${nigend}] ${nom}`);
            // On enregistre avec l'ID Discord pour bloquer les futures inscriptions
            saveDossier(nigend, { nom, discordId: interaction.user.id, notes: [] });
            await interaction.reply({ content: `✅ Identité enregistrée. Matricule : **${nigend}**`, ephemeral: true });
        } catch (err) {
            console.error("Erreur renommage :", err);
            await interaction.reply({ content: "❌ Erreur : Je n'ai pas la permission de modifier ton pseudo.", ephemeral: true });
        }
    }

    // Commande /ajouter
    if (interaction.isChatInputCommand() && interaction.commandName === 'ajouter') {
        if (!interaction.member.roles.cache.has('1508184761380638820')) return interaction.reply({ content: "Accès réservé aux gradés.", ephemeral: true });
        
        const nigend = interaction.options.getString('nigend');
        const info = interaction.options.getString('info');
        
        if (updateDossier(nigend, info)) {
            await interaction.reply(`✅ Information ajoutée au dossier **${nigend}**.`);
        } else {
            await interaction.reply("❌ Dossier introuvable (vérifie le matricule NIGEND).");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);