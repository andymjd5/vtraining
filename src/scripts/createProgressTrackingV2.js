// createProgressTrackingV2.js
// Script mis à jour pour créer des enregistrements de suivi de progression 
// Compatible avec la nouvelle structure de données modulaire
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDppSP-PUxX31lTM_DGezxthpq_oId8Ya0",
    authDomain: "vtproject-ee916.firebaseapp.com",
    projectId: "vtproject-ee916",
    storageBucket: "vtproject-ee916.firebasestorage.app",
    messagingSenderId: "165874074792",
    appId: "1:165874074792:web:6784e9563fc9623c69ee9d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create progress tracking records for enrollments with new data structure
const createProgressTracking = async () => {
    try {
        console.log('Création des enregistrements de suivi de progression...');

        // Get all enrollments
        const enrollmentsQuery = query(collection(db, 'enrollments'));
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const enrollments = enrollmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`${enrollments.length} inscriptions trouvées`);

        // Get all courses
        const coursesQuery = query(collection(db, 'courses'));
        const coursesSnapshot = await getDocs(coursesQuery);
        const courses = coursesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`${courses.length} cours trouvés`);

        // Create progress tracking for each enrollment
        let progressCreated = 0;

        for (const enrollment of enrollments) {
            // Trouver le cours correspondant à l'inscription
            const course = courses.find(c => c.id === enrollment.courseId);

            if (!course) {
                console.log(`Cours non trouvé pour l'inscription ${enrollment.id}`);
                continue;
            }

            // Dans la nouvelle structure, nous devons obtenir les chapitres séparément
            const chaptersQuery = query(
                collection(db, 'chapters'),
                where('courseId', '==', course.id)
            );
            const chaptersSnapshot = await getDocs(chaptersQuery);
            const chapters = chaptersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log(`${chapters.length} chapitres trouvés pour le cours ${course.id}`);

            // Créer le suivi de progression pour chaque chapitre
            for (const chapter of chapters) {
                // Déterminer si le chapitre est terminé en fonction du statut d'inscription
                const isCompleted = enrollment.status === 'COMPLETED' ||
                    (enrollment.status === 'IN_PROGRESS' && Math.random() > 0.5);

                // Créer l'enregistrement de suivi de progression
                const progressRef = doc(collection(db, 'progress_tracking'));
                await setDoc(progressRef, {
                    enrollmentId: enrollment.id,
                    userId: enrollment.userId,
                    courseId: course.id,
                    chapterId: chapter.id,
                    status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
                    progress: isCompleted ? 100 : Math.floor(Math.random() * 80) + 10,
                    startedAt: serverTimestamp(),
                    lastAccessedAt: serverTimestamp(),
                    completedAt: isCompleted ? serverTimestamp() : null
                });

                progressCreated++;

                // Maintenant, créons également un suivi pour les sections de ce chapitre
                const sectionsQuery = query(
                    collection(db, 'sections'),
                    where('chapterId', '==', chapter.id),
                    where('courseId', '==', course.id)
                );
                const sectionsSnapshot = await getDocs(sectionsQuery);
                const sections = sectionsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                for (const section of sections) {
                    // La probabilité qu'une section soit complétée dépend du statut du chapitre
                    const isSectionCompleted = isCompleted || (Math.random() > 0.3);

                    // Créer l'enregistrement de suivi de section
                    const sectionProgressRef = doc(collection(db, 'section_progress'));
                    await setDoc(sectionProgressRef, {
                        enrollmentId: enrollment.id,
                        userId: enrollment.userId,
                        courseId: course.id,
                        chapterId: chapter.id,
                        sectionId: section.id,
                        status: isSectionCompleted ? 'COMPLETED' : 'IN_PROGRESS',
                        progress: isSectionCompleted ? 100 : Math.floor(Math.random() * 90),
                        startedAt: serverTimestamp(),
                        lastAccessedAt: serverTimestamp(),
                        completedAt: isSectionCompleted ? serverTimestamp() : null
                    });
                }
            }
        }

        console.log(`${progressCreated} enregistrements de suivi de progression créés`);
        console.log('Opération terminée avec succès');

    } catch (error) {
        console.error('Erreur lors de la création des enregistrements de suivi:', error);
    }
};

// Run the script
createProgressTracking().then(() => {
    console.log('Script terminé');
}).catch(error => {
    console.error('Erreur dans l\'exécution du script:', error);
});
