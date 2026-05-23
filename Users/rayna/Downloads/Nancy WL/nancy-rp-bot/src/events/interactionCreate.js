const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
} = require('discord.js');
const { ROLES, CHANNELS, COLOR, EMOJIS } = require('../config');
const { savePlayer, getPlayer } = require('../utils/database');
const { getRobloxUser, getRobloxAvatar, verifyCode, generateVerifyCode } = require('../utils/roblox');
const { generateCarteIdentite } = require('../utils/carteIdentite');

// ── Stockage temporaire en mémoire ───────────────────────
const usedCallStaff    = new Set();          // appel staff déjà utilisé par ticket
const pendingWLData    = new Map();          // données WL en attente entre les 2 modals
const pendingVerify    = new Map();          // { robloxId, robloxUsername, code } en attente de vérif

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // ── Bouton : Ouvrir ticket WL ─────────────────────────
    if (interaction.isButton() && interaction.customId === 'open_wl_ticket') {
      await handleOpenTicket(interaction);
      return;
    }

    // ── Bouton : Appel Staff (salon dédié) ────────────────
    if (interaction.isButton() && interaction.customId === 'appel_staff_btn') {
      await handleAppelStaffModal(interaction);
      return;
    }

    // ── Bouton : Vérification Roblox ─────────────────────
    if (interaction.isButton() && interaction.customId === 'roblox_verify_btn') {
      await handleRobloxVerify(interaction);
      return;
    }

    // ── Modal : Formulaire WL partie 1 ───────────────────
    if (interaction.isModalSubmit() && interaction.customId === 'wl_form_1') {
      await handleWLForm1(interaction);
      return;
    }

    // ── Modal : Formulaire WL partie 2 ───────────────────
    if (interaction.isModalSubmit() && interaction.customId === 'wl_form_2') {
      await handleWLForm2(interaction);
      return;
    }

    // ── Modal : Appel Staff ───────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId === 'appel_staff_modal') {
      await handleAppelStaffSubmit(interaction);
      return;
    }

    // ── Modal : Lier compte Roblox ────────────────────────
    if (interaction.isModalSubmit() && interaction.customId === 'roblox_link_modal') {
      await handleRobloxLinkModal(interaction);
      return;
    }

    // ── Select Menu : Actions ticket ─────────────────────
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_actions') {
      const value = interaction.values[0];
      switch (value) {
        case 'claim':  await handleClaim(interaction);  break;
        case 'lock':   await handleLock(interaction);   break;
        case 'call':   await handleCall(interaction);   break;
        case 'accept': await handleAccept(interaction, client); break;
        case 'refuse': await handleRefuse(interaction); break;
      }
      return;
    }
  },
};

