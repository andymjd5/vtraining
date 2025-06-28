// validateMigration.mjs
// Script pour valider l'intégrité des données après migration des cours
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";

// Configuration des chemins pour les modules ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger le fichier de clés de service
const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// Initialisation de Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Statistiques de validation
const stats = {
    courses: {
        total: 0,
        valid: 0,
        invalid: 0,
        issues: []
    },
    chapters: {
        total: 0,
        valid: 0,
        invalid: 0,
        issues: []
    },
    sections: {
        total: 0,
        valid: 0,
        invalid: 0,
        issues: []
    },
    contentBlocks: {
        total: 0,
        valid: 0,
        invalid: 0,
        issues: []
    },
    instructors: {
        total: 0,
        valid: 0,
        invalid: 0,
        issues: []
    }
};

/**
 * Vérifie l'intégrité d'un cours et de ses relations
 */
async function validateCourse(course) {
    stats.courses.total++;
    const courseId = course.id;
    const issues = [];

    // Vérifier les propriétés obligatoires du cours
    const requiredProps = ['title', 'description', 'categoryId', 'level', 'duration', 'assignedTo', 'status', 'chaptersOrder'];
    const missingProps = requiredProps.filter(prop => !course[prop]);

    if (missingProps.length > 0) {
        issues.push(`Propriétés manquantes: ${missingProps.join(', ')}`);
    }

    // Vérifier la référence à l'instructeur si elle existe
    if (course.instructorId) {
        const instructorRef = db.collection('instructors').doc(course.instructorId);
        const instructorDoc = await instructorRef.get();
        if (!instructorDoc.exists) {
            issues.push(`Instructeur référencé inexistant: ${course.instructorId}`);
        }
    }

    // Vérifier l'existence des chapitres et leur ordre
    const chaptersOrder = course.chaptersOrder || [];
    for (const chapterId of chaptersOrder) {
        const chapterRef = db.collection('chapters').doc(chapterId);
        const chapterDoc = await chapterRef.get();
        if (!chapterDoc.exists) {
            issues.push(`Chapitre référencé inexistant: ${chapterId}`);
        }
    }

    // Vérifier que tous les chapitres liés au cours sont dans chaptersOrder
    const chaptersQuery = await db.collection('chapters').where('courseId', '==', courseId).get();
    const chaptersFromDB = chaptersQuery.docs.map(doc => doc.id);
    const missingChapters = chaptersFromDB.filter(id => !chaptersOrder.includes(id));
    if (missingChapters.length > 0) {
        issues.push(`Chapitres non inclus dans chaptersOrder: ${missingChapters.join(', ')}`);
    }

    if (issues.length > 0) {
        stats.courses.invalid++;
        stats.courses.issues.push({ courseId, issues });
        return false;
    } else {
        stats.courses.valid++;
        return true;
    }
}

/**
 * Vérifie l'intégrité d'un chapitre et de ses relations
 */
async function validateChapter(chapter) {
    stats.chapters.total++;
    const chapterId = chapter.id;
    const courseId = chapter.courseId;
    const issues = [];

    // Vérifier les propriétés obligatoires du chapitre
    const requiredProps = ['title', 'order', 'courseId', 'sectionsOrder'];
    const missingProps = requiredProps.filter(prop => !chapter[prop]);

    if (missingProps.length > 0) {
        issues.push(`Propriétés manquantes: ${missingProps.join(', ')}`);
    }

    // Vérifier la référence au cours
    const courseRef = db.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) {
        issues.push(`Cours référencé inexistant: ${courseId}`);
    } else {
        const course = courseDoc.data();
        if (!course.chaptersOrder.includes(chapterId)) {
            issues.push(`Chapitre non inclus dans l'ordre du cours: ${chapterId}`);
        }
    }

    // Vérifier l'existence des sections et leur ordre
    const sectionsOrder = chapter.sectionsOrder || [];
    for (const sectionId of sectionsOrder) {
        const sectionRef = db.collection('sections').doc(sectionId);
        const sectionDoc = await sectionRef.get();
        if (!sectionDoc.exists) {
            issues.push(`Section référencée inexistante: ${sectionId}`);
        }
    }

    // Vérifier que toutes les sections liées au chapitre sont dans sectionsOrder
    const sectionsQuery = await db.collection('sections')
        .where('chapterId', '==', chapterId)
        .where('courseId', '==', courseId)
        .get();
    const sectionsFromDB = sectionsQuery.docs.map(doc => doc.id);
    const missingSections = sectionsFromDB.filter(id => !sectionsOrder.includes(id));
    if (missingSections.length > 0) {
        issues.push(`Sections non incluses dans sectionsOrder: ${missingSections.join(', ')}`);
    }

    if (issues.length > 0) {
        stats.chapters.invalid++;
        stats.chapters.issues.push({ chapterId, issues });
        return false;
    } else {
        stats.chapters.valid++;
        return true;
    }
}

