// migrateCourses.mjs
// Script pour migrer les cours de l'ancienne structure vers la nouvelle structure modulaire
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

// Formatage du temps
const formatDuration = ms => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${remainingSeconds}s`;
};

// Statistiques de migration
const stats = {
    courses: {
        processed: 0,
        succeeded: 0,
        failed: 0
    },
    chapters: {
        processed: 0,
        succeeded: 0,
        failed: 0
    },
    sections: {
        processed: 0,
        succeeded: 0,
        failed: 0
    },
    contentBlocks: {
        processed: 0,
        succeeded: 0,
        failed: 0
    },
    instructors: {
        processed: 0,
        succeeded: 0,
        failed: 0
    }
};

/**
 * Vérifie si une collection est vide (pour éviter de migrer deux fois)
 */
async function isCollectionEmpty(collectionName) {
    const snapshot = await db.collection(collectionName).limit(1).get();
    return snapshot.empty;
}

/**
 * Convertit une date à partir de différents formats possibles en objet Firestore timestamp
 */
function convertToTimestamp(dateValue) {
    if (!dateValue) return admin.firestore.FieldValue.serverTimestamp();

    if (dateValue instanceof admin.firestore.Timestamp) return dateValue;

    if (dateValue instanceof Date) return admin.firestore.Timestamp.fromDate(dateValue);

    if (typeof dateValue === 'string') {
        // Essayer de parser une date à partir d'une chaîne
        const parsed = new Date(dateValue);
        if (!isNaN(parsed.getTime())) {
            return admin.firestore.Timestamp.fromDate(parsed);
        }
    }

    // Si rien d'autre ne fonctionne
    return admin.firestore.FieldValue.serverTimestamp();
}

/**
 * Migre un instructeur depuis l'ancien format vers le nouveau
 */
async function migrateInstructor(instructor, courseId) {
    try {
        stats.instructors.processed++;

        if (!instructor || !instructor.name) {
            return null; // Pas d'instructeur à migrer
        }

        // Vérifier si un instructeur avec ce nom existe déjà
        const instructorsRef = db.collection('instructors');
        const existingInstructorQuery = await instructorsRef
            .where('name', '==', instructor.name)
            .get();

        if (!existingInstructorQuery.empty) {
            const existingInstructor = existingInstructorQuery.docs[0];

            // Mettre à jour l'instructeur existant avec les nouvelles données si nécessaire
            const existingData = existingInstructor.data();
            const updateData = {};

            if (!existingData.title && instructor.title) updateData.title = instructor.title;
            if (!existingData.bio && instructor.bio) updateData.bio = instructor.bio;
            if (!existingData.photoUrl && instructor.photoUrl) updateData.photoUrl = instructor.photoUrl;

            // Ajouter ce cours à la liste des cours de l'instructeur s'il n'y est pas déjà
            if (courseId && (!existingData.courses || !existingData.courses.includes(courseId))) {
                updateData.courses = existingData.courses
                    ? [...existingData.courses, courseId]
                    : [courseId];
            }

            if (Object.keys(updateData).length > 0) {
                await existingInstructor.ref.update({
                    ...updateData,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            stats.instructors.succeeded++;
            return existingInstructor.id;
        }

        // Créer un nouvel instructeur
        const instructorData = {
            name: instructor.name,
            title: instructor.title || '',
            bio: instructor.bio || '',
            photoUrl: instructor.photoUrl || '',
            courses: courseId ? [courseId] : [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const instructorRef = instructorsRef.doc();
        await instructorRef.set(instructorData);

        stats.instructors.succeeded++;
        return instructorRef.id;
    } catch (error) {
        console.error(`Erreur lors de la migration de l'instructeur: ${error.message}`);
        stats.instructors.failed++;
        return null;
    }
}

/**
 * Migre un bloc de contenu de l'ancien format vers le nouveau
 */
