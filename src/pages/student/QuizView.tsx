import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { quizService } from '../../services/quizService';
import { QuizQuestion, Chapter } from '../../types/course';

// Interfaces nécessaires pour ce composant
interface Course {
  id: string;
  title: string;
  description: string;
  [key: string]: any;
}

interface QuizResult {
  score: number;
  totalQuestions: number;
  completedAt: Date;
  timeTaken: number;
  isPassed: boolean;
}

const QuizView: React.FC = () => {
  // Paramètres de l'URL
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const searchParams = new URLSearchParams(location.search);
  const chapterId = searchParams.get('chapterId');
  const courseId = quizId; // Dans ce cas, quizId est en fait courseId
  // États principaux
  const [course, setCourse] = useState<Course | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes en secondes par défaut
  const [isLoading, setIsLoading] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false); // Nouvel état pour gérer le début du quiz
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);

  // Formater le temps restant
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Récupération des données du cours et du chapitre
  useEffect(() => {
    const fetchCourseAndChapter = async () => {
      if (!courseId || !chapterId) {
        setError("Paramètres d'URL manquants");
        setIsLoading(false);
        return;
      }

      try {
        console.log("Chargement du cours:", courseId);
        console.log("Chargement du chapitre:", chapterId);

        // Récupérer le cours
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (!courseDoc.exists()) {
          setError('Cours non trouvé');
          setIsLoading(false);
          return;
        }

        const courseData = { id: courseDoc.id, ...courseDoc.data() } as Course;
        setCourse(courseData);

        // Récupérer le chapitre
        const chapterDoc = await getDoc(doc(db, 'chapters', chapterId));
        if (!chapterDoc.exists()) {
          setError('Chapitre non trouvé');
          setIsLoading(false);
          return;
        }

        const chapterData = { id: chapterDoc.id, ...chapterDoc.data() } as Chapter;
        setChapter(chapterData);

        // Définir le temps limite basé sur les paramètres du quiz
        if (chapterData.quizSettings?.timeLimit) {
          setTimeLeft(chapterData.quizSettings.timeLimit * 60); // Convertir minutes en secondes
        }        // Charger les questions du quiz
        try {
          const questionsData = await quizService.startQuizSession(
            user?.uid || 'anonymous',
            chapterId,
            courseId,
            false // isRetry = false pour la première tentative
          );

          if (questionsData && questionsData.length > 0) {
            // Si on a des questions, on les utilise
            console.log("Questions chargées:", questionsData.length);
            setQuestions(questionsData);
          } else {
            // Si pas de questions, afficher un message d'erreur
            console.error("Aucune question trouvée pour ce quiz");
            setError("Aucune question n'a été trouvée pour ce quiz. Veuillez contacter votre instructeur.");
          }
        } catch (err) {
          console.error("Erreur lors du chargement des questions:", err);
          setError("Impossible de charger les questions du quiz");
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Erreur lors du chargement des données');
        setIsLoading(false);
      }
    };

    fetchCourseAndChapter();
  }, [courseId, chapterId]);
  // Fonction pour redémarrer le quiz avec de nouvelles questions
  const restartQuizWithNewQuestions = async () => {
    if (!chapterId || !courseId) {
      setError('Paramètres manquants pour redémarrer le quiz');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Charger de nouvelles questions avec logique de retry
      const questionsData = await quizService.startQuizSession(
        user?.uid || 'anonymous',
        chapterId,
        courseId,
        true // isRetry = true pour les tentatives multiples
      );

      if (questionsData && questionsData.length > 0) {
        setQuestions(questionsData);

        // Réinitialiser tous les états
        setQuizCompleted(false);
        setQuizStarted(false);
        setCurrentQuestion(0);
        setSelectedAnswers({});
        setResult(null);

        if (chapter?.quizSettings?.timeLimit) {
          setTimeLeft(chapter.quizSettings.timeLimit * 60);
        }

        console.log("Nouvelles questions chargées pour la tentative:", questionsData.length);
      } else {
        setError("Impossible de charger de nouvelles questions pour cette tentative.");
      }
    } catch (err) {
      console.error("Erreur lors du rechargement des questions:", err);
      setError("Erreur lors du chargement de nouvelles questions");
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion de la sélection des réponses
  const handleAnswerSelection = (answerIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: answerIndex
    });
  };

  // Navigation entre les questions
  const goToNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  // Soumission du quiz
  const handleQuizSubmit = async () => {
    if (!user || !chapter || !courseId || !chapterId) return;

    // Vérifier si toutes les questions ont été répondues
    const unansweredQuestions = questions.length - Object.keys(selectedAnswers).length;

    if (unansweredQuestions > 0) {
      const confirm = window.confirm(
        `Attention! Il vous reste ${unansweredQuestions} question(s) sans réponse.\n\nÊtes-vous sûr de vouloir terminer le quiz maintenant?`
      );
      if (!confirm) return;
    } else {
      const confirm = window.confirm(
        'Êtes-vous sûr de vouloir terminer le quiz?\n\nVous ne pourrez plus modifier vos réponses après avoir confirmé.'
      );
      if (!confirm) return;
    }

    // Calculer le score
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.answer) {
        correctAnswers++;
      }
    });

    const scorePercentage = Math.round((correctAnswers / questions.length) * 100);
    const passingScore = chapter.quizSettings?.passingScore || 60;
    const isPassed = scorePercentage >= passingScore;

    const quizResult: QuizResult = {
      score: scorePercentage,
      totalQuestions: questions.length,
      completedAt: new Date(),
      timeTaken: chapter.quizSettings?.timeLimit ? (chapter.quizSettings.timeLimit * 60) - timeLeft : 0,
      isPassed
    }; setResult(quizResult);
    setQuizCompleted(true); try {
      // Enregistrer le résultat dans Firestore
      await quizService.saveQuizAttemptNew({
        userId: user.uid,
        courseId,
        chapterId,
        score: scorePercentage,
        passed: isPassed,
        startedAt: Timestamp.now(),
        completedAt: Timestamp.now(),
        maxScore: 100,
        questionsAsked: questions.map((question, index) => ({
          questionText: question.question,
          options: question.options,
          correctAnswerIndex: question.answer,
          selectedAnswerIndex: selectedAnswers[index],
          isCorrect: selectedAnswers[index] === question.answer,
          explanation: question.explanation
        }))
      });
    } catch (err) {
      console.error("Erreur lors de l'enregistrement des résultats:", err);
      // On ne bloque pas l'affichage des résultats même en cas d'erreur
    }
  };
  // Chronomètre
  useEffect(() => {
    if (isLoading || quizCompleted || !quizStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleQuizSubmit(); // Soumission automatique quand le temps est écoulé
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, quizCompleted, quizStarted, timeLeft]);
  // Fonction pour démarrer le quiz
  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  // Fonction pour retourner au cours
  const handleReturnToCourse = () => {
    navigate(`/student/courses/${courseId}`);
  };
  const renderQuizPreview = () => {
    if (!chapter || !questions.length) return null;

    const settings = chapter.quizSettings;
    if (!settings) return null;

    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* En-tête */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{course?.title}</h1>
            <h2 className="text-xl text-gray-700 mb-4">{chapter.title} - Quiz</h2>
            <div className="w-16 h-1 bg-indigo-500 mx-auto rounded"></div>
          </div>

          {/* Informations générales */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Informations du Quiz
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre de questions:</span>
                  <span className="font-medium">{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Temps limite:</span>
                  <span className="font-medium">{settings.timeLimit} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Score minimum:</span>
                  <span className="font-medium">{settings.passingScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tentatives autorisées:</span>
                  <span className="font-medium">{settings.attemptsAllowed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode de génération:</span>
                  <span className="font-medium">
                    {settings.generationMode === 'pool' ? 'Banque de questions' : 'Génération à la volée'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Règles Importantes
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  <span>Une fois commencé, le chronomètre ne peut pas être mis en pause</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  <span>Ne fermez pas cette page pendant le quiz</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  <span>Vos réponses sont sauvegardées automatiquement</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  <span>Le quiz se termine automatiquement à la fin du temps imparti</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  <span>Vous pouvez naviguer entre les questions avant de soumettre</span>
                </li>
                {settings.showFeedbackImmediately && (
                  <li className="flex items-start">
                    <span className="text-amber-600 mr-2">•</span>
                    <span>Le feedback sera affiché immédiatement après chaque question</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Instructions spécifiques */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Instructions
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Avant de commencer:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Assurez-vous d'avoir une connexion internet stable</li>
                  <li>• Fermez les autres applications non nécessaires</li>
                  <li>• Préparez-vous mentalement pour {settings.timeLimit} minutes de concentration</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Pendant le quiz:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Lisez chaque question attentivement</li>
                  <li>• Utilisez le bouton "Question suivante/précédente" pour naviguer</li>
                  <li>• Vérifiez vos réponses avant de terminer</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Conditions de réussite */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Conditions de Réussite
            </h3>
            <p className="text-green-800">
              Pour réussir ce quiz, vous devez obtenir un score d'au moins{' '}
              <span className="font-bold">{settings.passingScore}%</span> soit{' '}
              <span className="font-bold">
                {Math.ceil((settings.passingScore / 100) * questions.length)} réponses correctes
              </span>{' '}
              sur {questions.length} questions.
            </p>
            {settings.attemptsAllowed > 1 && (
              <p className="text-green-700 mt-2">
                Vous avez droit à <span className="font-bold">{settings.attemptsAllowed} tentatives</span> au total.
              </p>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleReturnToCourse}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retourner au cours
            </button>
            <button
              onClick={handleStartQuiz}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-lg shadow-lg"
            >
              🚀 Commencer le Quiz
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Rendu des différentes parties de l'interface
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
      <p className="text-gray-600">Chargement du quiz...</p>
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-lg w-full">
        <h2 className="text-red-600 text-xl font-semibold mb-4">Erreur</h2>
        <p className="text-gray-700 mb-6">{error}</p>
        <button
          onClick={handleReturnToCourse}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Retourner au cours
        </button>
      </div>
    </div>
  );
  const renderQuestion = () => {
    const question = questions[currentQuestion];
    if (!question) return null;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-medium mb-4">{question.question}</h3>
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <label
              key={index}
              className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors ${selectedAnswers[currentQuestion] === index
                ? 'bg-indigo-50 border-indigo-300'
                : 'border-gray-200 hover:bg-gray-50'
                }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion}`}
                value={index}
                checked={selectedAnswers[currentQuestion] === index}
                onChange={() => handleAnswerSelection(index)}
                className="mr-2"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };
  const renderQuizNavigation = () => {
    const unansweredQuestions = questions.length - Object.keys(selectedAnswers).length;
    const isLastQuestion = currentQuestion === questions.length - 1;

    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestion === 0}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${currentQuestion === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Précédente
          </button>

          {isLastQuestion ? (
            <div className="flex flex-col items-center">
              {unansweredQuestions > 0 && (
                <p className="text-sm text-amber-600 mb-2">
                  ⚠️ {unansweredQuestions} question(s) non répondue(s)
                </p>
              )}
              <button
                onClick={handleQuizSubmit}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Terminer le quiz
              </button>
            </div>
          ) : (
            <button
              onClick={goToNextQuestion}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Suivante
              <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  };
  const renderQuizProgress = () => (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700 font-medium">
              Question <span className="font-bold">{currentQuestion + 1}</span> sur <span className="font-bold">{questions.length}</span>
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-700 font-medium">
              Temps restant: <span className="font-bold text-amber-800">{formatTime(timeLeft)}</span>
            </p>
          </div>
        </div>

        {/* Indicateur de progression */}
        <div className="text-sm text-gray-600">
          {Object.keys(selectedAnswers).length} / {questions.length} répondues
        </div>
      </div>

      {/* Barre de progression */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Mini navigation des questions */}
      <div className="flex flex-wrap gap-2">
        {questions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuestion(index)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 ${index === currentQuestion
              ? 'bg-blue-600 text-white shadow-lg'
              : selectedAnswers[index] !== undefined
                ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
  const renderResults = () => {
    if (!result || !chapter) return null;

    const passingScore = chapter.quizSettings?.passingScore || 60;
    const correctAnswers = questions.filter((_, index) => selectedAnswers[index] === questions[index].answer).length;
    const incorrectAnswers = questions.length - correctAnswers;

    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* En-tête des résultats */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Résultats du Quiz</h1>
            <div className={`text-6xl font-bold mb-4 ${result.isPassed ? 'text-green-600' : 'text-red-600'}`}>
              {result.score}%
            </div>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${result.isPassed
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
              {result.isPassed ? '🎉 Quiz réussi!' : '❌ Quiz échoué'}
            </div>
            <p className="text-gray-600 mt-4">
              {result.isPassed
                ? `Félicitations! Vous avez dépassé le score minimum requis de ${passingScore}%`
                : `Vous n'avez pas atteint le score minimum requis de ${passingScore}%. Vous pouvez recommencer.`
              }
            </p>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{result.totalQuestions}</div>
              <div className="text-sm text-blue-700">Questions</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
              <div className="text-sm text-green-700">Correctes</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{incorrectAnswers}</div>
              <div className="text-sm text-red-700">Incorrectes</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {Math.floor(result.timeTaken / 60)}:{(result.timeTaken % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-700">Temps utilisé</div>
            </div>
          </div>
        </div>

        {/* Révision détaillée des questions */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
            </svg>
            Révision détaillée
          </h2>

          <div className="space-y-6">
            {questions.map((question, index) => {
              const userAnswer = selectedAnswers[index];
              const isCorrect = userAnswer === question.answer;
              const hasAnswered = userAnswer !== undefined;

              return (
                <div key={index} className={`border rounded-lg p-6 ${isCorrect ? 'border-green-200 bg-green-50' :
                  hasAnswered ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
                  }`}>
                  {/* En-tête de la question */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${isCorrect ? 'bg-green-500 text-white' :
                        hasAnswered ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                        }`}>
                        {index + 1}
                      </span>
                      Question {index + 1}
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${isCorrect ? 'bg-green-200 text-green-800' :
                      hasAnswered ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                      }`}>
                      {isCorrect ? 'Correct' : hasAnswered ? 'Incorrect' : 'Non répondu'}
                    </div>
                  </div>

                  {/* Question */}
                  <div className="mb-4">
                    <p className="text-gray-800 font-medium">{question.question}</p>
                  </div>

                  {/* Options avec indicateurs */}
                  <div className="space-y-2 mb-4">
                    {question.options.map((option, optionIndex) => {
                      const isUserChoice = userAnswer === optionIndex;
                      const isCorrectAnswer = question.answer === optionIndex;

                      let optionClass = 'border border-gray-200 bg-white';
                      let icon = null;

                      if (isCorrectAnswer) {
                        optionClass = 'border-green-300 bg-green-100';
                        icon = <span className="text-green-600 font-bold">✓</span>;
                      } else if (isUserChoice && !isCorrectAnswer) {
                        optionClass = 'border-red-300 bg-red-100';
                        icon = <span className="text-red-600 font-bold">✗</span>;
                      }

                      return (
                        <div key={optionIndex} className={`p-3 rounded-lg ${optionClass}`}>
                          <div className="flex items-center justify-between">
                            <span className={`${isCorrectAnswer ? 'font-semibold text-green-800' :
                              isUserChoice && !isCorrectAnswer ? 'font-semibold text-red-800' : 'text-gray-700'}`}>
                              {String.fromCharCode(65 + optionIndex)}. {option}
                            </span>
                            <div className="flex items-center space-x-2">
                              {isUserChoice && (
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                  Votre choix
                                </span>
                              )}
                              {icon}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explication */}
                  {question.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Explication
                      </h4>
                      <p className="text-blue-800">{question.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleReturnToCourse}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retourner au cours
            </button>            {!result.isPassed && chapter.quizSettings?.attemptsAllowed && chapter.quizSettings.attemptsAllowed > 1 && (
              <button
                onClick={restartQuizWithNewQuestions}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading ? '⏳ Chargement...' : '🔄 Refaire le quiz'}
              </button>
            )}
            {result.isPassed && (
              <button
                onClick={restartQuizWithNewQuestions}
                disabled={isLoading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading ? '⏳ Chargement...' : '⭐ Améliorer mon score'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };  // Rendu principal
  if (isLoading) return renderLoading();
  if (error) return renderError();
  if (questions.length === 0) return renderError();
  if (quizCompleted) {
    return renderResults();
  }

  // Affichage de l'écran de prévisualisation avant de commencer le quiz
  if (!quizStarted) {
    return renderQuizPreview();
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">{course?.title}</h1>
      <h2 className="text-xl text-gray-700 mb-6">{chapter?.title} - Quiz</h2>

      {renderQuizProgress()}
      {renderQuestion()}
      {renderQuizNavigation()}
    </div>
  );
};

export default QuizView;
