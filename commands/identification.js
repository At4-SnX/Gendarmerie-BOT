const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    REST,
    Routes
} = require('discord.js');

const { updateDossier, saveDossier } = require('./dataManager');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Vérification des variables Railway
if (!process.env.DISCORD_TOKEN) {
    console.error("DISCORD_TOKEN manquant !");
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    console.error("CLIENT_ID manquant !");
    process.exit(1);
}

// Commandes Slash
const commands = [
    {
        name: 'ajouter',
        description: 'Ajouter une info',
        options: [
            {
                name: 'nigend',
                type: 3,
                description: 'Le NIGEND',
                required: true
            },
            {
                name: 'info',
                type: 3,
                description: 'Information à ajouter',
                required: true
            }
        ]
    }
];

// Démarrage du bot
client.once('ready', async () => {

    try {

        const rest = new REST({ version: '10' })
            .setToken(process.env.DISCORD_TOKEN);

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log(`✅ Bot connecté : ${client.user.tag}`);
        console.log("✅ Commandes enregistrées");

    } catch (error) {
        console.error("Erreur démarrage :", error);
    }
});

// Commande !identification
client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    if (message.content === '!identification') {

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Gendarmerie Nationale')
            .setDescription('Cliquez sur le bouton pour vous identifier.')
            .setColor(0x0000FF);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('start_id')
                    .setLabel("S'identifier")
                    .setStyle(ButtonStyle.Primary)
            );

        await message.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
});

// Interactions
client.on('interactionCreate', async (interaction) => {

    // Bouton
    if (interaction.isButton() && interaction.customId === 'start_id') {

        const modal = new ModalBuilder()
            .setCustomId('id_modal')
            .setTitle('Identification');

        const input = new TextInputBuilder()
            .setCustomId('nomInput')
            .setLabel('Nom Prénom RP')
            .setPlaceholder('Dupont Jean')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);

        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    // Modal identification
    if (interaction.isModalSubmit() && interaction.customId === 'id_modal') {

        try {

            const nom = interaction.fields.getTextInputValue('nomInput');

            // Génération du matricule
            const nigend = Math.floor(
                100000 + Math.random() * 900000
            ).toString();

            // Pseudo limité à 32 caractères
            const pseudo = `[${nigend}] ${nom}`.slice(0, 32);

            // Changement du pseudo
            await interaction.member.setNickname(pseudo);

            // Sauvegarde
            saveDossier(nigend, {
                nom: nom,
                notes: []
            });

            // Réponse
            await interaction.reply({
                content:
                    `✅ Identification terminée\n\n` +
                    `👤 Nom : ${nom}\n` +
                    `🪪 Matricule : ${nigend}`,
                ephemeral: true
            });

            console.log(`${nom} identifié (${nigend})`);

        } catch (error) {

            console.error("Erreur identification :", error);

            await interaction.reply({
                content:
                    "❌ Impossible de terminer l'identification.\n" +
                    "Vérifie les permissions du bot.",
                ephemeral: true
            });
        }
    }

    // Commande /ajouter
    if (
        interaction.isChatInputCommand() &&
        interaction.commandName === 'ajouter'
    ) {

        // ID du rôle autorisé
        const roleId = '1508184761380638820';

        if (!interaction.member.roles.cache.has(roleId)) {

            return interaction.reply({
                content: "❌ Accès réservé.",
                ephemeral: true
            });
        }

        const nigend = interaction.options.getString('nigend');
        const info = interaction.options.getString('info');

        const updated = updateDossier(nigend, info);

        if (updated) {

            await interaction.reply({
                content: `✅ Information ajoutée au dossier ${nigend}`,
                ephemeral: true
            });

        } else {

            await interaction.reply({
                content: "❌ Dossier introuvable.",
                ephemeral: true
            });
        }
    }
});

// Connexion
client.login(process.env.DISCORD_TOKEN);