import { Course, CourseCategory, Quiz, Question, Option, CourseEnrollment, EnrollmentStatus, QuizAttempt, Certificate } from '../types';

// Mock courses
export const mockCourses: Course[] = [
  {
    id: 'course1',
    title: 'Introduction aux droits humains',
    description: 'Ce cours offre une introduction complète aux principes fondamentaux des droits humains, leur histoire et leur application dans le monde contemporain.',
    content: `# Introduction aux droits humains

## Qu'est-ce que les droits humains?

Les droits humains sont des droits inhérents à tous les êtres humains, quels que soient leur nationalité, lieu de résidence, sexe, origine ethnique ou nationale, couleur, religion, langue ou toute autre situation.

## Histoire des droits humains

L'histoire moderne des droits humains commence avec la Déclaration universelle des droits de l'homme (DUDH) adoptée par l'Assemblée générale des Nations Unies le 10 décembre 1948. Ce document fondateur a été élaboré par des représentants de diverses origines juridiques et culturelles du monde entier.

## Principes fondamentaux

### L'universalité
Les droits humains sont universels - ils s'appliquent à tout le monde, partout.

### L'inaliénabilité
Les droits humains ne peuvent pas être enlevés - une personne ne peut pas cesser d'être humaine, quels que soient ses actes.

### L'indivisibilité
Les droits humains sont indivisibles - on ne peut pas favoriser certains droits au détriment des autres.

### L'interdépendance
Les droits humains sont interdépendants - la réalisation d'un droit dépend souvent de la réalisation d'autres droits.

## Catégories de droits humains

### Droits civils et politiques
- Droit à la vie
- Droit à la liberté et à la sécurité
- Droit à la liberté d'expression
- Droit à la liberté de pensée, de conscience et de religion

### Droits économiques, sociaux et culturels
- Droit à l'éducation
- Droit à la santé
- Droit au travail
- Droit à un niveau de vie suffisant

## Protection des droits humains

### Mécanismes nationaux
- Constitutions
- Législation
- Politiques
- Institutions nationales des droits de l'homme

### Mécanismes internationaux
- Système des Nations Unies
- Systèmes régionaux (africain, américain, européen)
- Tribunaux internationaux

## Défis contemporains
- Terrorisme et sécurité nationale
- Migration et réfugiés
- Changement climatique
- Pauvreté et inégalités
- Discrimination et intolérance

## Conclusion

La promotion et la protection des droits humains restent un défi mondial. Chaque individu a la responsabilité de respecter les droits des autres et de s'engager pour un monde où les droits humains sont réalité pour tous.`,
    category: CourseCategory.HUMAN_RIGHTS,
    status: 'PUBLISHED',
    company_id: 'company1',
    created_by: 'user1',
    created_at: new Date('2023-01-10'),
    updated_at: new Date('2023-04-15'),
  },
  // Add more mock courses as needed
];

// Mock quizzes, questions, options, etc.
export const mockQuizzes: Quiz[] = [];
export const mockEnrollments: CourseEnrollment[] = [];
export const mockQuizAttempts: QuizAttempt[] = [];
export const mockCertificates: Certificate[] = [];

// Helper functions
export const getEnrollmentsByUserId = (userId: string): CourseEnrollment[] => {
  return mockEnrollments.filter(enrollment => enrollment.userId === userId);
};

export const getCourseById = (courseId: string): Course | undefined => {
  return mockCourses.find(course => course.id === courseId);
};

export const getQuizByCourseId = (courseId: string): Quiz | undefined => {
  return mockQuizzes.find(quiz => quiz.courseId === courseId);
};

export const getCertificatesByUserId = (userId: string): Certificate[] => {
  return mockCertificates.filter(certificate => certificate.userId === userId);
};

export const getQuizAttemptsByUserId = (userId: string): QuizAttempt[] => {
  return mockQuizAttempts.filter(attempt => attempt.userId === userId);
};