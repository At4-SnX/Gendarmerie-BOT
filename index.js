const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes } = require('discord.js');
const { updateDossier, saveDossier, isAlreadyRegistered, getDossiers, updateGrade, addCertif, findByName } = require('./dataManager');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

// 1. Liste complète des commandes
const commands = [
    { name: 'ajouter', description: 'Ajouter une note au dossier', options: [
        { name: 'nigend', type: 3, description: 'Le NIGEND', required: true },
        { name: 'info', type: 3, description: 'L\'info à ajouter', required: true }
    ]},
    { name: 'consulter', description: 'Consulter un dossier', options: [
        { name: 'nigend', type: 3, description: 'Le NIGEND à rechercher', required: true }
    ]},
    { name: 'promouvoir', description: 'Changer le grade d\'un élève', options: [
        { name: 'nigend', type: 3, description: 'NIGEND', required: true },
        { name: 'grade', type: 3, description: 'Nouveau grade', required: true }
    ]},
    { name: 'certifier', description: 'Ajouter une compétence', options: [
        { name: 'nigend', type: 3, description: 'NIGEND', required: true },
        { name: 'certif', type: 3, description: 'Compétence', required: true }
    ]},
    { name: 'rechercher', description: 'Chercher un élève par son nom', options: [
        { name: 'nom', type: 3, description: 'Nom ou prénom à chercher', required: true }
    ]}
];

// 2. Enregistrement sur Discord
client.once('ready', async () => {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✅ Bot en ligne : Toutes les commandes (ajouter, consulter, promouvoir, certifier, rechercher) sont enregistrées !');
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
    // ... (boutons et modals ici)

    // Commandes Slash
    if (interaction.isChatInputCommand()) {
        // Vérification des droits (rôle gradé)
        if (!interaction.member.roles.cache.has('1508184761380638820')) {
            return interaction.reply({ content: "Accès réservé aux gradés.", ephemeral: true });
        }

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
                    .setDescription(`**Grade :** ${dossier.grade}\n**Certifications :** ${dossier.certifs?.join(', ') || 'Aucune'}\n**Notes :**\n${dossier.notes?.join('\n') || 'Aucune note.'}`)
                    .setColor(0x3498DB);
                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else await interaction.reply("❌ Dossier introuvable.");
        }

        // --- ICI TU AJOUTES TES NOUVELLES COMMANDES ---

        // Commande /promouvoir
        if (interaction.commandName === 'promouvoir') {
            const nigend = interaction.options.getString('nigend');
            const grade = interaction.options.getString('grade');
            if (updateGrade(nigend, grade)) await interaction.reply(`✅ Grade mis à jour pour ${nigend} : **${grade}**`);
            else await interaction.reply("❌ Dossier introuvable.");
        }

        // Commande /certifier
        if (interaction.commandName === 'certifier') {
            const nigend = interaction.options.getString('nigend');
            const certif = interaction.options.getString('certif');
            if (addCertif(nigend, certif)) await interaction.reply(`✅ Compétence ajoutée : **${certif}**`);
            else await interaction.reply("❌ Dossier introuvable.");
        }

        // Commande /rechercher
        if (interaction.commandName === 'rechercher') {
            const nom = interaction.options.getString('nom');
            const result = findByName(nom);
            if (result) {
                const [nigend, data] = result;
                await interaction.reply(`🔍 **Résultat trouvé :**\nNom: ${data.nom}\nNIGEND: ${nigend}\nGrade: ${data.grade}`);
            } else await interaction.reply("❌ Aucun élève trouvé avec ce nom.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);