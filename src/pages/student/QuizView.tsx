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
  const [isLoading, setIsLoading] = useState(true); const [quizCompleted, setQuizCompleted] = useState(false);
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
          const questionsData = await quizService.startQuizSession(user?.uid || 'anonymous', chapterId, courseId);

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
    if (isLoading || quizCompleted || timeLeft <= 0) return;

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
  }, [isLoading, quizCompleted, timeLeft]);

  // Retourner à la vue du cours
  const handleReturnToCourse = () => {
    navigate(`/student/courses/${courseId}`);
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

  const renderQuizNavigation = () => (
    <div className="flex justify-between">
      <button
        onClick={goToPreviousQuestion}
        disabled={currentQuestion === 0}
        className={`px-4 py-2 rounded ${currentQuestion === 0
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
      >
        Question précédente
      </button>

      {currentQuestion === questions.length - 1 ? (
        <button
          onClick={handleQuizSubmit}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Terminer le quiz
        </button>
      ) : (
        <button
          onClick={goToNextQuestion}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Question suivante
        </button>
      )}
    </div>
  );

  const renderQuizProgress = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="bg-white rounded-lg shadow-sm p-3">
        <p className="text-sm text-gray-600">
          Question <span className="font-medium">{currentQuestion + 1}</span> sur <span className="font-medium">{questions.length}</span>
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-3">
        <p className="text-sm text-gray-600">
          Temps restant: <span className="font-medium">{formatTime(timeLeft)}</span>
        </p>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!result || !chapter) return null;

    const passingScore = chapter.quizSettings?.passingScore || 60;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Quiz terminé</h2>

        <div className="mb-6">
          <div className={`text-4xl font-bold mb-2 ${result.isPassed ? 'text-green-600' : 'text-red-600'}`}>
            {result.score}%
          </div>
          <p className="text-gray-600">
            {result.isPassed
              ? `Félicitations! Vous avez réussi le quiz (min. ${passingScore}%)`
              : `Vous n'avez pas atteint le score minimum requis (${passingScore}%)`
            }
          </p>
        </div>

        <div className="flex flex-col items-center space-y-4 mb-6">
          <div className="flex items-center justify-between w-full max-w-xs">
            <span className="text-gray-600">Questions:</span>
            <span className="font-medium">{result.totalQuestions}</span>
          </div>
          <div className="flex items-center justify-between w-full max-w-xs">
            <span className="text-gray-600">Temps utilisé:</span>
            <span className="font-medium">{Math.floor(result.timeTaken / 60)} min {result.timeTaken % 60} sec</span>
          </div>
        </div>

        <button
          onClick={handleReturnToCourse}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
        >
          Retourner au cours
        </button>
      </div>
    );
  };

  // Rendu principal
  if (isLoading) return renderLoading();
  if (error) return renderError();
  if (questions.length === 0) return renderError();
  if (quizCompleted) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        {renderResults()}
      </div>
    );
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
