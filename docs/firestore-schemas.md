# Structure des collections Firestore pour VTraining

Ce document décrit la structure des collections Firestore utilisées pour l'optimisation du stockage des cours dans l'application VTraining.

## Structure des collections

### `courses` - Informations de base sur les cours

Stocke les métadonnées essentielles des cours sans inclure leur structure interne complète.

```typescript
{
  id: string;                     // ID du document
  title: string;                  // Titre du cours
  description: string;            // Description du cours
  categoryId: string;             // Référence à la catégorie
  level: string;                  // Niveau (débutant, intermédiaire, avancé)
  duration: number;               // Durée estimée en heures
  videoUrl?: string;              // URL de la vidéo d'introduction
  videoThumbnailUrl?: string;     // Miniature de la vidéo
  assignedTo: string[];           // IDs des entreprises auxquelles ce cours est assigné
  status: 'draft' | 'published';  // Statut du cours
  tags?: string[];                // Tags pour la recherche et le filtrage
  instructorId?: string;          // Référence au document instructeur
  chaptersOrder: string[];        // Ordre des chapitres (IDs)
  currentVersion?: number;        // Version actuelle du cours
  createdAt: Timestamp;           // Date de création
  updatedAt: Timestamp;           // Date de dernière mise à jour
}
```

### `instructors` - Profils des instructeurs

Contient les informations sur les instructeurs des cours, séparées des cours eux-mêmes.

