const fs = require('fs');
const path = './data/dossiers.json';

// Initialisation : s'assure que le fichier existe
if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));

module.exports = {
    // Vérifie si un membre a déjà un dossier avec son ID Discord
    isAlreadyRegistered: (discordId) => {
        const db = JSON.parse(fs.readFileSync(path, 'utf8'));
        return Object.values(db).some(dossier => dossier.discordId === discordId);
    },

    // Sauvegarde un nouveau dossier (pour l'identification)
    saveDossier: (nigend, data) => {
        const db = JSON.parse(fs.readFileSync(path, 'utf8'));
        db[nigend] = data;
        fs.writeFileSync(path, JSON.stringify(db, null, 2));
    },

    // Ajoute une info dans un dossier existant
    updateDossier: (nigend, info) => {
        const db = JSON.parse(fs.readFileSync(path, 'utf8'));
        if (db[nigend]) {
            if (!db[nigend].notes) db[nigend].notes = [];
            db[nigend].notes.push(info);
            fs.writeFileSync(path, JSON.stringify(db, null, 2));
            return true;
        }
        return false;
    },

    // Récupère tous les dossiers (utile pour d'autres commandes)
    getDossiers: () => {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
    }
};