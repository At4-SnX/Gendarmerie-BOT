const fs = require('fs');
const path = './data/dossiers.json';

module.exports = {
    updateDossier: (nigend, info) => {
        // On lit le fichier
        if (!fs.existsSync(path)) return false;
        const db = JSON.parse(fs.readFileSync(path, 'utf8'));

        // On vérifie si le NIGEND existe
        if (db[nigend]) {
            // On ajoute l'info dans le tableau "notes"
            db[nigend].notes.push(info);
            // On ré-écrit le fichier mis à jour
            fs.writeFileSync(path, JSON.stringify(db, null, 2));
            return true;
        }
        return false;
    }
};