import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

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
const auth = getAuth(app);

// Sample data
const companies = [
  {
    id: 'besdu',
    name: 'BESDU',
    email: 'contact@besdu.org',
    phone: '+243123456789',
    logoUrl: '/partners/besdu.png',
    status: 'active',
    createdAt: serverTimestamp()
  },
  {
    id: 'fonarev',
    name: 'FONAREV',
    email: 'contact@fonarev.org',
    phone: '+243987654321',
    logoUrl: '/partners/fonarev.png',
    status: 'active',
    createdAt: serverTimestamp()
  },
  {
    id: 'pnjt',
    name: 'PNJT',
    email: 'contact@pnjt.org',
    phone: '+243456789123',
    logoUrl: '/partners/pnjt.png',
    status: 'active',
    createdAt: serverTimestamp()
  },
  {
    id: 'unikin',
    name: 'UNIKIN',
    email: 'contact@unikin.ac.cd',
    phone: '+243789123456',
    logoUrl: '/partners/unikin.png',
    status: 'active',
    createdAt: serverTimestamp()
  },
  {
    id: 'vision26',
    name: 'VISION 26',
    email: 'contact@vision26.org',
    phone: '+243321654987',
    logoUrl: '/partners/vision26.png',
    status: 'active',
    createdAt: serverTimestamp()
  }
];

const courses = [
  {
    title: "Introduction aux droits humains",
    description: "Ce cours présente les concepts fondamentaux des droits humains et leur application dans le contexte international.",
    category: "Droits humains",
    level: "Débutant",
    duration: 10,
    assignedTo: ["besdu", "fonarev", "vision26"],
    status: "published",
    createdAt: serverTimestamp(),
    instructor: {
      name: "Jean Dupont",
      title: "Expert en droits humains",
      bio: "15 ans d'expérience dans le domaine des droits humains.",
      photoUrl: "https://randomuser.me/api/portraits/men/42.jpg"
    },
    chapters: [
      {
        id: "ch1",
        title: "Introduction aux droits humains",
        order: 0,
        expanded: true,
        sections: [
          {
            id: "sec1",
            title: "Qu'est-ce que les droits humains?",
            order: 0,
            content: [
              {
                id: "block1",
                type: "text",
                content: "Les droits humains sont les droits fondamentaux inhérents à tous les êtres humains.",
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
    title: "Justice transitionnelle avancée",
    description: "Approfondissez vos connaissances sur les mécanismes de justice transitionnelle dans les sociétés post-conflit.",
    category: "Justice transitionnelle",
    level: "Avancé",
    duration: 15,
    assignedTo: ["pnjt", "unikin"],
    status: "published",
    createdAt: serverTimestamp(),
    instructor: {
      name: "Marie Dubois",
      title: "Spécialiste en justice transitionnelle",
      bio: "Consultante internationale avec 20 ans d'expérience.",
      photoUrl: "https://randomuser.me/api/portraits/women/42.jpg"
    },
    chapters: [
      {
        id: "ch1",
        title: "Introduction à la justice transitionnelle",
        order: 0,
        expanded: true,
        sections: [
          {
            id: "sec1",
            title: "Définition et principes",
            order: 0,
            content: [
              {
                id: "block1",
                type: "text",
                content: "La justice transitionnelle comprend l'ensemble des processus et mécanismes mis en œuvre pour faire face à un héritage de violations massives des droits humains.",
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
    title: "Informatique de base",
    description: "Apprenez les fondamentaux de l'informatique et de l'utilisation des outils bureautiques.",
    category: "Informatique",
    level: "Débutant",
    duration: 8,
    assignedTo: ["besdu", "vision26"],
    status: "published",
    createdAt: serverTimestamp(),
    instructor: {
      name: "Michel Toko",
      title: "Formateur en informatique",
      bio: "10 ans d'expérience en formation informatique.",
      photoUrl: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    chapters: [
      {
        id: "ch1",
        title: "Introduction à l'informatique",
        order: 0,
        expanded: true,
        sections: [
          {
            id: "sec1",
            title: "Les bases de l'ordinateur",
            order: 0,
            content: [
              {
                id: "block1",
                type: "text",
                content: "Un ordinateur est composé de matériel (hardware) et de logiciels (software).",
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

const users = [
  {
    email: 'superadmin@visiontraining.com',
    password: 'password123',
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    status: 'active'
  },
  {
    email: 'admin@besdu.org',
    password: 'password123',
    name: 'Admin BESDU',
    role: 'COMPANY_ADMIN',
    companyId: 'besdu',
    status: 'active'
  },
  {
    email: 'admin@fonarev.org',
    password: 'password123',
    name: 'Admin FONAREV',
    role: 'COMPANY_ADMIN',
    companyId: 'fonarev',
    status: 'active'
  },
  {
    email: 'admin@vision26.org',
    password: 'password123',
    name: 'Admin VISION 26',
    role: 'COMPANY_ADMIN',
    companyId: 'vision26',
    status: 'active'
  },
  {
    email: 'student1@besdu.org',
    password: 'password123',
    name: 'Étudiant BESDU',
    role: 'STUDENT',
    companyId: 'besdu',
    status: 'active'
  },
  {
    email: 'student2@fonarev.org',
    password: 'password123',
    name: 'Étudiant FONAREV',
    role: 'STUDENT',
    companyId: 'fonarev',
    status: 'active'
  },
  {
    email: 'student3@vision26.org',
    password: 'password123',
    name: 'Étudiant VISION 26',
    role: 'STUDENT',
    companyId: 'vision26',
    status: 'active'
  }
];

// Initialize enrollments
const createEnrollments = async () => {
  try {
    // Get all students
    const studentsQuery = query(collection(db, 'users'), where('role', '==', 'STUDENT'));
    const studentsSnapshot = await getDocs(studentsQuery);
    const students = studentsSnapshot.docs.map(doc => ({
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

    // Create enrollments for each student for courses assigned to their company
    for (const student of students) {
      const studentCourses = courses.filter(course => 
        course.assignedTo && course.assignedTo.includes(student.companyId)
      );

      for (const course of studentCourses) {
        // Create enrollment
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

        // Update user's enrolled courses
        await setDoc(doc(db, 'users', student.id), {
          enrolledCourses: Array.isArray(student.enrolledCourses) 
            ? [...student.enrolledCourses, course.id] 
            : [course.id]
        }, { merge: true });
      }
    }

    console.log('✅ Enrollments created successfully');
  } catch (error) {
    console.error('❌ Error creating enrollments:', error);
  }
};

// Initialize data
const initializeData = async () => {
  try {
    // Add companies
    for (const company of companies) {
      await setDoc(doc(db, 'companies', company.id), company);
      console.log(`✅ Company added: ${company.name}`);
    }

    // Add users
    for (const userData of users) {
      try {
        // Create user in Auth
        const { email, password, ...userDataWithoutPassword } = userData;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Add user to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          ...userDataWithoutPassword,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log(`✅ User added: ${userData.name} (${userData.email})`);
      } catch (error) {
        // If user already exists, skip
        console.error(`❌ Error adding user ${userData.email}:`, error.message);
      }
    }

    // Add courses
    for (const course of courses) {
      const courseRef = doc(collection(db, 'courses'));
      await setDoc(courseRef, course);
      console.log(`✅ Course added: ${course.title}`);
    }

    // Create enrollments
    await createEnrollments();

    console.log('🚀 All data initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing data:', error);
  }
};

// Run the initialization
initializeData();