/**
 * Vérifie l'intégrité d'une section et de ses relations
 */
async function validateSection(section) {
    stats.sections.total++;
    const sectionId = section.id;
    const chapterId = section.chapterId;
    const courseId = section.courseId;
    const issues = [];

    // Vérifier les propriétés obligatoires de la section
    const requiredProps = ['title', 'order', 'chapterId', 'courseId', 'contentBlocksOrder'];
    const missingProps = requiredProps.filter(prop => !section[prop]);

    if (missingProps.length > 0) {
        issues.push(`Propriétés manquantes: ${missingProps.join(', ')}`);
    }

    // Vérifier la référence au chapitre
    const chapterRef = db.collection('chapters').doc(chapterId);
    const chapterDoc = await chapterRef.get();
    if (!chapterDoc.exists) {
        issues.push(`Chapitre référencé inexistant: ${chapterId}`);
    } else {
        const chapter = chapterDoc.data();
        if (!chapter.sectionsOrder.includes(sectionId)) {
            issues.push(`Section non incluse dans l'ordre du chapitre: ${sectionId}`);
        }
    }

    // Vérifier la référence au cours
    const courseRef = db.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) {
        issues.push(`Cours référencé inexistant: ${courseId}`);
    }

    // Vérifier l'existence des blocs de contenu et leur ordre
    const contentBlocksOrder = section.contentBlocksOrder || [];
    for (const blockId of contentBlocksOrder) {
        const blockRef = db.collection('content_blocks').doc(blockId);
        const blockDoc = await blockRef.get();
        if (!blockDoc.exists) {
            issues.push(`Bloc de contenu référencé inexistant: ${blockId}`);
        }
    }

    // Vérifier que tous les blocs de contenu liés à la section sont dans contentBlocksOrder
    const blocksQuery = await db.collection('content_blocks')
        .where('sectionId', '==', sectionId)
        .where('chapterId', '==', chapterId)
        .where('courseId', '==', courseId)
        .get();
    const blocksFromDB = blocksQuery.docs.map(doc => doc.id);
    const missingBlocks = blocksFromDB.filter(id => !contentBlocksOrder.includes(id));
    if (missingBlocks.length > 0) {
        issues.push(`Blocs de contenu non inclus dans contentBlocksOrder: ${missingBlocks.join(', ')}`);
    }

    if (issues.length > 0) {
        stats.sections.invalid++;
        stats.sections.issues.push({ sectionId, issues });
        return false;
    } else {
        stats.sections.valid++;
        return true;
    }
}

/**
 * Vérifie l'intégrité d'un bloc de contenu et de ses relations
 */
async function validateContentBlock(block) {
    stats.contentBlocks.total++;
    const blockId = block.id;
    const sectionId = block.sectionId;
    const chapterId = block.chapterId;
    const courseId = block.courseId;
    const issues = [];

    // Vérifier les propriétés obligatoires du bloc de contenu
    const requiredProps = ['type', 'content', 'order', 'sectionId', 'chapterId', 'courseId'];
    const missingProps = requiredProps.filter(prop => !block[prop]);

    if (missingProps.length > 0) {
        issues.push(`Propriétés manquantes: ${missingProps.join(', ')}`);
    }

    // Vérifier le type de contenu
    const validTypes = ['text', 'image', 'video', 'file', 'code', 'embed'];
    if (!validTypes.includes(block.type)) {
        issues.push(`Type de contenu invalide: ${block.type}`);
    }

    // Vérifier la référence à la section
    const sectionRef = db.collection('sections').doc(sectionId);
    const sectionDoc = await sectionRef.get();
    if (!sectionDoc.exists) {
        issues.push(`Section référencée inexistante: ${sectionId}`);
    } else {
        const section = sectionDoc.data();
        if (!section.contentBlocksOrder.includes(blockId)) {
            issues.push(`Bloc de contenu non inclus dans l'ordre de la section: ${blockId}`);
        }
    }

    // Vérifier la référence au chapitre
    const chapterRef = db.collection('chapters').doc(chapterId);
    const chapterDoc = await chapterRef.get();
    if (!chapterDoc.exists) {
        issues.push(`Chapitre référencé inexistant: ${chapterId}`);
    }

    // Vérifier la référence au cours
    const courseRef = db.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) {
        issues.push(`Cours référencé inexistant: ${courseId}`);
    }

    if (issues.length > 0) {
        stats.contentBlocks.invalid++;
        stats.contentBlocks.issues.push({ blockId, issues });
        return false;
    } else {
        stats.contentBlocks.valid++;
        return true;
    }
}

