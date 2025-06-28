// identifyObsoleteScripts.mjs
// Script pour identifier et marquer les scripts obsolètes après migration vers la nouvelle structure
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";

// Configuration des chemins pour les modules ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Liste des scripts analysés
const scripts = [
    {
        path: path.resolve(__dirname, "initializeFirestoreCourses.mjs"),
        usage: "Initialise les cours avec l'ancienne structure imbriquée",
        isObsolete: true,
        reason: "Utilise l'ancienne structure de données imbriquée qui n'est plus compatible avec la nouvelle architecture modulaire"
    },
    {
        path: path.resolve(__dirname, "initializeFirestoreData.mjs"),
        usage: "Initialise les données avec l'ancienne structure imbriquée",
        isObsolete: true,
        reason: "Utilise l'ancienne structure de données imbriquée qui n'est plus compatible avec la nouvelle architecture modulaire"
    },
    {
        path: path.resolve(__dirname, "initializeFirestoreCategories.mjs"),
        usage: "Initialise les catégories pour les cours",
        isObsolete: false,
        reason: "Toujours valide car les catégories continuent d'exister dans la nouvelle structure"
    },
    {
        path: path.resolve(__dirname, "setCustomClaims.mjs"),
        usage: "Définit les claims personnalisés pour les utilisateurs administrateurs",
        isObsolete: false,
        reason: "Non lié à la structure des cours, toujours nécessaire pour la gestion des autorisations"
    },
    {
        path: path.resolve(__dirname, "migrateCourses.mjs"),
        usage: "Migre les cours de l'ancienne structure vers la nouvelle structure modulaire",
        isObsolete: false,
        reason: "Script de migration principal, essentiel pour la transition vers la nouvelle architecture"
    },
    {
        path: path.resolve(__dirname, "validateMigration.mjs"),
        usage: "Valide l'intégrité des données après migration",
        isObsolete: false,
        reason: "Script de validation nécessaire pour garantir la qualité des données migrées"
    },
    {
        path: path.resolve(__dirname, "../src/scripts/createProgressTracking.js"),
        usage: "Crée des enregistrements de suivi de progression pour les inscriptions",
        isObsolete: true,
        reason: "Fait référence à la structure imbriquée des chapitres dans les cours, incompatible avec la nouvelle architecture"
    },
    {
        path: path.resolve(__dirname, "../src/scripts/createCertificates.js"),
        usage: "Crée des certificats pour les inscriptions terminées",
        isObsolete: false,
        reason: "Ne dépend pas directement de la structure des cours, peut continuer à fonctionner avec des ajustements mineurs"
    },
    {
        path: path.resolve(__dirname, "../src/scripts/createCompanyFiles.js"),
        usage: "Crée des fichiers d'entreprise",
        isObsolete: false,
        reason: "Non lié à la structure des cours, toujours nécessaire pour la gestion des fichiers d'entreprise"
    },
    {
        path: path.resolve(__dirname, "../src/scripts/initializeFirebaseData.js"),
        usage: "Initialise diverses données Firebase avec l'ancienne structure",
        isObsolete: true,
        reason: "Contient des données d'initialisation qui utilisent l'ancienne structure imbriquée, devrait être mise à jour"
    }
];

// Fonction principale
async function identifyObsoleteScripts() {
    console.log(chalk.blue('==================================================='));
    console.log(chalk.blue('  Identification des scripts obsolètes'));
    console.log(chalk.blue('===================================================\n'));

    // Compter les scripts obsolètes
    const obsoleteScripts = scripts.filter(script => script.isObsolete);
    const validScripts = scripts.filter(script => !script.isObsolete);

    // Afficher les scripts obsolètes
    console.log(chalk.red(`Scripts obsolètes (${obsoleteScripts.length}):`));
    obsoleteScripts.forEach((script, index) => {
        console.log(chalk.red(`\n${index + 1}. ${path.basename(script.path)}`));
        console.log(chalk.yellow(`   Usage: ${script.usage}`));
        console.log(chalk.yellow(`   Raison: ${script.reason}`));

        // Vérifier si le fichier existe
        if (fs.existsSync(script.path)) {
            const obsoletePath = script.path + '.obsolete';
            console.log(chalk.gray(`   Action recommandée: Renommer ${path.basename(script.path)} en ${path.basename(script.path)}.obsolete`));
        } else {
            console.log(chalk.gray(`   Note: Le fichier n'existe pas sur le disque`));
        }
    });

    // Afficher les scripts valides
    console.log(chalk.green(`\nScripts toujours valides (${validScripts.length}):`));
    validScripts.forEach((script, index) => {
        console.log(chalk.green(`\n${index + 1}. ${path.basename(script.path)}`));
        console.log(chalk.white(`   Usage: ${script.usage}`));
        console.log(chalk.white(`   Raison de validité: ${script.reason}`));
    });

    // Demander confirmation pour marquer les scripts obsolètes
    console.log(chalk.blue('\n==================================================='));
    console.log(chalk.yellow('  Actions recommandées:'));
    console.log(chalk.blue('==================================================='));
    console.log(chalk.yellow('\nPour marquer les scripts obsolètes, exécutez la commande suivante:'));
    console.log(chalk.white('\nnode scripts/markObsoleteScripts.mjs'));

    console.log(chalk.blue('\n==================================================='));
    console.log(chalk.blue('  Résumé'));
    console.log(chalk.blue('==================================================='));
    console.log(chalk.white(`\nTotal de scripts analysés: ${scripts.length}`));
    console.log(chalk.red(`Scripts obsolètes: ${obsoleteScripts.length}`));
    console.log(chalk.green(`Scripts valides: ${validScripts.length}`));
}

// Exécuter le script
identifyObsoleteScripts().catch(error => {
    console.error(chalk.red('Erreur lors de l\'exécution du script:'), error);
});
