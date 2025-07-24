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

async function migrate() {
  console.log('--- Migration progress_tracking & userProgress -> user_course_progress ---');

  // 1. Charger tous les userProgress
  const userProgressSnap = await getDocs(collection(db, 'userProgress'));
  const userProgressMap = new Map();
  userProgressSnap.forEach(doc => {
    const data = doc.data();
    // On suppose que l'id du doc est userId_courseId ou contient userId et courseId dans les champs
    const userId = data.userId || doc.id.split('_')[0];
    const courseId = data.courseId;
    if (!userId || !courseId) return;
    userProgressMap.set(`${userId}_${courseId}`, { ...data, userId, courseId });
  });

  // 2. Charger tous les progress_tracking
  const progressTrackingSnap = await getDocs(collection(db, 'progress_tracking'));
  // Grouper par userId_courseId
  const progressTrackingMap = new Map();
  progressTrackingSnap.forEach(doc => {
    const data = doc.data();
    const userId = data.userId;
    const courseId = data.courseId;
    if (!userId || !courseId) return;
    const key = `${userId}_${courseId}`;
    if (!progressTrackingMap.has(key)) progressTrackingMap.set(key, []);
    progressTrackingMap.get(key).push(data);
  });

  // 3. Fusionner et migrer
  let migrated = 0;
  for (const [key, up] of userProgressMap.entries()) {
    // Fusionner avec progress_tracking si dispo
    const ptArr = progressTrackingMap.get(key) || [];
    // completedChapters
    const completedChapters = up.completedChapters || ptArr.map(pt => pt.chapterId).filter((v, i, arr) => v && arr.indexOf(v) === i);
    // completedBlocks
    const completedBlocks = up.completedContentBlocks || [];
    // completedSections (si dispo dans progress_tracking)
    const completedSections = ptArr.map(pt => pt.sectionId).filter(Boolean);
    // completedQuizzes (à initialiser vide)
    const completedQuizzes = [];
    // contentBlocksTimeSpent (à initialiser vide ou à fusionner si dispo)
    const contentBlocksTimeSpent = up.contentBlocksTimeSpent || {};
    // timeSpent (somme des timeSpent de progress_tracking ou 0)
    const timeSpent = ptArr.reduce((sum, pt) => sum + (pt.timeSpent || 0), 0) || up.timeSpent || 0;
    // lastAccessedAt
    const lastAccessedAt = up.lastAccessedAt || null;
    // status
    const status = up.status || 'IN_PROGRESS';
    // Champs navigation
    const lastChapterId = up.currentChapter || null;
    const lastSectionId = up.currentSection || null;
    const lastContentBlockId = up.lastContentBlockId || null;

    // Préparer le doc cible
    const docData = {
      id: key,
      userId: up.userId,
      courseId: up.courseId,
      completedChapters,
      completedSections,
      completedBlocks,
      completedQuizzes,
      contentBlocksTimeSpent,
      timeSpent,
      lastAccessedAt,
      status,
      lastChapterId,
      lastSectionId,
      lastContentBlockId,
    };
    // Écrire dans user_course_progress
    await setDoc(doc(collection(db, 'user_course_progress'), key), docData, { merge: true });
    migrated++;
    console.log(`Migré: ${key}`);
  }
  console.log(`--- Migration terminée. ${migrated} documents migrés dans user_course_progress ---`);
}

migrate().catch(e => { console.error(e); process.exit(1); }); 