async function migrateContentBlock(block, sectionId, chapterId, courseId, order) {
    try {
        stats.contentBlocks.processed++;

        // Convertir le type de bloc
        let blockType = block.type;
        if (block.type === 'media' && block.media) {
            blockType = block.media.type; // 'image' ou 'video'
        }

        // Créer le bloc de contenu dans la nouvelle structure
        const contentBlockRef = db.collection('content_blocks').doc(block.id || `blk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

        const contentBlockData = {
            id: contentBlockRef.id,
            sectionId,
            chapterId,
            courseId,
            type: blockType,
            content: block.content || '',
            order: order,
            formatting: block.formatting || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Si c'est un bloc média, ajouter les informations media
        if (block.media) {
            contentBlockData.media = {
                type: block.media.type,
                url: block.media.url,
                caption: block.media.caption || '',
                alignment: block.media.alignment || 'center'
            };
        }

        await contentBlockRef.set(contentBlockData);

        stats.contentBlocks.succeeded++;
        return contentBlockRef.id;
    } catch (error) {
        console.error(`Erreur lors de la migration du bloc de contenu: ${error.message}`);
        stats.contentBlocks.failed++;
        return null;
    }
}

/**
 * Migre une section de l'ancien format vers le nouveau
 */
async function migrateSection(section, chapterId, courseId, order) {
    try {
        stats.sections.processed++;

        // Créer la section dans la nouvelle structure
        const sectionRef = db.collection('sections').doc(section.id || `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

        const contentBlocksOrder = [];
        const contentPromises = [];

        // Migrer chaque bloc de contenu
        if (section.content && Array.isArray(section.content)) {
            section.content.forEach((block, blockOrder) => {
                contentPromises.push(
                    migrateContentBlock(block, sectionRef.id, chapterId, courseId, blockOrder)
                        .then(blockId => {
                            if (blockId) contentBlocksOrder.push(blockId);
                        })
                );
            });
        }

        // Attendre que tous les blocs soient migrés
        await Promise.all(contentPromises);

        // Enregistrer la section
        await sectionRef.set({
            id: sectionRef.id,
            chapterId,
            courseId,
            title: section.title || 'Section sans titre',
            order: order,
            contentBlocksOrder,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        stats.sections.succeeded++;
        return {
            id: sectionRef.id,
            contentBlocksCount: contentBlocksOrder.length
        };
    } catch (error) {
        console.error(`Erreur lors de la migration de la section: ${error.message}`);
        stats.sections.failed++;
        return null;
    }
}

/**
 * Migre un chapitre de l'ancien format vers le nouveau
 */
async function migrateChapter(chapter, courseId, order) {
    try {
        stats.chapters.processed++;

        // Créer le chapitre dans la nouvelle structure
        const chapterRef = db.collection('chapters').doc(chapter.id || `ch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

        const sectionsOrder = [];
        const sectionPromises = [];

        // Migrer chaque section
        if (chapter.sections && Array.isArray(chapter.sections)) {
            chapter.sections.forEach((section, sectionOrder) => {
                sectionPromises.push(
                    migrateSection(section, chapterRef.id, courseId, sectionOrder)
                        .then(sectionResult => {
                            if (sectionResult) sectionsOrder.push(sectionResult.id);
                        })
                );
            });
        }

        // Attendre que toutes les sections soient migrées
        await Promise.all(sectionPromises);

        // Enregistrer le chapitre
        await chapterRef.set({
            id: chapterRef.id,
            courseId,
            title: chapter.title || 'Chapitre sans titre',
            description: chapter.description || '',
            order: order,
            sectionsOrder,
            learningObjectives: chapter.learningObjectives || [],
            estimatedTime: chapter.estimatedTime || 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        stats.chapters.succeeded++;
        return chapterRef.id;
    } catch (error) {
        console.error(`Erreur lors de la migration du chapitre: ${error.message}`);
        stats.chapters.failed++;
        return null;
    }
}

/**
 * Migre un cours complet de l'ancienne structure vers la nouvelle
 */
async function migrateCourse(course) {
    try {
        stats.courses.processed++;
        const courseRef = db.collection('courses').doc(course.id || null);

        // Migrer l'instructeur en premier
        let instructorId = null;
        if (course.instructor) {
            instructorId = await migrateInstructor(course.instructor, courseRef.id);
        }

        // Migrer les chapitres
        const chaptersOrder = [];
        const chapterPromises = [];

        if (course.chapters && Array.isArray(course.chapters)) {
            course.chapters.forEach((chapter, chapterOrder) => {
                chapterPromises.push(
                    migrateChapter(chapter, courseRef.id, chapterOrder)
                        .then(chapterId => {
                            if (chapterId) chaptersOrder.push(chapterId);
                        })
                );
            });
        }

        // Attendre que tous les chapitres soient migrés
        await Promise.all(chapterPromises);

        // Créer le cours dans la nouvelle structure
        const courseData = {
            id: courseRef.id,
            title: course.title,
            description: course.description || '',
            categoryId: course.category || course.categoryId || '',
            level: course.level || 'Débutant',
            duration: course.duration || 0,
            videoUrl: course.videoUrl || '',
            videoThumbnailUrl: course.videoThumbnailUrl || '',
            assignedTo: course.assignedTo || [],
            status: course.status || 'draft',
            tags: course.tags || [],
            createdAt: convertToTimestamp(course.createdAt),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            instructorId,
            chaptersOrder,
            currentVersion: 1
        };

        await courseRef.set(courseData);

        console.log(chalk.green(`✅ Cours migré avec succès: ${course.title} (${courseRef.id})`));
        console.log(`   - ${chaptersOrder.length} chapitres`);
        console.log(`   - ${instructorId ? 'Instructeur associé' : 'Aucun instructeur'}`);

        stats.courses.succeeded++;
        return courseRef.id;
    } catch (error) {
        console.error(chalk.red(`Erreur lors de la migration du cours ${course.title || 'sans titre'}: ${error.message}`));
        stats.courses.failed++;
        return null;
    }
}

/**
 * Fonction principale de migration
 */
async function migrateCourses() {
    console.log(chalk.blue('Démarrage de la migration des cours...'));
    const startTime = Date.now();

    try {
        // Vérifier si les collections de destination existent déjà et contiennent des données
        const collectionsToCheck = ['chapters', 'sections', 'content_blocks', 'instructors'];
        const collectionChecks = await Promise.all(
            collectionsToCheck.map(async collection => {
                return {
                    name: collection,
                    isEmpty: await isCollectionEmpty(collection)
                };
            })
        );

        const nonEmptyCollections = collectionChecks.filter(c => !c.isEmpty);

        if (nonEmptyCollections.length > 0) {
            console.log(chalk.yellow('⚠️ Attention: Les collections suivantes contiennent déjà des données:'));
            nonEmptyCollections.forEach(c => {
                console.log(chalk.yellow(`   - ${c.name}`));
            });

            if (process.env.FORCE_MIGRATION !== 'true') {
                console.log(chalk.yellow(`Migration annulée pour éviter les doublons. Utilisez FORCE_MIGRATION=true pour forcer la migration.`));
                return;
            } else {
                console.log(chalk.yellow(`La migration forcée est activée. Les nouvelles données seront ajoutées aux collections existantes.`));
            }
        }

        // Récupérer tous les cours actuels
        console.log('Récupération des cours...');
        const coursesSnapshot = await db.collection('courses').get();

        if (coursesSnapshot.empty) {
            console.log(chalk.yellow('Aucun cours trouvé dans la base de données.'));
            return;
        }

        console.log(chalk.blue(`${coursesSnapshot.size} cours trouvés. Début de la migration...`));

        // Traiter chaque cours
        for (const doc of coursesSnapshot.docs) {
            const courseData = { id: doc.id, ...doc.data() };
            await migrateCourse(courseData);
        }

        const duration = Date.now() - startTime;
        console.log(chalk.green(`\n✅ Migration terminée en ${formatDuration(duration)}`));
        console.log(chalk.blue('\nStatistiques de migration:'));
        console.log(`  Cours: ${stats.courses.succeeded}/${stats.courses.processed} ${stats.courses.failed > 0 ? chalk.red(`(${stats.courses.failed} échecs)`) : ''}`);
        console.log(`  Chapitres: ${stats.chapters.succeeded}/${stats.chapters.processed} ${stats.chapters.failed > 0 ? chalk.red(`(${stats.chapters.failed} échecs)`) : ''}`);
        console.log(`  Sections: ${stats.sections.succeeded}/${stats.sections.processed} ${stats.sections.failed > 0 ? chalk.red(`(${stats.sections.failed} échecs)`) : ''}`);
        console.log(`  Blocs de contenu: ${stats.contentBlocks.succeeded}/${stats.contentBlocks.processed} ${stats.contentBlocks.failed > 0 ? chalk.red(`(${stats.contentBlocks.failed} échecs)`) : ''}`);
        console.log(`  Instructeurs: ${stats.instructors.succeeded}/${stats.instructors.processed} ${stats.instructors.failed > 0 ? chalk.red(`(${stats.instructors.failed} échecs)`) : ''}`);

    } catch (error) {
        console.error(chalk.red(`Erreur lors de la migration: ${error.message}`));
        console.error(error);
    }
}

// Exécution de la migration
migrateCourses().then(() => {
    console.log(chalk.blue('Script de migration terminé'));
    process.exit(0);
}).catch(error => {
    console.error(chalk.red(`Erreur fatale: ${error.message}`));
    console.error(error);
    process.exit(1);
});
