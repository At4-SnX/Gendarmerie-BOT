const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes } = require('discord.js');
const { updateDossier, saveDossier, isAlreadyRegistered, getDossiers, updateGrade, addCertif, findByName, updateByName } = require('./dataManager');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

// 1. Définition des commandes
const commands = [
    { name: 'ajouter', description: 'Ajouter une note à un gendarme', options: [
        { name: 'nom', type: 3, description: 'Nom ou prénom du gendarme', required: true },
        { name: 'info', type: 3, description: 'L\'info à ajouter', required: true }
    ]},
    { name: 'consulter', description: 'Consulter un dossier complet', options: [
        { name: 'nigend', type: 3, description: 'Le NIGEND à rechercher', required: true }
    ]},
    { name: 'promouvoir', description: 'Changer le grade d\'un élève', options: [
        { name: 'nom', type: 3, description: 'Nom du gendarme', required: true },
        { name: 'grade', type: 3, description: 'Nouveau grade', required: true }
    ]},
    { name: 'certifier', description: 'Ajouter une compétence', options: [
        { name: 'nom', type: 3, description: 'Nom du gendarme', required: true },
        { name: 'certif', type: 3, description: 'Compétence', required: true }
    ]},
    { name: 'rechercher', description: 'Chercher un gendarme par nom', options: [
        { name: 'nom', type: 3, description: 'Nom ou prénom à chercher', required: true }
    ]}
];

// 2. Enregistrement
client.once('ready', async () => {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✅ Bot opérationnel : Toutes les commandes sont enregistrées.');
    } catch (error) { console.error('❌ Erreur enregistrement :', error); }
});

// 3. Gestion Identification (!identification)
client.on('messageCreate', async (message) => {
    if (message.content === '!identification') {
        const embed = new EmbedBuilder().setTitle('Gendarmerie - Identification').setColor(0x3498DB);
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('start_id').setLabel('S\'identifier').setStyle(ButtonStyle.Primary));
        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// 4. Interactions
client.on('interactionCreate', async (interaction) => {
    // Bouton identification
    if (interaction.isButton() && interaction.customId === 'start_id') {
        if (isAlreadyRegistered(interaction.user.id)) return interaction.reply({ content: "❌ Déjà identifié.", ephemeral: true });
        const modal = new ModalBuilder().setCustomId('id_modal').setTitle('Identification');
        modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nomInput').setLabel('Nom Prénom RP').setStyle(TextInputStyle.Short)));
        await interaction.showModal(modal);
    }
    
    if (interaction.isModalSubmit() && interaction.customId === 'id_modal') {
        const nom = interaction.fields.getTextInputValue('nomInput');
        const nigend = Math.floor(100000 + Math.random() * 900000).toString();
        try {
            await interaction.member.setNickname(`[${nigend}] ${nom}`);
            saveDossier(nigend, { nom, discordId: interaction.user.id });
            await interaction.reply({ content: `✅ Identité enregistrée. Matricule : **${nigend}**`, ephemeral: true });
        } catch (e) { await interaction.reply("❌ Erreur de permissions."); }
    }

    // Commandes Slash
    if (interaction.isChatInputCommand()) {
        if (!interaction.member.roles.cache.has('1508184761380638820')) return interaction.reply({ content: "Accès réservé aux gradés.", ephemeral: true });

        // /ajouter (par nom)
        if (interaction.commandName === 'ajouter') {
            const nom = interaction.options.getString('nom');
            const info = interaction.options.getString('info');
            if (updateByName(nom, (d) => d.notes.push(info))) await interaction.reply(`✅ Note ajoutée à **${nom}**.`);
            else await interaction.reply("❌ Élève introuvable.");
        }

        // /consulter (par NIGEND)
        if (interaction.commandName === 'consulter') {
            const nigend = interaction.options.getString('nigend');
            const db = getDossiers();
            if (db[nigend]) {
                const d = db[nigend];
                const embed = new EmbedBuilder().setTitle(`Dossier : ${d.nom}`).setColor(0x3498DB)
                    .setDescription(`**Grade :** ${d.grade}\n**Certifs :** ${d.certifs?.join(', ') || 'Aucune'}\n**Notes :**\n${d.notes?.join('\n') || 'Aucune'}`);
                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else await interaction.reply("❌ Dossier introuvable.");
        }

        // /promouvoir (par nom)
        if (interaction.commandName === 'promouvoir') {
            const nom = interaction.options.getString('nom');
            const grade = interaction.options.getString('grade');
            const res = findByName(nom);
            if (res && updateGrade(res.nigend, grade)) await interaction.reply(`✅ Grade de ${res.nom} mis à jour : **${grade}**`);
            else await interaction.reply("❌ Gendarme introuvable.");
        }

        // /certifier (par nom)
        if (interaction.commandName === 'certifier') {
            const nom = interaction.options.getString('nom');
            const certif = interaction.options.getString('certif');
            const res = findByName(nom);
            if (res && addCertif(res.nigend, certif)) await interaction.reply(`✅ Compétence ajoutée à ${res.nom}.`);
            else await interaction.reply("❌ Gendarme introuvable.");
        }

        // /rechercher (par nom)
        if (interaction.commandName === 'rechercher') {
            const nom = interaction.options.getString('nom');
            const res = findByName(nom);
            if (res) await interaction.reply(`🔍 **Trouvé :** ${res.nom} | Matricule : ${res.nigend} | Grade : ${res.grade}`);
            else await interaction.reply("❌ Aucun Gendarme trouvé.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);