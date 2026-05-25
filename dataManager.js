const fs = require('fs');
const path = './data/dossiers.json';

// S'assure que le dossier et le fichier existent au démarrage
if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}
if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({}));
}

module.exports = {
    // Vérifie si un utilisateur possède déjà un matricule (pour bloquer les inscriptions multiples)
    isAlreadyRegistered: (discordId) => {
        const db = JSON.parse(fs.readFileSync(path, 'utf8'));
        return Object.values(db).some(dossier => dossier.discordId === discordId);
    },

    // Crée le dossier lors de la première identification
    saveDossier: (nigend, data) => {
        const db = JSON.parse(fs.readFileSync(path, 'utf8'));
        db[nigend] = data;
        fs.writeFileSync(path, JSON.stringify(db, null, 2));
    },

    // Ajoute une note à un matricule existant
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

    // Récupère toute la base de données (utilisé par la commande /consulter)
    getDossiers: () => {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
    }
};