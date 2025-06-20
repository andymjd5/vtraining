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

// Create certificates for completed enrollments
const createCertificates = async () => {
  try {
    // Get completed enrollments
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('status', '==', 'COMPLETED')
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const completedEnrollments = enrollmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get courses
    const coursesQuery = query(collection(db, 'courses'));
    const coursesSnapshot = await getDocs(coursesQuery);
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get users
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Create certificates for each completed enrollment
    for (const enrollment of completedEnrollments) {
      const course = courses.find(c => c.id === enrollment.courseId);
      const user = users.find(u => u.id === enrollment.userId);
      
      if (!course || !user) continue;
      
      // Create certificate
      const certificateRef = doc(collection(db, 'certificates'));
      await setDoc(certificateRef, {
        userId: enrollment.userId,
        userName: user.name,
        courseId: enrollment.courseId,
        courseName: course.title,
        companyId: enrollment.companyId,
        issueDate: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Random date in the last month
        certificateNumber: `CERT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        createdAt: serverTimestamp()
      });
    }

    console.log('✅ Certificates created successfully');
  } catch (error) {
    console.error('❌ Error creating certificates:', error);
  }
};

// Run the initialization
createCertificates();