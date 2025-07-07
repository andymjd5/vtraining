import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  QuizSettings,
  QuizQuestion,
  QuizAttempt,
  Chapter
} from '../types/course';
import { uuidv4 } from '@firebase/util';
import { aiService } from './aiService';
import { isAIConfigured, AI_CONFIG } from '../config/ai';

/**
 * Service pour la gestion des quiz
 */
export const quizService = {
  /**
   * Sauvegarde les paramètres de quiz pour un chapitre
   * @param chapterId ID du chapitre
   * @param quizSettings Paramètres du quiz
   */
  async saveQuizSettings(chapterId: string, quizSettings: QuizSettings): Promise<void> {
    try {
      const chapterRef = doc(db, 'chapters', chapterId);

      // Nettoyage des undefined qui peuvent causer des erreurs dans Firestore
      const cleanedSettings = Object.entries(quizSettings).reduce((acc: any, [key, value]) => {
        if (value !== undefined) acc[key] = value;
        return acc;
      }, {});

      await updateDoc(chapterRef, {
        hasQuiz: true,
        quizSettings: cleanedSettings,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving quiz settings:', error);
      throw error;
    }
  },

  /**
   * Désactive le quiz d'un chapitre
   * @param chapterId ID du chapitre
   */
  async disableQuiz(chapterId: string): Promise<void> {
    try {
      const chapterRef = doc(db, 'chapters', chapterId);
      await updateDoc(chapterRef, {
        hasQuiz: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error disabling quiz:', error);
      throw error;
    }
  },

  /**
   * Récupère les questions de quiz pour un chapitre spécifique
   * @param chapterId ID du chapitre
   * @returns Liste des questions du quiz
   */
  async getQuizQuestionsByChapterId(chapterId: string): Promise<QuizQuestion[]> {
    try {
      const questionsQuery = query(
        collection(db, 'quiz_questions'),
        where('chapterId', '==', chapterId),
        orderBy('createdAt')
      );

      const snapshot = await getDocs(questionsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as QuizQuestion));
    } catch (error) {
      console.error('Error getting quiz questions:', error);
      throw error;
    }
  },

  /**
   * Récupère les questions de quiz pour plusieurs chapitres
   * @param chapterIds IDs des chapitres
   * @returns Liste des questions du quiz
   */
  async getQuizQuestionsForChapters(chapterIds: string[]): Promise<QuizQuestion[]> {
    try {
      const questionsQuery = query(
        collection(db, 'quiz_questions'),
        where('chapterId', 'in', chapterIds),
        orderBy('createdAt')
      );

      const snapshot = await getDocs(questionsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as QuizQuestion));
    } catch (error) {
      console.error('Error getting quiz questions for multiple chapters:', error);
      throw error;
    }
  },

  /**
   * Génère des questions de quiz basées sur le contenu à l'aide de l'IA
   * @param chapterId ID du chapitre principal
   * @param courseId ID du cours
   * @param contentScope Portée du contenu ('chapter', 'cumulative', 'custom')
   * @param customChapterIds IDs des chapitres personnalisés (si contentScope est 'custom')
   * @param questionCount Nombre de questions à générer
   * @param aiPrompt Instruction personnalisée pour l'IA
   */
  async generateQuestionsWithAI(
    chapterId: string,
    courseId: string,
    contentScope: 'chapter' | 'cumulative' | 'custom',
    customChapterIds?: string[],
    questionCount: number = 5,
    aiPrompt?: string
  ): Promise<QuizQuestion[]> {
    try {
      // Récupérer le contenu des chapitres concernés
      const contentPromise = this.getContentForQuizGeneration(
        chapterId,
        courseId,
        contentScope,
        customChapterIds
      );

      // Pendant que le contenu se charge, préparons la requête à l'API IA
      const apiKey = import.meta.env.VITE_AI_API_KEY;
      if (!apiKey) {
        throw new Error("Clé d'API IA non configurée");
      }

      // Récupération du contenu des chapitres
      const content = await contentPromise;

      // Construction du prompt pour l'IA
      const prompt = aiPrompt ||
        `Génère un quiz de ${questionCount} questions à choix multiples basé sur ce contenu de cours. 
        Chaque question doit avoir 4 options et une réponse correcte (index 0-3). 
        Format JSON requis:
        [
          {
            "question": "Question text",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "answer": 0,
            "explanation": "Explication de la réponse"
          }
        ]
        
        Contenu du cours:
        ${content}`;

      // Appel à l'API IA
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant spécialisé dans la création de quiz éducatifs. Réponds uniquement avec un JSON valide contenant un tableau de questions à choix multiples.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2500
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur de l'API IA: ${response.status}`);
      }

      const data = await response.json();
      let quizData: any[] = [];

      try {
        // Essayer de parser le contenu JSON
        const content = data.choices[0].message.content;
        quizData = JSON.parse(
          content.trim().startsWith('```json') && content.includes('```')
            ? content.split('```json')[1].split('```')[0].trim()
            : content
        );
      } catch (parseError) {
        console.error('Error parsing JSON from AI response:', parseError);
        throw new Error('Format de réponse IA invalide');
      }      // Préparer les questions sans les sauvegarder dans Firestore
      const questions: QuizQuestion[] = quizData.map((item) => {
        return {
          id: `temp-${uuidv4()}`,  // ID temporaire, ne sera pas sauvegardé sauf si nécessaire
          chapterId,
          courseId,
          question: item.question,
          options: item.options,
          answer: item.answer,
          explanation: item.explanation,
          generatedByAI: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      return questions;

    } catch (error) {
      console.error('Error generating questions with AI:', error);
      throw error;
    }
  },

  /**
   * Génère des questions IA et les sauvegarde dans Firestore (utilisé par l'administrateur pour pré-créer des questions)
   * @param chapterId ID du chapitre principal
   * @param courseId ID du cours
   * @param contentScope Portée du contenu
   * @param customChapterIds IDs des chapitres personnalisés
   * @param questionCount Nombre de questions
   * @param aiPrompt Instruction personnalisée pour l'IA
   */
  async generateAndSaveQuestionsWithAI(
    chapterId: string,
    courseId: string,
    contentScope: 'chapter' | 'cumulative' | 'custom',
    customChapterIds?: string[],
    questionCount: number = 5,
    aiPrompt?: string
  ): Promise<QuizQuestion[]> {
    // Générer les questions d'abord
    const questions = await this.generateQuestionsWithAI(
      chapterId,
      courseId,
      contentScope,
      customChapterIds,
      questionCount,
      aiPrompt
    );

    // Sauvegarder les questions dans Firestore
    const batch = writeBatch(db);

    questions.forEach(question => {
      const questionId = `q-${uuidv4()}`;
      const questionRef = doc(db, 'quiz_questions', questionId);

      question.id = questionId;
      // Utiliser serverTimestamp pour les timestamps de Firestore
      const questionData = {
        ...question,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      batch.set(questionRef, questionData);
    });

    await batch.commit();
    return questions;
  },

  /**
   * Récupère le contenu pour la génération de questions par l'IA
   * @private
   */
  async getContentForQuizGeneration(
    chapterId: string,
    courseId: string,
    contentScope: 'chapter' | 'cumulative' | 'custom',
    customChapterIds?: string[]
  ): Promise<string> {
    try {
      let chapterIds: string[] = [];

      switch (contentScope) {
        case 'chapter':
          chapterIds = [chapterId];
          break;

        case 'custom':
          if (!customChapterIds || customChapterIds.length === 0) {
            throw new Error('Aucun chapitre personnalisé sélectionné');
          }
          chapterIds = customChapterIds;
          break;

        case 'cumulative':
          // Récupérer tous les chapitres du cours et filtrer par ordre
          const chaptersQuery = query(
            collection(db, 'chapters'),
            where('courseId', '==', courseId),
            orderBy('order')
          );

          const chaptersSnapshot = await getDocs(chaptersQuery);
          const allChapters = chaptersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Chapter[];

          // Trouver l'ordre du chapitre actuel
          const currentChapterIndex = allChapters.findIndex(ch => ch.id === chapterId);
          if (currentChapterIndex === -1) {
            throw new Error('Chapitre non trouvé');
          }

          // Prendre tous les chapitres jusqu'à l'actuel (cumulatif)
          chapterIds = allChapters
            .slice(0, currentChapterIndex + 1)
            .map(ch => ch.id);
          break;
      }

      // Récupérer le contenu des sections et blocs de contenu
      let contentText = '';

      for (const chapId of chapterIds) {
        // Récupérer le chapitre
        const chapterRef = doc(db, 'chapters', chapId);
        const chapterDoc = await getDoc(chapterRef);

        if (!chapterDoc.exists()) continue;

        const chapter = { id: chapterDoc.id, ...chapterDoc.data() } as Chapter;
        contentText += `# ${chapter.title}\n\n`;

        if (chapter.description) {
          contentText += `${chapter.description}\n\n`;
        }

        // Récupérer les sections
        const sectionsQuery = query(
          collection(db, 'sections'),
          where('chapterId', '==', chapId),
          orderBy('order')
        );

        const sectionsSnapshot = await getDocs(sectionsQuery); for (const sectionDoc of sectionsSnapshot.docs) {
          const section = sectionDoc.data() as any;
          if (section.title) {
            contentText += `## ${section.title}\n\n`;
          }

          // Récupérer les blocs de contenu
          const contentBlocksQuery = query(
            collection(db, 'content_blocks'),
            where('sectionId', '==', section.id),
            orderBy('order')
          );

          const contentBlocksSnapshot = await getDocs(contentBlocksQuery);

          for (const blockDoc of contentBlocksSnapshot.docs) {
            const block = blockDoc.data();

            if (block.type === 'text') {
              contentText += `${block.content}\n\n`;
            }
            // On pourrait ajouter d'autres types de contenu si nécessaire
          }
        }

        contentText += '---\n\n';
      }

      return contentText;

    } catch (error) {
      console.error('Error getting content for quiz generation:', error);
      throw error;
    }
  },

  /**
   * Ajoute une question de quiz manuellement
   * @param question Question à ajouter
   */
  async addQuizQuestion(question: Partial<QuizQuestion>): Promise<string> {
    try {
      const questionId = `q-${uuidv4()}`;
      const questionRef = doc(db, 'quiz_questions', questionId);

      await setDoc(questionRef, {
        id: questionId,
        ...question,
        generatedByAI: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return questionId;
    } catch (error) {
      console.error('Error adding quiz question:', error);
      throw error;
    }
  },

  /**
   * Met à jour une question de quiz
   * @param questionId ID de la question
   * @param updates Modifications à appliquer
   */
  async updateQuizQuestion(questionId: string, updates: Partial<QuizQuestion>): Promise<void> {
    try {
      const questionRef = doc(db, 'quiz_questions', questionId);

      await updateDoc(questionRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating quiz question:', error);
      throw error;
    }
  },

  /**
   * Supprime une question de quiz
   * @param questionId ID de la question
   */
  async deleteQuizQuestion(questionId: string): Promise<void> {
    try {
      const questionRef = doc(db, 'quiz_questions', questionId);
      await deleteDoc(questionRef);
    } catch (error) {
      console.error('Error deleting quiz question:', error);
      throw error;
    }
  },

  /**
   * Enregistre une tentative de quiz
   * @param attempt Tentative de quiz à enregistrer
   */
  async saveQuizAttempt(attempt: Partial<QuizAttempt>): Promise<string> {
    try {
      const attemptId = `att-${uuidv4()}`;
      const attemptRef = doc(db, 'quiz_attempts', attemptId);

      await setDoc(attemptRef, {
        id: attemptId,
        ...attempt,
        startedAt: attempt.startedAt || serverTimestamp(),
        completedAt: attempt.completedAt || serverTimestamp()
      }); return attemptId;
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
      throw error;
    }
  },
  /**
   * Récupère l'historique des tentatives de quiz d'un utilisateur pour un chapitre
   * @param userId ID de l'utilisateur
   * @param chapterId ID du chapitre
   */
  async getUserQuizAttempts(userId: string, chapterId: string): Promise<QuizAttempt[]> {
    try {
      const attemptsQuery = query(
        collection(db, 'quiz_attempts'),
        where('userId', '==', userId),
        where('chapterId', '==', chapterId),
        orderBy('startedAt', 'desc')
      );

      const attemptsSnapshot = await getDocs(attemptsQuery);

      return attemptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as QuizAttempt));
    } catch (error) {
      console.error('Error getting user quiz attempts:', error);
      throw error;
    }
  },  /**
   * Génère et sauvegarde une banque de questions pour un chapitre (Mode Pool)
   * @param chapterId ID du chapitre
   * @param courseId ID du cours
   * @param settings Paramètres du quiz
   */
  async generateAndSaveQuizPool(chapterId: string, courseId: string, settings: QuizSettings): Promise<void> {
    try {
      // Vérifier que l'API IA est configurée
      if (!isAIConfigured()) {
        throw new Error('Configuration API IA manquante. Veuillez configurer VITE_DEEPSEEK_API_KEY.');
      }

      // Générer plus de questions que nécessaire pour créer une vraie banque
      const poolSize = Math.max(settings.questionCount * AI_CONFIG.questionGeneration.poolMultiplier, AI_CONFIG.questionGeneration.defaultPoolSize);

      // Récupérer le contenu du chapitre
      const content = await this.getChapterContent(chapterId);
      if (!content.trim()) {
        throw new Error('Aucun contenu trouvé pour ce chapitre. Veuillez ajouter du contenu avant de générer des questions.');
      }

      // Générer les questions avec l'IA
      const generatedQuestions = await this.generateQuestionsForAI(content, poolSize);

      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error('Aucune question générée par l\'IA');
      }

      // Supprimer les anciennes questions de ce chapitre
      await this.deleteQuestionsByChapterId(chapterId);

      // Sauvegarder les nouvelles questions en batch
      const batch = writeBatch(db);

      generatedQuestions.forEach((questionData) => {
        const questionRef = doc(collection(db, 'quiz_questions'));
        const fullQuestion: QuizQuestion = {
          ...questionData,
          id: questionRef.id,
          chapterId,
          courseId,
          generatedByAI: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        batch.set(questionRef, {
          ...fullQuestion,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      console.log(`Banque de ${generatedQuestions.length} questions générée avec succès pour le chapitre ${chapterId}`);
    } catch (error) {
      console.error('Erreur lors de la génération de la banque de questions:', error);
      throw error;
    }
  },  /**
   * Démarre une session de quiz (gère les deux modes)
   * @param userId ID de l'utilisateur (pour futurs logs)
   * @param chapterId ID du chapitre
   * @param courseId ID du cours
   */
  async startQuizSession(userId: string, chapterId: string, courseId: string): Promise<QuizQuestion[]> {
    try {
      // Récupérer les paramètres du quiz
      const chapterDoc = await getDoc(doc(db, 'chapters', chapterId));
      if (!chapterDoc.exists()) {
        throw new Error('Chapitre non trouvé');
      }

      const chapter = chapterDoc.data();
      const settings = chapter.quizSettings as QuizSettings;

      if (!settings) {
        throw new Error('Paramètres de quiz non configurés pour ce chapitre');
      }

      console.log(`Démarrage session quiz pour utilisateur ${userId}, mode: ${settings.generationMode}`);

      if (settings.generationMode === 'pool') {
        // Mode banque de questions : piocher au hasard
        return await this.getRandomQuestionsFromPool(chapterId, settings.questionCount, settings.isRandomized);
      } else {
        // Mode à la volée : générer des questions uniques
        if (!isAIConfigured()) {
          throw new Error('Configuration API IA manquante pour le mode "à la volée"');
        }

        const content = await this.getChapterContent(chapterId);
        if (!content.trim()) {
          throw new Error('Aucun contenu trouvé pour ce chapitre');
        }

        const generatedQuestions = await this.generateQuestionsForAI(content, settings.questionCount);

        // Convertir en QuizQuestion complètes avec des IDs temporaires
        return generatedQuestions.map((q, index) => ({
          ...q,
          id: `temp-${Date.now()}-${index}`,
          chapterId,
          courseId,
          generatedByAI: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
      }
    } catch (error) {
      console.error('Erreur lors du démarrage de la session quiz:', error);
      throw error;
    }
  },

  /**
   * Récupère des questions aléatoirement depuis la banque
   */
  async getRandomQuestionsFromPool(chapterId: string, count: number, randomize: boolean): Promise<QuizQuestion[]> {
    try {
      const questionsQuery = query(
        collection(db, 'quiz_questions'),
        where('chapterId', '==', chapterId)
      );

      const snapshot = await getDocs(questionsQuery);
      const allQuestions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as QuizQuestion));

      if (allQuestions.length === 0) {
        throw new Error('Aucune question trouvée dans la banque pour ce chapitre');
      }

      // Mélanger et prendre le nombre demandé
      let selectedQuestions = allQuestions;
      if (randomize) {
        selectedQuestions = this.shuffleArray([...allQuestions]);
      }

      return selectedQuestions.slice(0, Math.min(count, selectedQuestions.length));
    } catch (error) {
      console.error('Erreur lors de la récupération des questions de la banque:', error);
      throw error;
    }
  },  /**
   * Génère des questions avec l'IA (utilise le nouveau service multi-provider)
   */
  async generateQuestionsForAI(content: string, questionCount: number): Promise<Omit<QuizQuestion, 'id' | 'chapterId' | 'createdAt' | 'updatedAt'>[]> {
    try {
      // Vérifier que l'API est configurée
      if (!isAIConfigured()) {
        throw new Error('Aucun provider IA configuré. Veuillez configurer au moins une clé API dans votre fichier .env');
      }

      // Utiliser le nouveau service IA
      const generatedQuestions = await aiService.generateQuizQuestions(content, questionCount, {
        difficulty: 'medium',
        language: 'français'
      });

      // Convertir au format QuizQuestion (sans les champs id, chapterId, etc.)
      return generatedQuestions.map(q => ({
        courseId: '',
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        generatedByAI: true
      }));

    } catch (error) {
      console.error('Erreur lors de la génération avec l\'IA:', error);
      throw error;
    }
  },
  /**
   * Construit le prompt pour l'IA
   */
  buildPromptForAI(content: string, questionCount: number): string {
    return `
Tu es un expert en pédagogie. À partir du contenu de cours suivant, génère exactement ${questionCount} questions à choix multiples.

CONTENU DU COURS:
${content}

INSTRUCTIONS:
- Génère exactement ${questionCount} questions
- Chaque question doit avoir exactement 4 options de réponse
- Une seule réponse correcte par question
- Questions pertinentes et pédagogiques
- Niveau de difficulté approprié

RÉPONSE ATTENDUE:
Réponds UNIQUEMENT avec un tableau JSON valide dans ce format exact:
[
  {
    "courseId": "",
    "question": "Texte de la question ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Explication de la réponse correcte",
    "difficulty": "easy"
  }
]

Important: 
- "answer" est l'index de la bonne réponse (0, 1, 2, ou 3)
- "difficulty" peut être "easy", "medium", ou "hard"
- Pas de texte supplémentaire, SEULEMENT le JSON
    `;
  },

  /**
   * Valide et nettoie les questions générées par l'IA
   */
  validateAndCleanQuestions(questions: any[]): Omit<QuizQuestion, 'id' | 'chapterId' | 'createdAt' | 'updatedAt'>[] {
    return questions.map((q, index) => {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${index + 1} invalide: structure incorrecte`);
      }

      if (typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3) {
        throw new Error(`Question ${index + 1} invalide: index de réponse incorrect`);
      }

      return {
        courseId: q.courseId || '',
        question: q.question.trim(),
        options: q.options.map((opt: string) => opt.trim()),
        answer: q.answer,
        explanation: q.explanation?.trim() || '',
        difficulty: q.difficulty || 'medium'
      };
    });
  },

  /**
   * Récupère le contenu d'un chapitre pour l'IA
   */
  async getChapterContent(chapterId: string): Promise<string> {
    try {
      // Récupérer les sections du chapitre
      const sectionsQuery = query(
        collection(db, 'sections'),
        where('chapterId', '==', chapterId),
        orderBy('order')
      );

      const sectionsSnapshot = await getDocs(sectionsQuery);
      let content = '';

      for (const sectionDoc of sectionsSnapshot.docs) {
        const section = sectionDoc.data();
        content += `\n\n=== ${section.title} ===\n`;

        // Récupérer les blocs de contenu de cette section
        const blocksQuery = query(
          collection(db, 'content_blocks'),
          where('sectionId', '==', sectionDoc.id),
          orderBy('order')
        );

        const blocksSnapshot = await getDocs(blocksQuery);

        for (const blockDoc of blocksSnapshot.docs) {
          const block = blockDoc.data();
          if (block.type === 'text') {
            content += `${block.content}\n`;
          }
        }
      }

      return content.trim();
    } catch (error) {
      console.error('Erreur lors de la récupération du contenu:', error);
      throw error;
    }
  },

  /**
   * Supprime toutes les questions d'un chapitre
   */
  async deleteQuestionsByChapterId(chapterId: string): Promise<void> {
    try {
      const questionsQuery = query(
        collection(db, 'quiz_questions'),
        where('chapterId', '==', chapterId)
      );

      const snapshot = await getDocs(questionsQuery);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Erreur lors de la suppression des questions:', error);
      throw error;
    }
  },

  /**
   * Mélange un tableau (algorithme Fisher-Yates)
   */
  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /**
   * Sauvegarde une tentative de quiz avec la nouvelle structure
   */
  async saveQuizAttemptNew(attemptData: Omit<QuizAttempt, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'quiz_attempts'), {
        ...attemptData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la tentative:', error);
      throw error;
    }
  },

  // ...existing code...
};