/**
 * Vérifie l'intégrité d'un instructeur et de ses relations
 */
async function validateInstructor(instructor) {
    stats.instructors.total++;
    const instructorId = instructor.id;
    const issues = [];

    // Vérifier les propriétés obligatoires de l'instructeur
    const requiredProps = ['name', 'title', 'bio'];
    const missingProps = requiredProps.filter(prop => !instructor[prop]);

    if (missingProps.length > 0) {
        issues.push(`Propriétés manquantes: ${missingProps.join(', ')}`);
    }

    // Vérifier les références aux cours si elles existent
    if (instructor.courses && Array.isArray(instructor.courses)) {
        for (const courseId of instructor.courses) {
            const courseRef = db.collection('courses').doc(courseId);
            const courseDoc = await courseRef.get();
            if (!courseDoc.exists) {
                issues.push(`Cours référencé inexistant: ${courseId}`);
            } else {
                const course = courseDoc.data();
                if (course.instructorId !== instructorId) {
                    issues.push(`Cours ${courseId} ne référence pas cet instructeur`);
                }
            }
        }
    }

    if (issues.length > 0) {
        stats.instructors.invalid++;
        stats.instructors.issues.push({ instructorId, issues });
        return false;
    } else {
        stats.instructors.valid++;
        return true;
    }
}

/**
 * Fonction principale de validation
 */