```typescript
{
  id: string;                     // ID du document
  name: string;                   // Nom complet
  title: string;                  // Titre/Fonction
  bio: string;                    // Biographie
  photoUrl?: string;              // URL de la photo de profil
  email?: string;                 // Email de contact (optionnel)
  expertise?: string[];           // Domaines d'expertise
  socialLinks?: {                 // Liens sociaux
    linkedIn?: string;
    twitter?: string;
    website?: string;
  };
  courses?: string[];             // IDs des cours associés
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `chapters` - Chapitres des cours

Stocke les chapitres individuels associés à un cours.

```typescript
{
  id: string;                     // ID du document
  courseId: string;               // ID du cours parent
  title: string;                  // Titre du chapitre
  description?: string;           // Description (optionnelle)
  order: number;                  // Ordre dans le cours
  estimatedTime?: number;         // Temps estimé en minutes
  learningObjectives?: string[];  // Objectifs d'apprentissage
  sectionsOrder: string[];        // Ordre des sections (IDs)
  hasQuiz?: boolean;              // Indique si un quiz est associé au chapitre
  quizSettings?: {                // Paramètres du quiz (si hasQuiz est true)
    passingScore: number;         // Score minimum pour réussir (%)
    timeLimit: number;            // Limite de temps en minutes
    questionCount: number;        // Nombre de questions
    isRandomized: boolean;        // Si les questions sont aléatoires
    showFeedbackImmediately: boolean; // Afficher la correction immédiatement
    attemptsAllowed: number;      // Nombre de tentatives autorisées
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `sections` - Sections des chapitres

Stocke les sections individuelles associées à un chapitre.

```typescript
{
  id: string;                     // ID du document
  chapterId: string;              // ID du chapitre parent
  courseId: string;               // ID du cours parent (pour les requêtes directes)
  title: string;                  // Titre de la section
  order: number;                  // Ordre dans le chapitre
  contentBlocksOrder: string[];   // Ordre des blocs de contenu (IDs)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `content_blocks` - Blocs de contenu des sections

Stocke les blocs de contenu individuels (texte, image, vidéo, etc.) associés à une section.

```typescript
{
  id: string;                     // ID du document
  sectionId: string;              // ID de la section parente
  chapterId: string;              // ID du chapitre parent
  courseId: string;               // ID du cours parent
  type: string;                   // Type de contenu ('text', 'image', 'video', 'file', 'code', 'embed')
  content: string;                // Contenu textuel ou référence
  order: number;                  // Ordre dans la section
  formatting?: {                  // Options de formatage pour le texte
    bold?: boolean;
    italic?: boolean;
    list?: boolean;
    alignment?: 'left' | 'center' | 'right';
  };
  media?: {                       // Propriétés des médias
    id: string;
    type: 'image' | 'video';
    url: string;
    alignment?: 'left' | 'center' | 'right';
    caption?: string;
    thumbnailUrl?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `quiz_questions` - Questions de quiz

Stocke les questions de quiz associées à un chapitre.

```typescript
{
  id: string;                     // ID du document
  chapterId: string;              // ID du chapitre parent
  courseId: string;               // ID du cours parent
  question: string;               // Texte de la question
  options: string[];              // Options de réponse
  answer: number;                 // Index de la bonne réponse
  explanation?: string;           // Explication de la réponse
  difficulty?: string;            // Niveau de difficulté ('easy', 'medium', 'hard')
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `quiz_attempts` - Tentatives de quiz des étudiants

Stocke les tentatives de quiz des étudiants.

```typescript
{
  id: string;                     // ID du document
  userId: string;                 // ID de l'utilisateur
  chapterId: string;              // ID du chapitre
  courseId: string;               // ID du cours
  startedAt: Timestamp;           // Heure de début
  completedAt?: Timestamp;        // Heure de fin
  timeSpent?: number;             // Temps passé en secondes
  score: number;                  // Score obtenu
  maxScore: number;               // Score maximum possible
  passed: boolean;                // Si l'étudiant a réussi
  answers: [                      // Réponses données
    {
      questionId: string;         // ID de la question
      selectedAnswer: number;     // Réponse sélectionnée (index)
      correct: boolean;           // Si la réponse est correcte
    }
  ];
  createdAt: Timestamp;
}
```

### `course_versions` - Historique des versions des cours

Stocke l'historique des versions des cours pour le versionnage et la restauration.

```typescript
{
  id: string;                     // ID du document
  courseId: string;               // ID du cours
  versionNumber: number;          // Numéro de version
  createdAt: Timestamp;           // Date de création
  createdBy: string;              // ID de l'utilisateur qui a créé la version
  changes: [                      // Changements apportés
    {
      field: string;              // Champ modifié
      oldValue: any;              // Ancienne valeur
      newValue: any;              // Nouvelle valeur
    }
  ];
  snapshot: any;                  // Instantané complet du cours à ce moment
}
```

## Relations entre les collections

1. Un **cours** (`courses`) peut avoir plusieurs **chapitres** (`chapters`)
2. Un **chapitre** appartient à un seul **cours** et peut avoir plusieurs **sections** (`sections`)
3. Une **section** appartient à un seul **chapitre** et peut avoir plusieurs **blocs de contenu** (`content_blocks`)
4. Un **bloc de contenu** appartient à une seule **section**
5. Un **instructeur** (`instructors`) peut être associé à plusieurs **cours**
6. Un **chapitre** peut avoir plusieurs **questions de quiz** (`quiz_questions`)
7. Un **utilisateur** peut avoir plusieurs **tentatives de quiz** (`quiz_attempts`) pour un même chapitre
8. Un **cours** peut avoir plusieurs **versions** (`course_versions`)

## Règles d'indexation recommandées

Pour optimiser les requêtes, les index composites suivants sont recommandés:

1. `chapters`: (`courseId`, `order`) - Pour récupérer les chapitres d'un cours dans le bon ordre
2. `sections`: (`chapterId`, `order`) - Pour récupérer les sections d'un chapitre dans le bon ordre
3. `content_blocks`: (`sectionId`, `order`) - Pour récupérer les blocs d'une section dans le bon ordre
4. `quiz_questions`: (`chapterId`, `difficulty`) - Pour récupérer les questions d'un chapitre par niveau de difficulté
5. `quiz_attempts`: (`userId`, `courseId`) - Pour récupérer toutes les tentatives d'un utilisateur pour un cours
6. `course_versions`: (`courseId`, `versionNumber`) - Pour récupérer les versions d'un cours par ordre

## Stratégies de dénormalisation

Certaines données sont intentionnellement dénormalisées pour optimiser les performances:

1. Les blocs de contenu stockent `courseId` et `chapterId` pour permettre des requêtes directes sans avoir à traverser la hiérarchie complète.
2. Les sections stockent `courseId` pour la même raison.
3. Les questions de quiz stockent `courseId` pour faciliter les requêtes de toutes les questions d'un cours.

Cette approche permet un bon équilibre entre normalisation (pour la cohérence des données) et dénormalisation (pour les performances).