// ════════════════════════════════════════════════════════
//  OUVRIR UN TICKET WL
// ════════════════════════════════════════════════════════
async function handleOpenTicket(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const guild  = interaction.guild;
  const member = interaction.member;

  // Ticket déjà ouvert ?
  const existing = guild.channels.cache.find(
    c => c.name === `wl-${member.user.username.toLowerCase().replace(/\s+/g, '-')}` &&
         c.parentId === CHANNELS.WL_CATEGORY
  );
  if (existing) {
    return interaction.editReply({ content: `${EMOJIS.ticket} Tu as déjà un ticket ouvert : <#${existing.id}>` });
  }

  try {
    const category = await guild.channels.fetch(CHANNELS.WL_CATEGORY);

    const ticketChannel = await guild.channels.create({
      name: `wl-${member.user.username.toLowerCase().replace(/\s+/g, '-')}`,
      parent: category,
      permissionOverwrites: [
        { id: guild.id,      deny:  [PermissionFlagsBits.ViewChannel] },
        { id: member.id,     allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: ROLES.STAFF,   allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] },
      ],
    });

    // Embed principal avec GIF
    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`${EMOJIS.ticket} Demande de Whitelist — Nancy RP`)
      .setDescription(
        `Bienvenue <@${member.id}> !\n\n` +
        `${EMOJIS.arrow} Un membre du staff va prendre en charge ta demande.\n` +
        `${EMOJIS.arrow} Clique sur **"Remplir le formulaire"** pour commencer.\n` +
        `${EMOJIS.arrow} Réponds honnêtement à toutes les questions.\n\n` +
        `> 💙 Bonne chance pour ta candidature !`
      )
      .setImage('attachment://banner.gif')
      .setFooter({ text: 'Nancy RP — Whitelist' })
      .setTimestamp();

    const bannerAttachment = new AttachmentBuilder('./assets/banner.gif', { name: 'banner.gif' });

    // Bouton formulaire
    const formButton = new ButtonBuilder()
      .setCustomId('wl_open_form')
      .setLabel('📋 Remplir le formulaire WL')
      .setStyle(ButtonStyle.Primary);

    // Select menu actions staff
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket_actions')
      .setPlaceholder('⚙️ Actions du ticket (Staff)…')
      .addOptions([
        { label: 'Claim',           description: 'Prendre le ticket en charge (Staff)',    value: 'claim',  emoji: EMOJIS.claim  },
        { label: 'Lock',            description: 'Empêcher le civil d\'écrire',            value: 'lock',   emoji: EMOJIS.lock   },
        { label: 'Appeler le Staff',description: 'Alerter le staff (1 seule fois)',        value: 'call',   emoji: EMOJIS.call   },
        { label: 'Accepter',        description: 'Accepter la whitelist',                  value: 'accept', emoji: EMOJIS.accept },
        { label: 'Refuser',         description: 'Refuser et fermer le ticket',            value: 'refuse', emoji: EMOJIS.refuse },
      ]);

    const rowBtn    = new ActionRowBuilder().addComponents(formButton);
    const rowSelect = new ActionRowBuilder().addComponents(selectMenu);

    await ticketChannel.send({
      content: `<@&${ROLES.STAFF}> <@${member.id}>`,
      embeds: [embed],
      files: [bannerAttachment],
      components: [rowBtn, rowSelect],
    });

    // Écoute locale du bouton formulaire dans CE salon uniquement
    const collector = ticketChannel.createMessageComponentCollector({
      filter: i => i.customId === 'wl_open_form' && i.user.id === member.id,
      max: 1,
    });
    collector.on('collect', async i => {
      await showWLForm1(i);
    });

    await interaction.editReply({ content: `${EMOJIS.ticket} Ton ticket a été créé : <#${ticketChannel.id}>` });
  } catch (err) {
    console.error('[OpenTicket]', err);
    await interaction.editReply({ content: '❌ Impossible de créer le ticket. Contacte un administrateur.' });
  }
}

// ════════════════════════════════════════════════════════
//  FORMULAIRE WL — Modal 1 (5 champs)
// ════════════════════════════════════════════════════════
async function showWLForm1(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('wl_form_1')
    .setTitle('📋 Formulaire WL — Partie 1/2');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('nomPrenom').setLabel('Nom & Prénom de ton personnage RP')
        .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(60)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('origine').setLabel('Origine / Nationalité du personnage')
        .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(60)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('dateNaissance').setLabel('Date de naissance (JJ/MM/AAAA)')
        .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('age').setLabel('Âge du personnage')
        .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(5)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('histoire').setLabel('Histoire du personnage')
        .setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(80).setMaxLength(1000)
        .setPlaceholder('Raconte le passé de ton personnage (min. 80 caractères)…')
    ),
  );

  await interaction.showModal(modal);
}

