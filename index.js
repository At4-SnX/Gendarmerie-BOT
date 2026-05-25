const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes } = require('discord.js');
const { updateDossier, saveDossier, isAlreadyRegistered, getDossiers } = require('./dataManager');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

// 1. Enregistrement des commandes
const commands = [
    { name: 'ajouter', description: 'Ajouter une info', options: [
        { name: 'nigend', type: 3, description: 'Le NIGEND', required: true },
        { name: 'info', type: 3, description: 'L\'info à ajouter', required: true }
    ]},
    { name: 'consulter', description: 'Consulter un dossier', options: [
        { name: 'nigend', type: 3, description: 'Le NIGEND à rechercher', required: true }
    ]}
];

client.once('ready', async () => {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✅ Bot en ligne et commandes (ajouter/consulter) enregistrées !');
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement des commandes :', error);
    }
});

// 2. Commande !identification
client.on('messageCreate', async (message) => {
    if (message.content === '!identification') {
        const embed = new EmbedBuilder()
            .setTitle('Gendarmerie Nationale - Identification')
            .setDescription('Cliquez sur le bouton pour vous enregistrer.')
            .setColor(0x3498DB);

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
        if (isAlreadyRegistered(interaction.user.id)) return interaction.reply({ content: "❌ Déjà enregistré.", ephemeral: true });
        const modal = new ModalBuilder().setCustomId('id_modal').setTitle('Identification');
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
            saveDossier(nigend, { nom, discordId: interaction.user.id, notes: [] });
            await interaction.reply({ content: `✅ Identité enregistrée. Matricule : **${nigend}**`, ephemeral: true });
        } catch (err) {
            await interaction.reply({ content: "❌ Erreur de renommage (vérifie mes permissions).", ephemeral: true });
        }
    }

    // Commandes Slash
    if (interaction.isChatInputCommand()) {
        if (!interaction.member.roles.cache.has('1508184761380638820')) return interaction.reply({ content: "Accès réservé.", ephemeral: true });

        // Commande /ajouter
        if (interaction.commandName === 'ajouter') {
            const nigend = interaction.options.getString('nigend');
            const info = interaction.options.getString('info');
            if (updateDossier(nigend, info)) await interaction.reply(`✅ Ajouté au dossier ${nigend}.`);
            else await interaction.reply("❌ Dossier introuvable.");
        }

        // Commande /consulter
        if (interaction.commandName === 'consulter') {
            const nigend = interaction.options.getString('nigend');
            const db = getDossiers();
            if (db[nigend]) {
                const dossier = db[nigend];
                const embed = new EmbedBuilder()
                    .setTitle(`Dossier : ${dossier.nom}`)
                    .setDescription(`**Notes :**\n${dossier.notes.length > 0 ? dossier.notes.join('\n') : "Aucune note."}`)
                    .setColor(0x3498DB);
                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply("❌ Dossier introuvable.");
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);