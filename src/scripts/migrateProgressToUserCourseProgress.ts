import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialisation Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: 'vtproject-ee916',
      clientEmail: 'firebase-adminsdk-77777@vtproject-ee916.iam.gserviceaccount.com',
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''
    })
  });
}
const db = getFirestore();

async function migrate() {
  console.log('--- Migration progress_tracking & userProgress -> user_course_progress ---');

  // 1. Charger tous les userProgress
  const userProgressSnap = await db.collection('userProgress').get();
  const userProgressMap = new Map<string, any>();
  userProgressSnap.forEach(doc => {
    const data = doc.data();
    // On suppose que l'id du doc est userId_courseId ou contient userId et courseId dans les champs
    const userId = data.userId || doc.id.split('_')[0];
    const courseId = data.courseId;
    if (!userId || !courseId) return;
    userProgressMap.set(`${userId}_${courseId}`, { ...data, userId, courseId });
  });

  // 2. Charger tous les progress_tracking
  const progressTrackingSnap = await db.collection('progress_tracking').get();
  // Grouper par userId_courseId
  const progressTrackingMap = new Map<string, any[]>();
  progressTrackingSnap.forEach(doc => {
    const data = doc.data();
    const userId = data.userId;
    const courseId = data.courseId;
    if (!userId || !courseId) return;
    const key = `${userId}_${courseId}`;
    if (!progressTrackingMap.has(key)) progressTrackingMap.set(key, []);
    progressTrackingMap.get(key)!.push(data);
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
    const completedQuizzes: string[] = [];
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
    await db.collection('user_course_progress').doc(key).set(docData, { merge: true });
    migrated++;
    console.log(`Migré: ${key}`);
  }
  console.log(`--- Migration terminée. ${migrated} documents migrés dans user_course_progress ---`);
}

migrate().catch(e => { console.error(e); process.exit(1); }); 