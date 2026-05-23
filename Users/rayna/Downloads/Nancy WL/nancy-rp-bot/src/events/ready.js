module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    client.user.setActivity('Nancy RP — WL', { type: 3 }); // WATCHING
  },
};