async function validateMigration() {
    console.log(chalk.blue('======================================'));
    console.log(chalk.blue('  Validation de la migration des cours'));
    console.log(chalk.blue('======================================'));

    const startTime = Date.now();

    try {
        // Valider tous les cours
        console.log(chalk.yellow('\n1. Validation des cours...'));
        const coursesRef = db.collection('courses');
        const coursesSnapshot = await coursesRef.get();

        if (coursesSnapshot.empty) {
            console.log(chalk.red('Aucun cours trouvé dans la collection courses!'));
            return;
        }

        for (const doc of coursesSnapshot.docs) {
            const course = { id: doc.id, ...doc.data() };
            await validateCourse(course);
            process.stdout.write('.');
        }

        console.log(chalk.green(`\nValidation des cours terminée: ${stats.courses.valid} valides, ${stats.courses.invalid} invalides`));

        // Valider tous les chapitres
        console.log(chalk.yellow('\n2. Validation des chapitres...'));
        const chaptersRef = db.collection('chapters');
        const chaptersSnapshot = await chaptersRef.get();

        for (const doc of chaptersSnapshot.docs) {
            const chapter = { id: doc.id, ...doc.data() };
            await validateChapter(chapter);
            process.stdout.write('.');
        }

        console.log(chalk.green(`\nValidation des chapitres terminée: ${stats.chapters.valid} valides, ${stats.chapters.invalid} invalides`));

        // Valider toutes les sections
        console.log(chalk.yellow('\n3. Validation des sections...'));
        const sectionsRef = db.collection('sections');
        const sectionsSnapshot = await sectionsRef.get();

        for (const doc of sectionsSnapshot.docs) {
            const section = { id: doc.id, ...doc.data() };
            await validateSection(section);
            process.stdout.write('.');
        }

        console.log(chalk.green(`\nValidation des sections terminée: ${stats.sections.valid} valides, ${stats.sections.invalid} invalides`));

        // Valider tous les blocs de contenu
        console.log(chalk.yellow('\n4. Validation des blocs de contenu...'));
        const blocksRef = db.collection('content_blocks');
        const blocksSnapshot = await blocksRef.get();

        for (const doc of blocksSnapshot.docs) {
            const block = { id: doc.id, ...doc.data() };
            await validateContentBlock(block);
            process.stdout.write('.');
        }

        console.log(chalk.green(`\nValidation des blocs de contenu terminée: ${stats.contentBlocks.valid} valides, ${stats.contentBlocks.invalid} invalides`));

        // Valider tous les instructeurs
        console.log(chalk.yellow('\n5. Validation des instructeurs...'));
        const instructorsRef = db.collection('instructors');
        const instructorsSnapshot = await instructorsRef.get();

        for (const doc of instructorsSnapshot.docs) {
            const instructor = { id: doc.id, ...doc.data() };
            await validateInstructor(instructor);
            process.stdout.write('.');
        }

        console.log(chalk.green(`\nValidation des instructeurs terminée: ${stats.instructors.valid} valides, ${stats.instructors.invalid} invalides`));

        // Résumé
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        const minutes = Math.floor(executionTime / 60000);
        const seconds = ((executionTime % 60000) / 1000).toFixed(2);

        console.log(chalk.blue('\n======================================'));
        console.log(chalk.blue('  Résumé de la validation'));
        console.log(chalk.blue('======================================'));

        console.log(chalk.white(`\nTemps d'exécution: ${minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}`));

        // Afficher le résumé de la validation
        console.log(chalk.white('\nRésultats par entité:'));
        console.log(chalk.white(`Cours: ${stats.courses.total} traités, ${stats.courses.valid} valides, ${stats.courses.invalid} invalides`));
        console.log(chalk.white(`Chapitres: ${stats.chapters.total} traités, ${stats.chapters.valid} valides, ${stats.chapters.invalid} invalides`));
        console.log(chalk.white(`Sections: ${stats.sections.total} traités, ${stats.sections.valid} valides, ${stats.sections.invalid} invalides`));
        console.log(chalk.white(`Blocs de contenu: ${stats.contentBlocks.total} traités, ${stats.contentBlocks.valid} valides, ${stats.contentBlocks.invalid} invalides`));
        console.log(chalk.white(`Instructeurs: ${stats.instructors.total} traités, ${stats.instructors.valid} valides, ${stats.instructors.invalid} invalides`));

        // Afficher les problèmes rencontrés
        if (stats.courses.invalid > 0) {
            console.log(chalk.red('\nProblèmes dans les cours:'));
            stats.courses.issues.forEach(issue => {
                console.log(chalk.red(`- Cours ${issue.courseId}:`));
                issue.issues.forEach(problem => console.log(chalk.red(`  * ${problem}`)));
            });
        }

        if (stats.chapters.invalid > 0) {
            console.log(chalk.red('\nProblèmes dans les chapitres:'));
            stats.chapters.issues.forEach(issue => {
                console.log(chalk.red(`- Chapitre ${issue.chapterId}:`));
                issue.issues.forEach(problem => console.log(chalk.red(`  * ${problem}`)));
            });
        }

        if (stats.sections.invalid > 0) {
            console.log(chalk.red('\nProblèmes dans les sections:'));
            stats.sections.issues.forEach(issue => {
                console.log(chalk.red(`- Section ${issue.sectionId}:`));
                issue.issues.forEach(problem => console.log(chalk.red(`  * ${problem}`)));
            });
        }

        if (stats.contentBlocks.invalid > 0) {
            console.log(chalk.red('\nProblèmes dans les blocs de contenu:'));
            stats.contentBlocks.issues.forEach(issue => {
                console.log(chalk.red(`- Bloc ${issue.blockId}:`));
                issue.issues.forEach(problem => console.log(chalk.red(`  * ${problem}`)));
            });
        }

        if (stats.instructors.invalid > 0) {
            console.log(chalk.red('\nProblèmes dans les instructeurs:'));
            stats.instructors.issues.forEach(issue => {
                console.log(chalk.red(`- Instructeur ${issue.instructorId}:`));
                issue.issues.forEach(problem => console.log(chalk.red(`  * ${problem}`)));
            });
        }

        // Conclusion
        const totalEntities = stats.courses.total + stats.chapters.total + stats.sections.total +
            stats.contentBlocks.total + stats.instructors.total;
        const validEntities = stats.courses.valid + stats.chapters.valid + stats.sections.valid +
            stats.contentBlocks.valid + stats.instructors.valid;

        const validationPercentage = (validEntities / totalEntities * 100).toFixed(2);

        if (validEntities === totalEntities) {
            console.log(chalk.green('\n✓✓✓ Toutes les entités ont passé la validation avec succès! ✓✓✓'));
        } else {
            console.log(chalk.yellow(`\n⚠ ${validationPercentage}% des entités ont passé la validation. Des corrections sont nécessaires. ⚠`));
        }

    } catch (error) {
        console.error(chalk.red('Erreur lors de la validation:'), error);
    }
}

// Exécuter la validation
validateMigration().then(() => {
    console.log(chalk.blue('\nProcessus de validation terminé.'));
    process.exit(0);
}).catch(error => {
    console.error(chalk.red('Erreur lors de l\'exécution du script de validation:'), error);
    process.exit(1);
});