async function handleWLForm1(interaction) {
  // Stocke les données en attendant le modal 2
  pendingWLData.set(interaction.user.id, {
    nomPrenom:     interaction.fields.getTextInputValue('nomPrenom'),
    origine:       interaction.fields.getTextInputValue('origine'),
    dateNaissance: interaction.fields.getTextInputValue('dateNaissance'),
    age:           interaction.fields.getTextInputValue('age'),
    histoire:      interaction.fields.getTextInputValue('histoire'),
  });

  // Enchaîne immédiatement avec le modal 2
  const modal = new ModalBuilder()
    .setCustomId('wl_form_2')
    .setTitle('📋 Formulaire WL — Partie 2/2');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('ambition').setLabel('Ambition RP de ton personnage')
        .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500)
        .setPlaceholder('Qu\'est-ce que ton personnage cherche à accomplir dans la ville ?')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('noFear').setLabel('Qu\'est-ce que le No Fear ?')
        .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(300)
        .setPlaceholder('Explique avec tes mots…')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('noPain').setLabel('Qu\'est-ce que le No Pain ?')
        .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(300)
        .setPlaceholder('Explique avec tes mots…')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('metagaming').setLabel('Qu\'est-ce que le Metagaming ?')
        .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(300)
        .setPlaceholder('Explique avec tes mots…')
    ),
  );

  await interaction.showModal(modal);
}

// ════════════════════════════════════════════════════════
//  FORMULAIRE WL — Modal 2 (suite + récap)
// ════════════════════════════════════════════════════════
async function handleWLForm2(interaction) {
  await interaction.deferReply({ ephemeral: false });

  const part1 = pendingWLData.get(interaction.user.id) || {};
  pendingWLData.delete(interaction.user.id);

  const fullData = {
    ...part1,
    ambition:    interaction.fields.getTextInputValue('ambition'),
    noFear:      interaction.fields.getTextInputValue('noFear'),
    noPain:      interaction.fields.getTextInputValue('noPain'),
    metagaming:  interaction.fields.getTextInputValue('metagaming'),
    discordId:   interaction.user.id,
    discordTag:  interaction.user.tag,
    discordUsername: interaction.user.username,
  };

  // Sauvegarde temporaire (sera complété à l'acceptation)
  savePlayer(interaction.user.id, { ...fullData, status: 'pending' });

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${EMOJIS.ticket} Candidature WL reçue — Nancy RP`)
    .setDescription(`Candidature de <@${interaction.user.id}>`)
    .addFields(
      { name: `${EMOJIS.id} Nom & Prénom RP`,         value: fullData.nomPrenom     || '—', inline: true },
      { name: '🌍 Origine',                            value: fullData.origine       || '—', inline: true },
      { name: '📅 Date de naissance',                  value: fullData.dateNaissance || '—', inline: true },
      { name: '🎂 Âge',                                value: fullData.age           || '—', inline: true },
      { name: '📖 Histoire',                           value: fullData.histoire      || '—' },
      { name: '🎯 Ambition RP',                        value: fullData.ambition      || '—' },
      { name: '😱 No Fear',                            value: fullData.noFear        || '—' },
      { name: '💢 No Pain',                            value: fullData.noPain        || '—' },
      { name: '🧠 Metagaming',                         value: fullData.metagaming    || '—' },
    )
    .setFooter({ text: 'Nancy RP — En attente de décision du Staff' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

// ════════════════════════════════════════════════════════
//  CLAIM
// ════════════════════════════════════════════════════════
async function handleClaim(interaction) {
  if (!interaction.member.roles.cache.has(ROLES.STAFF)) {
    return interaction.reply({ content: `${EMOJIS.staff} Réservé au Staff.`, ephemeral: true });
  }
  await interaction.deferUpdate();
  const embed = new EmbedBuilder().setColor(COLOR)
    .setDescription(`${EMOJIS.claim} Ticket pris en charge par <@${interaction.user.id}>.`).setTimestamp();
  await interaction.channel.send({ embeds: [embed] });
}

// ════════════════════════════════════════════════════════
//  LOCK / UNLOCK
// ════════════════════════════════════════════════════════
async function handleLock(interaction) {
  if (!interaction.member.roles.cache.has(ROLES.STAFF)) {
    return interaction.reply({ content: `${EMOJIS.staff} Réservé au Staff.`, ephemeral: true });
  }
  await interaction.deferUpdate();
  const channel  = interaction.channel;
  const overwrite = channel.permissionOverwrites.cache.get(ROLES.CIVIL);
  const isLocked  = overwrite?.deny.has(PermissionFlagsBits.SendMessages);

  if (isLocked) {
    await channel.permissionOverwrites.edit(ROLES.CIVIL, { SendMessages: true });
    const e = new EmbedBuilder().setColor(COLOR).setDescription(`${EMOJIS.unlock} Ticket **déverrouillé**.`).setTimestamp();
    await channel.send({ embeds: [e] });
  } else {
    await channel.permissionOverwrites.edit(ROLES.CIVIL, { SendMessages: false });
    const e = new EmbedBuilder().setColor(COLOR).setDescription(`${EMOJIS.lock} Ticket **verrouillé**.`).setTimestamp();
    await channel.send({ embeds: [e] });
  }
}

// ════════════════════════════════════════════════════════
//  APPEL STAFF (dans ticket)
// ════════════════════════════════════════════════════════
async function handleCall(interaction) {
  const key = interaction.channel.id;
  if (usedCallStaff.has(key)) {
    return interaction.reply({ content: `${EMOJIS.call} Tu as déjà utilisé l'appel staff sur ce ticket.`, ephemeral: true });
  }
  usedCallStaff.add(key);
  await interaction.deferUpdate();
  const e = new EmbedBuilder().setColor(COLOR)
    .setDescription(`${EMOJIS.call} <@&${ROLES.STAFF}> — <@${interaction.user.id}> appelle le staff !`).setTimestamp();
  await interaction.channel.send({ embeds: [e] });
}

