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
        db[nigend] = { ...data, grade: 'Élève Gendarme', certifs: [] };
        saveDb(db);
    },

    updateDossier: (nigend, info) => {
        const db = readDb();
        if (!db[nigend]) return false;
        if (!db[nigend].notes) db[nigend].notes = [];
        db[nigend].notes.push(info);
        saveDb(db);
        return true;
    },

    // Nouvelles fonctions
    updateGrade: (nigend, grade) => {
        const db = readDb();
        if (!db[nigend]) return false;
        db[nigend].grade = grade;
        saveDb(db);
        return true;
    },

    addCertif: (nigend, certif) => {
        const db = readDb();
        if (!db[nigend]) return false;
        if (!db[nigend].certifs) db[nigend].certifs = [];
        db[nigend].certifs.push(certif);
        saveDb(db);
        return true;
    },

    findByName: (nom) => {
        const db = readDb();
        return Object.entries(db).find(([nigend, data]) => 
            data.nom.toLowerCase().includes(nom.toLowerCase())
        );
    },

    getDossiers: () => readDb()
};