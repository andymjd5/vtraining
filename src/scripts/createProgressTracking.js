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

// Create progress tracking records for enrollments
const createProgressTracking = async () => {
  try {
    // Get all enrollments
    const enrollmentsQuery = query(collection(db, 'enrollments'));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const enrollments = enrollmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get all courses
    const coursesQuery = query(collection(db, 'courses'));
    const coursesSnapshot = await getDocs(coursesQuery);
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Create progress tracking for each enrollment
    for (const enrollment of enrollments) {
      const course = courses.find(c => c.id === enrollment.courseId);
      
      if (!course || !course.chapters) continue;
      
      // Create progress tracking for each chapter
      for (const chapter of course.chapters) {
        // Determine if chapter is completed based on enrollment progress
        const isCompleted = enrollment.status === 'COMPLETED' || 
          (enrollment.status === 'IN_PROGRESS' && Math.random() > 0.5);
        
        // Create progress tracking record
        const progressRef = doc(collection(db, 'progress_tracking'));
        await setDoc(progressRef, {
          enrollmentId: enrollment.id,
          userId: enrollment.userId,
          courseId: enrollment.courseId,
          companyId: enrollment.companyId,
          chapterId: chapter.id,
          completed: isCompleted,
          timeSpent: isCompleted ? Math.floor(Math.random() * 3600) : 0, // Random time in seconds if completed
          lastAccessed: serverTimestamp()
        });
      }
    }

    console.log('✅ Progress tracking created successfully');
  } catch (error) {
    console.error('❌ Error creating progress tracking:', error);
  }
};

// Create activity logs
const createActivityLogs = async () => {
  try {
    // Get all users
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get all courses
    const coursesQuery = query(collection(db, 'courses'));
    const coursesSnapshot = await getDocs(coursesQuery);
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Create sample activity logs
    const activities = [
      { action: 'a commencé', entityType: 'cours' },
      { action: 'a terminé', entityType: 'cours' },
      { action: 'a consulté', entityType: 'cours' },
      { action: 'a téléchargé', entityType: 'certificat' },
      { action: 'a mis à jour', entityType: 'profil' }
    ];

    for (let i = 0; i < 20; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const course = courses[Math.floor(Math.random() * courses.length)];
      const activity = activities[Math.floor(Math.random() * activities.length)];
      
      const logRef = doc(collection(db, 'activity_logs'));
      await setDoc(logRef, {
        userId: user.id,
        companyId: user.companyId,
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityType === 'cours' ? course.id : '',
        entityName: activity.entityType === 'cours' ? course.title : '',
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) // Random date in the last week
      });
    }

    console.log('✅ Activity logs created successfully');
  } catch (error) {
    console.error('❌ Error creating activity logs:', error);
  }
};

// Run the initialization
const initializeProgressAndLogs = async () => {
  await createProgressTracking();
  await createActivityLogs();
  console.log('🚀 All progress tracking and activity logs initialized successfully');
};

initializeProgressAndLogs();