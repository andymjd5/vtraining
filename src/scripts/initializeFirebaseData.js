import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDppSP-PUxX31lTM_DGezxthpq_oId8Ya0",
  authDomain: "vtproject-ee916.firebaseapp.com",
  projectId: "vtproject-ee916",
  storageBucket: "vtproject-ee916.firebasestorage.app",
  messagingSenderId: "165874074792",
  appId: "1:165874074792:web:6784e9563fc9623c69ee9d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sample data
const companies = [
  {
    id: 'besdu',
    name: 'BESDU',
    email: 'contact@besdu.org',
    phone: '+243123456789',
    logoUrl: '/partners/besdu.png',
    status: 'active'
  },
  {
    id: 'fonarev',
    name: 'FONAREV',
    email: 'contact@fonarev.org',
    phone: '+243987654321',
    logoUrl: '/partners/fonarev.png',
    status: 'active'
  },
  {
    id: 'pnjt',
    name: 'PNJT',
    email: 'contact@pnjt.org',
    phone: '+243123789456',
    logoUrl: '/partners/pnjt.png',
    status: 'active'
  },
  {
    id: 'unikin',
    name: 'UNIKIN',
    email: 'contact@unikin.ac.cd',
    phone: '+243456123789',
    logoUrl: '/partners/unikin.png',
    status: 'active'
  },
  {
    id: 'vision26',
    name: 'VISION 26',
    email: 'contact@vision26.org',
    phone: '+243789456123',
    logoUrl: '/partners/vision26.png',
    status: 'active'
  },
  {
    id: '5nwpalNX8si53ZCK190Z',
    name: 'Redmagiccreative',
    email: 'contact@redmagiccreative.com',
    phone: '+243899774900',
    logoUrl: '/partners/redmagiccreative.png',
    status: 'active'
  }
];

const users = [
  {
    email: 'superadmin@visiontraining.com',
    password: 'password123',
    name: 'Super Admin',
    role: 'SUPER_ADMIN'
  },
  {
    email: 'admin@besdu.org',
    password: 'password123',
    name: 'Admin BESDU',
    role: 'COMPANY_ADMIN',
    companyId: 'besdu'
  },
  {
    email: 'admin@fonarev.org',
    password: 'password123',
    name: 'Admin FONAREV',
    role: 'COMPANY_ADMIN',
    companyId: 'fonarev'
  },
  {
    email: 'admin@pnjt.org',
    password: 'password123',
    name: 'Admin PNJT',
    role: 'COMPANY_ADMIN',
    companyId: 'pnjt'
  },
  {
    email: 'admin@unikin.ac.cd',
    password: 'password123',
    name: 'Admin UNIKIN',
    role: 'COMPANY_ADMIN',
    companyId: 'unikin'
  },
  {
    email: 'admin@vision26.org',
    password: 'password123',
    name: 'Admin VISION 26',
    role: 'COMPANY_ADMIN',
    companyId: 'vision26'
  },
  {
    email: 'admin@redmagiccreative.com',
    password: 'password123',
    name: 'Admin Redmagiccreative',
    role: 'COMPANY_ADMIN',
    companyId: '5nwpalNX8si53ZCK190Z'
  },
  {
    email: 'student1@besdu.org',
    password: 'password123',
    name: 'Étudiant BESDU',
    role: 'STUDENT',
    companyId: 'besdu'
  },
  {
    email: 'student1@fonarev.org',
    password: 'password123',
    name: 'Étudiant FONAREV',
    role: 'STUDENT',
    companyId: 'fonarev'
  },
  {
    email: 'student1@vision26.org',
    password: 'password123',
    name: 'Étudiant VISION 26',
    role: 'STUDENT',
    companyId: 'vision26'
  }
];

