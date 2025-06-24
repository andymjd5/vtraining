import { db } from './firebase'; // adapte l'import selon ton projet
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Exemple de données du cours
const courseData = {
  title: "Découverte de la bureautique",
  description: "Apprenez à maîtriser les outils de bureautique essentiels.",
  categoryId: "informatique", // Remplacer par l'ID de la catégorie
  level: "débutant",
  duration: 6,
  assignedTo: ["5nwpaINX8si53ZCK190Z"],
  status: "published",
  createdAt: serverTimestamp(),
  videoUrl: "https://exemple.com/intro.mp4",
  instructor: {
    name: "Michel Toko",
    title: "Formateur en bureautique",
    bio: "20 ans d’expérience en formation bureautique.",
    photoUrl: "https://randomuser.me/api/portraits/men/12.jpg"
  },
  chapters: [
    {
      id: "ch1",
      title: "Introduction",
      order: 0,
      expanded: true,
      sections: [
        {
          id: "sec1",
          title: "Présentation du module",
          order: 0,
          content: [
            {
              id: "block1",
              type: "text",
              content: "Bienvenue à tous dans ce premier chapitre !",
              formatting: {
                bold: false,
                italic: false,
                list: false,
                alignment: "left"
              }
            }
          ]
        }
      ]
    }
  ]
};

async function addCourse() {
  try {
    const docRef = await addDoc(collection(db, "courses"), courseData);
    console.log("Cours ajouté avec l'ID :", docRef.id);
  } catch (e) {
    console.error("Erreur lors de l'ajout :", e);
  }
}

addCourse();
