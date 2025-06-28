/**
 * migration-summary.js
 * Script pour générer un résumé de la phase 4 du projet VTraining
 */

// Imports
const fs = require('fs');
const path = require('path');

// Liste des scripts existants
const scriptsList = [
    {
        path: './scripts/initializeFirestoreCourses.mjs',
        usage: "Initialise les cours avec l'ancienne structure imbriquée",
        isObsolete: true,
        reason: "Utilise l'ancienne structure de données imbriquée"
    },
    {
        path: './scripts/initializeFirestoreData.mjs',
        usage: "Initialise les données avec l'ancienne structure imbriquée",
        isObsolete: true,
        reason: "Utilise l'ancienne structure de données imbriquée"
    },
    {
        path: './scripts/initializeFirestoreCategories.mjs',
        usage: "Initialise les catégories pour les cours",
        isObsolete: false,
        reason: "Toujours valide car les catégories continuent d'exister dans la nouvelle structure"
    },
    {
        path: './scripts/setCustomClaims.mjs',
        usage: "Définit les claims personnalisés pour les utilisateurs administrateurs",
        isObsolete: false,
        reason: "Non lié à la structure des cours"
    },
    {
        path: './scripts/migrateCourses.mjs',
        usage: "Migre les cours de l'ancienne structure vers la nouvelle structure modulaire",
        isObsolete: false,
        reason: "Script de migration principal"
    },
    {
        path: './scripts/validateMigration.mjs',
        usage: "Valide l'intégrité des données après migration",
        isObsolete: false,
        reason: "Nécessaire pour vérifier les données migrées"
    },
    {
        path: './src/scripts/createProgressTracking.js',
        usage: "Crée des enregistrements de suivi de progression pour les inscriptions",
        isObsolete: true,
        reason: "Fait référence à la structure imbriquée des chapitres"
    },
    {
        path: './src/scripts/createProgressTrackingV2.js',
        usage: "Version mise à jour pour créer des enregistrements de suivi de progression",
        isObsolete: false,
        reason: "Nouvelle version compatible avec la structure modulaire"
    },
    {
        path: './src/scripts/createCertificates.js',
        usage: "Crée des certificats pour les inscriptions terminées",
        isObsolete: false,
        reason: "Ne dépend pas directement de la structure des cours"
    },
    {
        path: './src/scripts/createCompanyFiles.js',
        usage: "Crée des fichiers d'entreprise",
        isObsolete: false,
        reason: "Non lié à la structure des cours"
    },
    {
        path: './src/scripts/initializeFirebaseData.js',
        usage: "Initialise diverses données Firebase avec l'ancienne structure",
        isObsolete: true,
        reason: "Contient des données d'initialisation qui utilisent l'ancienne structure imbriquée"
    }
];

// Fonction pour vérifier si un fichier existe
function fileExists(filePath) {
    try {
        const resolvedPath = path.resolve(__dirname, filePath);
        return fs.existsSync(resolvedPath);
    } catch (error) {
        return false;
    }
}

// Générer le résumé
function generateMigrationSummary() {
    console.log("==============================================");
    console.log("  Résumé de la Phase 4 - Migration des Cours");
    console.log("==============================================\n");

    // 1. Afficher les statistiques
    const totalScripts = scriptsList.length;
    const obsoleteScripts = scriptsList.filter(s => s.isObsolete);
    const validScripts = scriptsList.filter(s => !s.isObsolete);

    console.log(`Total de scripts analysés: ${totalScripts}`);
    console.log(`Scripts obsolètes: ${obsoleteScripts.length}`);
    console.log(`Scripts valides: ${validScripts.length}\n`);

    // 2. Scripts obsolètes
    console.log("Scripts obsolètes:");
    obsoleteScripts.forEach((script, index) => {
        const exists = fileExists(script.path);
        console.log(`${index + 1}. ${path.basename(script.path)} ${exists ? '' : '(NON TROUVÉ)'}`);
        console.log(`   Usage: ${script.usage}`);
        console.log(`   Raison: ${script.reason}`);
        console.log('');
    });

    // 3. Scripts valides
    console.log("Scripts valides:");
    validScripts.forEach((script, index) => {
        const exists = fileExists(script.path);
        console.log(`${index + 1}. ${path.basename(script.path)} ${exists ? '' : '(NON TROUVÉ)'}`);
        console.log(`   Usage: ${script.usage}`);
        console.log(`   Raison de validité: ${script.reason}`);
        console.log('');
    });

    // 4. Workflow de migration
    console.log("Workflow de migration recommandé:");
    console.log("1. Exécuter le script de migration: node scripts/migrateCourses.mjs");
    console.log("2. Valider les données migrées: node scripts/validateMigration.mjs");
    console.log("3. Marquer les scripts obsolètes: node scripts/markObsoleteScripts.mjs\n");

    // 5. Résumé des modifications de structure
    console.log("Modifications de la structure des données:");
    console.log("Ancienne structure:");
    console.log("  - Collection 'courses' avec chapitres imbriqués");
    console.log("    |- chapter[] (tableau imbriqué)");
    console.log("       |- section[] (tableau imbriqué)");
    console.log("          |- content[] (tableau imbriqué)");
    console.log('');
    console.log("Nouvelle structure modulaire:");
    console.log("  - Collection 'courses': métadonnées du cours");
    console.log("  - Collection 'chapters': chapitres référençant un courseId");
    console.log("  - Collection 'sections': sections référençant un chapterId et courseId");
    console.log("  - Collection 'content_blocks': blocs de contenu référençant sectionId, chapterId et courseId");
    console.log("  - Collection 'instructors': profils d'instructeurs liés aux cours\n");

    console.log("==============================================");
    console.log("  Fin du résumé");
    console.log("==============================================\n");
}

// Exécuter la fonction principale
generateMigrationSummary();