// ════════════════════════════════════════════════════════
//  ACCEPTER
// ════════════════════════════════════════════════════════
async function handleAccept(interaction, client) {
  if (!interaction.member.roles.cache.has(ROLES.STAFF)) {
    return interaction.reply({ content: `${EMOJIS.staff} Réservé au Staff.`, ephemeral: true });
  }
  await interaction.deferUpdate();

  const channel = interaction.channel;
  const guild   = interaction.guild;

  const targetId = channel.permissionOverwrites.cache.find(
    o => o.id !== guild.id && o.id !== ROLES.STAFF && o.id !== ROLES.CIVIL
  )?.id;

  if (!targetId) return interaction.followUp({ content: '❌ Membre introuvable.', ephemeral: true });

  const member = await guild.members.fetch(targetId).catch(() => null);
  if (!member) return interaction.followUp({ content: '❌ Le membre a quitté le serveur.', ephemeral: true });

  // Ajoute rôle WL
  await member.roles.add(ROLES.WL).catch(console.error);

  // Met à jour la BDD
  savePlayer(targetId, { status: 'accepted', discordTag: member.user.tag, discordUsername: member.user.username });

  // Message dans le ticket
  const ticketEmbed = new EmbedBuilder().setColor(COLOR)
    .setTitle(`${EMOJIS.accept} Whitelist Acceptée !`)
    .setDescription(`Félicitations <@${member.id}> ! Ta whitelist est **acceptée**. Bienvenue sur Nancy RP ! ${EMOJIS.welcome}`)
    .setTimestamp();
  await channel.send({ embeds: [ticketEmbed] });

  // Message de bienvenue
  const welcomeChannel = await guild.channels.fetch(CHANNELS.WELCOME).catch(() => null);
  if (welcomeChannel) {
    const welcomeEmbed = new EmbedBuilder().setColor(COLOR)
      .setTitle(`${EMOJIS.welcome} Nouveau membre Whitelisté !`)
      .setDescription(`<@${member.id}> rejoint **Nancy RP** ! Souhaitez-lui la bienvenue 💙`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Nancy RP — Whitelist' }).setTimestamp();
    await welcomeChannel.send({ embeds: [welcomeEmbed] });
  }

  // Génère et envoie la carte d'identité si les données existent
  const playerData = getPlayer(targetId);
  if (playerData && playerData.nomPrenom) {
    try {
      const robloxAvatar = playerData.robloxId ? await getRobloxAvatar(playerData.robloxId) : null;
      if (robloxAvatar) playerData.robloxAvatarUrl = robloxAvatar;

      const cardBuffer  = await generateCarteIdentite(playerData);
      const attachment  = new AttachmentBuilder(cardBuffer, { name: `carte-${member.user.username}.png` });

      const cardEmbed = new EmbedBuilder().setColor(COLOR)
        .setTitle(`${EMOJIS.id} Carte d'Identité — ${playerData.nomPrenom}`)
        .setDescription(`Carte d'identité de <@${member.id}>`)
        .setImage(`attachment://carte-${member.user.username}.png`)
        .setFooter({ text: 'Nancy RP — Registre Civil' }).setTimestamp();

      await channel.send({ embeds: [cardEmbed], files: [attachment] });
    } catch (err) {
      console.error('[CarteID]', err);
    }
  }

  setTimeout(() => channel.delete().catch(console.error), 8000);
}

// ════════════════════════════════════════════════════════
//  REFUSER
// ════════════════════════════════════════════════════════
async function handleRefuse(interaction) {
  if (!interaction.member.roles.cache.has(ROLES.STAFF)) {
    return interaction.reply({ content: `${EMOJIS.staff} Réservé au Staff.`, ephemeral: true });
  }
  await interaction.deferUpdate();

  const channel = interaction.channel;
  const guild   = interaction.guild;

  const targetId = channel.permissionOverwrites.cache.find(
    o => o.id !== guild.id && o.id !== ROLES.STAFF && o.id !== ROLES.CIVIL
  )?.id;

  if (targetId) {
    const member = await guild.members.fetch(targetId).catch(() => null);
    if (member) {
      const toRemove = member.roles.cache.filter(r => !r.managed && r.id !== guild.id);
      await member.roles.remove(toRemove).catch(console.error);
    }
    savePlayer(targetId, { status: 'refused' });
  }

  const e = new EmbedBuilder().setColor(0xFF4444)
    .setTitle(`${EMOJIS.refuse} Whitelist Refusée`)
    .setDescription('Ta demande a été **refusée**. Tu pourras retenter ultérieurement.')
    .setTimestamp();
  await channel.send({ embeds: [e] });
  setTimeout(() => channel.delete().catch(console.error), 5000);
}

// ════════════════════════════════════════════════════════
//  APPEL STAFF — Salon dédié (modal)
// ════════════════════════════════════════════════════════
async function handleAppelStaffModal(interaction) {
  const modal = new ModalBuilder().setCustomId('appel_staff_modal').setTitle('📣 Appel Staff — Nancy RP');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('reason').setLabel('Raison de l\'appel')
        .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500)
        .setPlaceholder('Décris ta situation…')
    )
  );
  await interaction.showModal(modal);
}

