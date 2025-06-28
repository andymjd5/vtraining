// markObsoleteScripts.mjs
// Script pour marquer les scripts obsolètes après migration vers la nouvelle structure
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import readline from "readline";

// Configuration des chemins pour les modules ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Liste des scripts obsolètes à marquer
const obsoleteScripts = [
    {
        path: path.resolve(__dirname, "initializeFirestoreCourses.mjs"),
        usage: "Initialise les cours avec l'ancienne structure imbriquée"
    },
    {
        path: path.resolve(__dirname, "initializeFirestoreData.mjs"),
        usage: "Initialise les données avec l'ancienne structure imbriquée"
    },
    {
        path: path.resolve(__dirname, "../src/scripts/createProgressTracking.js"),
        usage: "Crée des enregistrements de suivi de progression pour les inscriptions"
    },
    {
        path: path.resolve(__dirname, "../src/scripts/initializeFirebaseData.js"),
        usage: "Initialise diverses données Firebase avec l'ancienne structure"
    }
];

// Créer une interface de ligne de commande
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Fonction pour poser une question et attendre la réponse
function question(query) {
    return new Promise(resolve => {
        rl.question(query, resolve);
    });
}

// Fonction principale
async function markObsoleteScripts() {
    console.log(chalk.blue('==================================================='));
    console.log(chalk.blue('  Marquage des scripts obsolètes'));
    console.log(chalk.blue('===================================================\n'));

    console.log(chalk.yellow('Les scripts suivants ont été identifiés comme obsolètes:'));
    obsoleteScripts.forEach((script, index) => {
        console.log(chalk.red(`${index + 1}. ${path.basename(script.path)} - ${script.usage}`));
    });

    // Demander confirmation
    const answer = await question(chalk.yellow('\nVoulez-vous marquer ces scripts comme obsolètes? (y/n): '));

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log(chalk.yellow('Opération annulée par l\'utilisateur.'));
        rl.close();
        return;
    }

    console.log(chalk.blue('\nMarquage des scripts...\n'));

    // Marquer chaque script
    const results = [];
    for (const script of obsoleteScripts) {
        if (fs.existsSync(script.path)) {
            try {
                // Lire le contenu du script
                const content = fs.readFileSync(script.path, 'utf8');

                // Ajouter un commentaire OBSOLETE en haut du fichier
                const obsoleteComment = `// *** OBSOLETE ***\n// Ce script utilise l'ancienne structure de données et n'est plus compatible avec la nouvelle architecture modulaire.\n// Conservé uniquement pour référence historique. Veuillez utiliser les nouveaux scripts de migration.\n// Date de marquage: ${new Date().toISOString()}\n\n`;
                const modifiedContent = obsoleteComment + content;

                // Enregistrer le contenu modifié
                const obsoletePath = script.path + '.obsolete';
                fs.writeFileSync(obsoletePath, modifiedContent);

                console.log(chalk.green(`✓ ${path.basename(script.path)} -> ${path.basename(obsoletePath)}`));
                results.push({ script: path.basename(script.path), status: 'success' });
            } catch (error) {
                console.error(chalk.red(`✗ Erreur lors du marquage de ${path.basename(script.path)}:`), error.message);
                results.push({ script: path.basename(script.path), status: 'failed', error: error.message });
            }
        } else {
            console.log(chalk.yellow(`⚠ ${path.basename(script.path)} n'existe pas sur le disque`));
            results.push({ script: path.basename(script.path), status: 'not_found' });
        }
    }

    // Créer un fichier de rapport
    const report = {
        date: new Date().toISOString(),
        totalScripts: obsoleteScripts.length,
        results
    };

    const reportPath = path.resolve(__dirname, 'obsolete_scripts_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(chalk.blue('\n==================================================='));
    console.log(chalk.blue('  Résumé'));
    console.log(chalk.blue('==================================================='));

    const successful = results.filter(r => r.status === 'success').length;
    const notFound = results.filter(r => r.status === 'not_found').length;
    const failed = results.filter(r => r.status === 'failed').length;

    console.log(chalk.white(`\nTotal de scripts traités: ${obsoleteScripts.length}`));
    console.log(chalk.green(`Scripts marqués avec succès: ${successful}`));
    console.log(chalk.yellow(`Scripts non trouvés: ${notFound}`));
    console.log(chalk.red(`Échecs: ${failed}`));

    console.log(chalk.blue(`\nRapport enregistré dans ${reportPath}`));

    rl.close();
}

// Exécuter le script
markObsoleteScripts().catch(error => {
    console.error(chalk.red('Erreur lors de l\'exécution du script:'), error);
    rl.close();
});
