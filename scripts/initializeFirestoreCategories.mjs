// Script d'initialisation des catégories et normalisation des cours
// À lancer avec Node.js (firebase-admin doit être installé)

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration des chemins pour les modules ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger le fichier de clés de service
const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore();

// Exemple de catégories à créer
const categories = [
    { id: 'dev', name: 'Développement', description: 'Cours de développement' },
    { id: 'design', name: 'Design', description: 'Cours de design' },
    { id: 'marketing', name: 'Marketing', description: 'Cours de marketing' },
];

async function createCategories() {
    for (const cat of categories) {
        await db.collection('categories').doc(cat.id).set({
            name: cat.name,
            description: cat.description,
        });
        console.log(`Catégorie créée : ${cat.name}`);
    }
}

async function normalizeCourses() {
    const coursesSnap = await db.collection('courses').get();
    for (const doc of coursesSnap.docs) {
        const course = doc.data();
        // Ici, on suppose que tu as un champ "category" ou "categoryName" à remplacer
        // Adapte cette logique selon ta structure actuelle
        let categoryId = null;
        if (course.categoryName) {
            const found = categories.find(c => c.name === course.categoryName);
            if (found) categoryId = found.id;
        }
        // Si déjà normalisé, on saute
        if (course.categoryId) continue;
        if (categoryId) {
            await doc.ref.update({ categoryId });
            console.log(`Cours ${doc.id} mis à jour avec categoryId: ${categoryId}`);
        } else {
            console.log(`Cours ${doc.id} sans correspondance de catégorie.`);
        }
    }
}

async function main() {
    await createCategories();
    await normalizeCourses();
    console.log('Normalisation terminée.');
}

main().catch(console.error);