async function handleAppelStaffSubmit(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const reason  = interaction.fields.getTextInputValue('reason');
  const channel = await interaction.guild.channels.fetch(CHANNELS.APPEL_STAFF).catch(() => null);
  if (!channel) return interaction.editReply({ content: '❌ Salon d\'appel introuvable.' });

  const e = new EmbedBuilder().setColor(COLOR)
    .setTitle(`${EMOJIS.call} Appel Staff — Nancy RP`)
    .setDescription(`<@&${ROLES.STAFF}> un joueur a besoin d'aide !`)
    .addFields(
      { name: '👤 Joueur', value: `<@${interaction.user.id}>`, inline: true },
      { name: '📄 Raison', value: reason },
    )
    .setFooter({ text: 'Nancy RP — Support' }).setTimestamp();

  await channel.send({ content: `<@&${ROLES.STAFF}>`, embeds: [e] });
  await interaction.editReply({ content: `${EMOJIS.call} Appel envoyé !` });
}

// ════════════════════════════════════════════════════════
//  LIAISON COMPTE ROBLOX
// ════════════════════════════════════════════════════════
async function handleRobloxLinkModal(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const username   = interaction.fields.getTextInputValue('robloxUsername').trim();
  const robloxUser = await getRobloxUser(username);

  if (!robloxUser) {
    return interaction.editReply({ content: `${EMOJIS.roblox} Compte Roblox **"${username}"** introuvable. Vérifie l'orthographe.` });
  }

  const code = generateVerifyCode(interaction.user.id);
  pendingVerify.set(interaction.user.id, { robloxId: robloxUser.id, robloxUsername: robloxUser.name, code });

  const e = new EmbedBuilder().setColor(COLOR)
    .setTitle(`${EMOJIS.roblox} Vérification du compte Roblox`)
    .setDescription(
      `Compte trouvé : **${robloxUser.name}** (ID: \`${robloxUser.id}\`)\n\n` +
      `**Pour confirmer que ce compte t'appartient :**\n` +
      `1️⃣ Va sur ton profil Roblox → **Éditer le profil**\n` +
      `2️⃣ Colle ce code dans ta **bio / description** :\n\n` +
      `\`\`\`${code}\`\`\`\n` +
      `3️⃣ Clique sur **Vérifier** ci-dessous.\n` +
      `4️⃣ Tu pourras retirer le code une fois la vérif faite.`
    )
    .setFooter({ text: 'Nancy RP — Liaison Roblox' }).setTimestamp();

  const verifyBtn = new ButtonBuilder()
    .setCustomId('roblox_verify_btn')
    .setLabel('✅ Vérifier mon compte')
    .setStyle(ButtonStyle.Success);

  await interaction.editReply({ embeds: [e], components: [new ActionRowBuilder().addComponents(verifyBtn)] });
}

