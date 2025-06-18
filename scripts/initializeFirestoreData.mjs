import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

const coursesToAdd = [
  // Intermédiaire
  {
    assignedTo: ["5nwpalNX8si53ZCK19OZ"],
    category: "informatique",
    chapters: [
      {
        expanded: true,
        id: "ch1",
        order: 0,
        sections: [
          {
            content: [
              {
                content: "Bienvenue à tous dans ce premier chapitre intermédiaire !",
                formatting: {
                  alignment: "left",
                  bold: false,
                  italic: false,
                  list: false,
                },
                id: "block1",
                type: "text",
              },
            ],
            id: "sec1",
            order: 0,
            title: "Présentation du module",
          },
        ],
        title: "Introduction",
      },
    ],
    createdAt: "12 juin 2025 à 11:05:00 UTC+2",
    description: "Maîtrisez les fonctionnalités intermédiaires des outils de bureautique.",
    duration: 72,
    instructor: {
      bio: "20 ans d’expérience en formation bureautique.",
      name: "Michel Toko",
      photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
      title: "Formateur en bureautique",
    },
    level: "Intermédiaire",
    status: "published",
    title: "Maîtrise intermédiaire de la bureautique",
    totalDuration: 72,
    videoUrl: "https://www.youtube.com/watch?v=intermediaireURL",
  },
  // Avancé
  {
    assignedTo: ["5nwpalNX8si53ZCK19OZ"],
    category: "informatique",
    chapters: [
      {
        expanded: true,
        id: "ch1",
        order: 0,
        sections: [
          {
            content: [
              {
                content: "Bienvenue dans le module avancé !",
                formatting: {
                  alignment: "left",
                  bold: false,
                  italic: false,
                  list: false,
                },
                id: "block1",
                type: "text",
              },
            ],
            id: "sec1",
            order: 0,
            title: "Présentation du module",
          },
        ],
        title: "Introduction",
      },
    ],
    createdAt: "12 juin 2025 à 11:10:00 UTC+2",
    description: "Devenez expert des outils de bureautique et automatisez vos tâches.",
    duration: 90,
    instructor: {
      bio: "20 ans d’expérience en formation bureautique.",
      name: "Michel Toko",
      photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
      title: "Formateur en bureautique",
    },
    level: "Avancé",
    status: "published",
    title: "Perfectionnement en bureautique",
    totalDuration: 90,
    videoUrl: "https://www.youtube.com/watch?v=avanceURL",
  }
];

async function injectCourses() {
  try {
    for (const course of coursesToAdd) {
      // Ajoute chaque cours comme nouveau document (ID auto)
      await db.collection("courses").add(course);
      console.log(`✅ Cours ajouté : ${course.title} (${course.level})`);
    }
    console.log("🚀 Tous les cours ont été ajoutés.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur lors de l'ajout des cours :", err);
    process.exit(1);
  }
}

injectCourses();
