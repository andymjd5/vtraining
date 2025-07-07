// src/types/course.ts
// Types définissant la nouvelle structure de données pour les cours
// Ces types remplacent et étendent les types existants dans index.ts

// Types de base pour les documents Firestore

/**
 * Document principal du cours - Collection 'courses'
 */
export interface Course {
    id: string;
    title: string;
    description: string;
    categoryId: string;
    level: string;
    duration: number;
    videoUrl?: string;
    videoThumbnailUrl?: string;  // Nouvelle propriété: miniature de la vidéo
    assignedTo: string[];
    status: 'draft' | 'published';
    tags?: string[];              // Nouveau: tags pour la recherche
    createdAt: any;
    updatedAt: any;
    instructorId?: string;        // Référence à un profil d'instructeur distinct
    chaptersOrder: string[];      // Ordre des chapitres
    currentVersion?: number;      // Numéro de version actuel
}

/**
 * Document instructeur - Collection 'instructors'
 */
export interface Instructor {
    id: string;
    name: string;
    title: string;
    bio: string;
    photoUrl?: string;
    email?: string;
    expertise?: string[];
    socialLinks?: {
        linkedIn?: string;
        twitter?: string;
        website?: string;
    };
    courses?: string[];          // IDs des cours associés
    createdAt: any;
    updatedAt: any;
}

/**
 * Document chapitre - Collection 'chapters'
 */
export interface Chapter {
    id: string;
    courseId: string;
    title: string;
    description?: string;
    order: number;
    estimatedTime?: number;        // Temps estimé en minutes
    learningObjectives?: string[]; // Nouveaux objectifs d'apprentissage
    sectionsOrder: string[];       // Ordre des sections
    hasQuiz?: boolean;
    quizSettings?: QuizSettings;
    createdAt: any;
    updatedAt: any;
}

/**
 * Document section - Collection 'sections'
 */
export interface Section {
    id: string;
    chapterId: string;
    courseId: string;
    title: string;
    order: number;
    contentBlocksOrder: string[];  // Ordre des blocs de contenu
    createdAt: any;
    updatedAt: any;
}

/**
 * Document bloc de contenu - Collection 'content_blocks'
 */
export interface ContentBlock {
    id: string;
    sectionId: string;
    chapterId: string;
    courseId: string;
    type: 'text' | 'media' | 'file' | 'code' | 'embed'; // Simplifié - approche media unifiée
    content: string; // Pour text, code, embed, file (URL/path)
    order: number;
    formatting?: TextFormatting; // Seulement pour type 'text'
    media?: MediaItem; // Pour type 'media' uniquement
    createdAt: any;
    updatedAt: any;
}

/**
 * Options de formatage du texte
 */
export interface TextFormatting {
    bold?: boolean;
    italic?: boolean;
    list?: boolean;
    alignment?: 'left' | 'center' | 'right';
}

/**
 * Item média (image, vidéo ou audio)
 */
export interface MediaItem {
    id: string;
    type: 'image' | 'video' | 'audio'; // Ajout d'audio
    url: string;
    alignment?: 'left' | 'center' | 'right';
    caption?: string;
    thumbnailUrl?: string;        // URL de miniature pour les vidéos
    duration?: number;            // Durée en secondes pour video/audio
    fileSize?: number;            // Taille du fichier en bytes
    mimeType?: string;            // Type MIME du fichier
}

/**
 * Paramètres de quiz
 */
export interface QuizSettings {
    generationMode: 'pool' | 'onTheFly'; // 'pool' pour banque de questions, 'onTheFly' pour génération à la volée
    passingScore: number;
    timeLimit: number;
    questionCount: number;
    isRandomized: boolean;
    showFeedbackImmediately: boolean;
    attemptsAllowed: number;
}

/**
 * Question de quiz - Collection 'quiz_questions'
 */
export interface QuizQuestion {
    id: string;
    chapterId: string;
    courseId: string;
    question: string;
    options: string[];
    answer: number;  // Index de la bonne réponse
    explanation?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    generatedByAI?: boolean; // Indique si la question a été générée par l'IA
    createdAt: any;
    updatedAt: any;
}

/**
 * Tentative de quiz - Collection 'quiz_attempts'
 * NOTE: Restructuré pour embarquer les questions directement dans la tentative.
 */
export interface QuizAttempt {
    id: string;
    userId: string;
    chapterId: string;
    courseId: string;
    startedAt: any;
    completedAt?: any;
    timeSpent?: number;
    score: number;
    maxScore: number;
    passed: boolean;
    // Structure restructurée pour inclure les questions complètes
    questionsAsked: {
        questionText: string;       // Le texte de la question
        options: string[];          // Les options de réponse proposées
        correctAnswerIndex: number; // L'index de la bonne réponse
        selectedAnswerIndex?: number;// L'index de la réponse de l'utilisateur
        isCorrect?: boolean;         // Le résultat pour cette question
        explanation?: string;       // L'explication (si disponible)
    }[];
}

/**
 * Version de cours - Collection 'course_versions'
 */
export interface CourseVersion {
    id: string;
    courseId: string;
    versionNumber: number;
    createdAt: any;
    createdBy: string;
    changes: {
        field: string;
        oldValue: any;
        newValue: any;
    }[];
    snapshot: any; // Instantané du cours à ce moment
}

// Types composites pour l'interface utilisateur

/**
 * Course avec sa structure complète (pour l'UI)
 */
export interface CourseWithStructure extends Course {
    chapters?: ChapterWithSections[];
    instructor?: Instructor;
}

/**
 * Chapitre avec ses sections (pour l'UI)
 */
export interface ChapterWithSections extends Chapter {
    sections: SectionWithContent[];
    expanded?: boolean; // Pour l'UI seulement
}

/**
 * Section avec ses blocs de contenu (pour l'UI)
 */
export interface SectionWithContent extends Section {
    content: ContentBlock[];
}

/**
 * Type décrivant la migration d'un cours depuis l'ancien format
 */
export interface CourseMigrationResult {
    course: Course;
    instructor: Instructor;
    chapters: Chapter[];
    sections: Section[];
    contentBlocks: ContentBlock[];
}