async function handleRobloxVerify(interaction) {
  await interaction.deferUpdate();

  const pending = pendingVerify.get(interaction.user.id);
  if (!pending) {
    return interaction.followUp({ content: '❌ Aucune vérification en cours. Recommence depuis le panel.', ephemeral: true });
  }

  const ok = await verifyCode(pending.robloxId, pending.code);
  if (!ok) {
    return interaction.followUp({
      content: `${EMOJIS.roblox} Code introuvable dans la bio Roblox de **${pending.robloxUsername}**.\nAssure-toi de l'avoir bien collé, puis réessaie.`,
      ephemeral: true,
    });
  }

  pendingVerify.delete(interaction.user.id);

  // Sauvegarde le lien
  savePlayer(interaction.user.id, {
    robloxId:       pending.robloxId,
    robloxUsername: pending.robloxUsername,
    discordTag:     interaction.user.tag,
    discordUsername: interaction.user.username,
  });

  // Change le pseudo Discord (si permissions)
  try {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const currentNick = member.displayName;
    await member.setNickname(`${currentNick} | @${pending.robloxUsername}`);
  } catch { /* Pas de permission ou propriétaire du serveur */ }

  const e = new EmbedBuilder().setColor(COLOR)
    .setTitle(`${EMOJIS.roblox} Compte Roblox lié avec succès !`)
    .setDescription(
      `Ton compte Discord est maintenant lié à **${pending.robloxUsername}** sur Roblox.\n` +
      `Tu peux retirer le code de ta bio Roblox.`
    )
    .setFooter({ text: 'Nancy RP — Liaison Roblox' }).setTimestamp();

  await interaction.editReply({ embeds: [e], components: [] });
}
