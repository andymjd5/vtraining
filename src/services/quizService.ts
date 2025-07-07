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
  limit,
  serverTimestamp,
  deleteDoc,
  writeBatch,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  QuizSettings,
  QuizQuestion,
  QuizAttempt,
  QuizHistory,
  Chapter
} from '../types/course';
import { uuidv4 } from '@firebase/util';

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
      }

      // Préparer les questions sans les sauvegarder dans Firestore
      const questions: QuizQuestion[] = quizData.map((item, index) => {
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

        const sectionsSnapshot = await getDocs(sectionsQuery);

        for (const sectionDoc of sectionsSnapshot.docs) {
          const section = { id: sectionDoc.id, ...sectionDoc.data() };
          contentText += `## ${section.title}\n\n`;

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
      });

      // Mettre à jour l'historique des quiz
      await this.updateQuizHistory(
        attempt.userId as string,
        attempt.chapterId as string,
        attempt.courseId as string,
        attempt.score as number,
        attempt.passed as boolean
      );

      return attemptId;
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
      throw error;
    }
  },

  /**
   * Met à jour l'historique des quiz d'un utilisateur
   * @private
   */
  async updateQuizHistory(
    userId: string,
    chapterId: string,
    courseId: string,
    score: number,
    passed: boolean
  ): Promise<void> {
    try {
      // Vérifier si un historique existe déjà
      const historyQuery = query(
        collection(db, 'quiz_history'),
        where('userId', '==', userId),
        where('chapterId', '==', chapterId),
        limit(1)
      );

      const historySnapshot = await getDocs(historyQuery);

      if (historySnapshot.empty) {
        // Créer un nouvel historique
        const historyId = `hist-${uuidv4()}`;
        const historyRef = doc(db, 'quiz_history', historyId);

        await setDoc(historyRef, {
          id: historyId,
          userId,
          chapterId,
          courseId,
          attempts: 1,
          bestScore: score,
          lastAttemptAt: serverTimestamp(),
          passed
        });
      } else {
        // Mettre à jour l'historique existant
        const historyDoc = historySnapshot.docs[0];
        const history = historyDoc.data() as QuizHistory;

        await updateDoc(historyDoc.ref, {
          attempts: history.attempts + 1,
          bestScore: Math.max(history.bestScore, score),
          lastAttemptAt: serverTimestamp(),
          passed: history.passed || passed // Une fois passé, reste passé
        });
      }
    } catch (error) {
      console.error('Error updating quiz history:', error);
      throw error;
    }
  },

  /**
   * Récupère l'historique des quiz d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param courseId ID du cours (optionnel)
   */
  async getUserQuizHistory(userId: string, courseId?: string): Promise<QuizHistory[]> {
    try {
      let historyQuery;

      if (courseId) {
        historyQuery = query(
          collection(db, 'quiz_history'),
          where('userId', '==', userId),
          where('courseId', '==', courseId)
        );
      } else {
        historyQuery = query(
          collection(db, 'quiz_history'),
          where('userId', '==', userId)
        );
      }

      const historySnapshot = await getDocs(historyQuery);

      return historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as QuizHistory));
    } catch (error) {
      console.error('Error getting user quiz history:', error);
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
  }
};