const courses = [
  {
    title: "Introduction à la bureautique",
    description: "Apprenez les bases des outils de bureautique essentiels.",
    category: "informatique",
    subcategory: "Bureautique",
    level: "Débutant",
    duration: 10,
    assignedTo: ["besdu", "fonarev", "vision26"],
    status: "published",
    instructor: {
      name: "Michel Toko",
      title: "Formateur en bureautique",
      bio: "20 ans d'expérience en formation bureautique.",
      photoUrl: "https://randomuser.me/api/portraits/men/32.jpg"
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
  },
  {
    title: "Maîtrise intermédiaire de la bureautique",
    description: "Maîtrisez les fonctionnalités intermédiaires des outils de bureautique.",
    category: "informatique",
    subcategory: "Bureautique",
    level: "Intermédiaire",
    duration: 15,
    assignedTo: ["besdu", "pnjt"],
    status: "published",
    instructor: {
      name: "Michel Toko",
      title: "Formateur en bureautique",
      bio: "20 ans d'expérience en formation bureautique.",
      photoUrl: "https://randomuser.me/api/portraits/men/32.jpg"
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
                content: "Bienvenue à tous dans ce module intermédiaire !",
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
  },
  {
    title: "Perfectionnement en bureautique",
    description: "Devenez expert des outils de bureautique et automatisez vos tâches.",
    category: "informatique",
    subcategory: "Bureautique",
    level: "Avancé",
    duration: 20,
    assignedTo: ["unikin", "vision26"],
    status: "published",
    instructor: {
      name: "Michel Toko",
      title: "Formateur en bureautique",
      bio: "20 ans d'expérience en formation bureautique.",
      photoUrl: "https://randomuser.me/api/portraits/men/32.jpg"
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
                content: "Bienvenue dans ce module avancé !",
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
  },
  {
    title: "Introduction aux droits humains",
    description: "Comprendre les fondamentaux des droits humains et leur application.",
    category: "Droits humains",
    level: "Débutant",
    duration: 12,
    assignedTo: ["besdu", "fonarev", "pnjt"],
    status: "published",
    instructor: {
      name: "Marie Kabongo",
      title: "Spécialiste en droits humains",
      bio: "15 ans d'expérience dans le domaine des droits humains.",
      photoUrl: "https://randomuser.me/api/portraits/women/42.jpg"
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
                content: "Bienvenue dans ce cours sur les droits humains !",
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
  }
];

// Function to create companies
async function createCompanies() {
  console.log('Creating companies...');
  for (const company of companies) {
    try {
      // Check if company already exists
      const companyRef = doc(db, 'companies', company.id);
      await setDoc(companyRef, {
        name: company.name,
        email: company.email,
        phone: company.phone,
        logoUrl: company.logoUrl,
        status: company.status,
        agent_count: 0,
        course_count: 0,
        created_at: serverTimestamp()
      });
      console.log(`Created company: ${company.name}`);
    } catch (error) {
      console.error(`Error creating company ${company.name}:`, error);
    }
  }
}

// Function to create users
async function createUsers() {
  console.log('Creating users...');
  for (const user of users) {
    try {
      // Check if user already exists
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', user.email)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        console.log(`User ${user.email} already exists, skipping...`);
        continue;
      }
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      const uid = userCredential.user.uid;
      
      // Create user in Firestore
      await setDoc(doc(db, 'users', uid), {
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId || null,
        status: 'active',
        createdAt: serverTimestamp()
      });
      
      console.log(`Created user: ${user.email}`);
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error);
    }
  }
}

// Function to create courses
async function createCourses() {
  console.log('Creating courses...');
  for (const course of courses) {
    try {
      const courseRef = doc(collection(db, 'courses'));
      await setDoc(courseRef, {
        ...course,
        createdAt: serverTimestamp()
      });
      console.log(`Created course: ${course.title}`);
    } catch (error) {
      console.error(`Error creating course ${course.title}:`, error);
    }
  }
}

// Function to create enrollments
async function createEnrollments() {
  console.log('Creating enrollments...');
  
  // Get all students
  const studentsQuery = query(
    collection(db, 'users'),
    where('role', '==', 'STUDENT')
  );
  const studentsSnapshot = await getDocs(studentsQuery);
  const students = studentsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Get all courses
  const coursesSnapshot = await getDocs(collection(db, 'courses'));
  const allCourses = coursesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Create enrollments for each student
  for (const student of students) {
    // Find courses assigned to student's company
    const studentCourses = allCourses.filter(course => 
      course.assignedTo && course.assignedTo.includes(student.companyId)
    );
    
    for (const course of studentCourses) {
      try {
        const enrollmentRef = doc(collection(db, 'enrollments'));
        await setDoc(enrollmentRef, {
          userId: student.id,
          courseId: course.id,
          companyId: student.companyId,
          status: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'][Math.floor(Math.random() * 3)],
          progress: Math.floor(Math.random() * 101),
          enrolledAt: serverTimestamp(),
          lastActivity: serverTimestamp(),
          timeSpent: Math.floor(Math.random() * 3600) // Random time in seconds
        });
        console.log(`Created enrollment for ${student.email} in course ${course.title}`);
      } catch (error) {
        console.error(`Error creating enrollment:`, error);
      }
    }
  }
}

// Main function to initialize all data
async function initializeData() {
  try {
    await createCompanies();
    await createUsers();
    await createCourses();
    await createEnrollments();
    console.log('Data initialization complete!');
  } catch (error) {
    console.error('Error initializing data:', error);
  }
}

// Run the initialization
initializeData();