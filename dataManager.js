const fs = require('fs');
const path = './data/dossiers.json';

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));

const readDb = () => JSON.parse(fs.readFileSync(path, 'utf8'));
const saveDb = (db) => fs.writeFileSync(path, JSON.stringify(db, null, 2));

module.exports = {
    isAlreadyRegistered: (discordId) => Object.values(readDb()).some(d => d.discordId === discordId),
    
    saveDossier: (nigend, data) => {
        const db = readDb();
        // On sauvegarde le dossier en utilisant le nom comme clé principale ou en gardant le NIGEND
        db[nigend] = { ...data, grade: 'Élève Gendarme', certifs: [], notes: [] };
        saveDb(db);
    },

    // Recherche un dossier par nom (retourne {nigend, ...data})
    findByName: (nom) => {
        const db = readDb();
        const entry = Object.entries(db).find(([_, d]) => d.nom.toLowerCase().includes(nom.toLowerCase()));
        return entry ? { nigend: entry[0], ...entry[1] } : null;
    },

    // Fonction générique pour mettre à jour par nom
    updateByName: (nom, actionFn) => {
        const db = readDb();
        const entry = Object.entries(db).find(([_, d]) => d.nom.toLowerCase().includes(nom.toLowerCase()));
        if (!entry) return false;
        
        const nigend = entry[0];
        actionFn(db[nigend]);
        saveDb(db);
        return true;
    },

    // Récupère la liste complète pour les menus déroulants
    getAllDossiers: () => {
        const db = readDb();
        return Object.entries(db).map(([nigend, data]) => ({ nigend, ...data }));
    }
};