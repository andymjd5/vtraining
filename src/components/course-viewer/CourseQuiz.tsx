import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { quizService } from '../../services/quizService';
import { QuizQuestion, QuizAttempt, Chapter } from '../../types/course';
import { useToast } from '../../hooks/useToast';

interface CourseQuizProps {
  chapterId: string;
  courseId: string;
  onQuizComplete: () => void;
}

const CourseQuiz: React.FC<CourseQuizProps> = ({ chapterId, courseId, onQuizComplete }) => {
  const [user] = useAuthState(auth);
  const { success, error, toasts, removeToast } = useToast();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [attemptsAllowed, setAttemptsAllowed] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false); // Pour l'écran de preview
  // Calcul du nombre de tentatives restantes
  const attemptsLeft = attemptsAllowed !== null ? Math.max(0, attemptsAllowed - attempts.length) : null;
  const isBlocked = attemptsAllowed !== null && attempts.length >= attemptsAllowed;

  // Timer (affichage uniquement)
  useEffect(() => {
    if (chapter?.quizSettings?.timeLimit) {
      setTimeLeft(chapter.quizSettings.timeLimit * 60); // en secondes
    }
  }, [chapter]);

  // Timer (affichage + soumission automatique)
  useEffect(() => {
    if (timeLeft === null || quizCompleted || isBlocked || !quizStarted) return;
    if (timeLeft <= 0) {
      if (!quizCompleted) {
        handleQuizSubmit();
      }
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, quizCompleted, isBlocked, quizStarted]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        // Charger le chapitre pour les settings
        const chapterDoc = await getDoc(doc(db, 'chapters', chapterId));
        let chap: Chapter | null = null;
        if (chapterDoc.exists()) {
          chap = { id: chapterDoc.id, ...chapterDoc.data() } as Chapter;
          setChapter(chap);
          setAttemptsAllowed(chap.quizSettings?.attemptsAllowed ?? null);
        }
        // Charger les questions du quiz selon le mode
        let questionsData: QuizQuestion[] = [];
        if (chap && chap.quizSettings?.generationMode === 'onTheFly' && user) {
          questionsData = await quizService.startQuizSession(
            user.uid,
            chapterId,
            courseId,
            false // isRetry = false
          );
        } else {
          questionsData = await quizService.getQuizQuestionsByChapterId(chapterId);
        }
        setQuestions(questionsData);
        // Charger l'historique des tentatives utilisateur
        if (user) {
          const userAttempts = await quizService.getUserQuizAttempts(user.uid, chapterId);
          setAttempts(userAttempts);
        }
      } catch (err) {
        setErrorMsg("Erreur lors du chargement du quiz");
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuiz();
    // eslint-disable-next-line
  }, [chapterId, user]);


  const handleAnswerSelection = (answerIndex: number) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: answerIndex });
  };

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

  const handleQuizSubmit = async () => {
    if (!user) return;
    // Vérifier si toutes les questions ont été répondues
    const unanswered = questions.length - Object.keys(selectedAnswers).length;
    if (unanswered > 0) {
      error(`Il reste ${unanswered} question(s) sans réponse.`);
      return;
    }
    // Vérifier la limite de tentatives
    if (isBlocked) {
      error("Nombre de tentatives maximum atteint pour ce quiz.");
      return;
    }
    // Calculer le score
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.answer) {
        correctAnswers++;
      }
    });
    const scorePercentage = Math.round((correctAnswers / questions.length) * 100);
    const passingScore = chapter?.quizSettings?.passingScore || 60;
    const isPassed = scorePercentage >= passingScore;
    const quizAttempt: Omit<QuizAttempt, 'id'> = {
      userId: user.uid,
      chapterId,
      courseId,
      startedAt: new Date(),
      completedAt: new Date(),
      timeSpent: 0,
      score: scorePercentage,
      maxScore: 100,
      passed: isPassed,
      questionsAsked: questions.map((question, index) => ({
        questionText: question.question,
        options: question.options,
        correctAnswerIndex: question.answer,
        selectedAnswerIndex: selectedAnswers[index],
        isCorrect: selectedAnswers[index] === question.answer,
        explanation: question.explanation
      }))
    };
    setResult(quizAttempt as QuizAttempt);
    setQuizCompleted(true);
    try {
      await quizService.saveQuizAttemptNew(quizAttempt);
      success(isPassed ? 'Quiz réussi !' : 'Quiz terminé. Vous pouvez réessayer.');
      // Rafraîchir l'historique des tentatives
      if (user) {
        const userAttempts = await quizService.getUserQuizAttempts(user.uid, chapterId);
        setAttempts(userAttempts);
      }
    } catch (err) {
      error("Erreur lors de l'enregistrement du résultat du quiz.");
    }
  };

  if (isLoading) return <div>Chargement du quiz...</div>;
  if (errorMsg) return <div className="text-red-600">{errorMsg}</div>;
  if (isBlocked) {
    return (
      <div className="p-4 border rounded bg-white text-center">
        <h3 className="text-lg font-bold mb-2">Quiz du chapitre</h3>
        <p className="text-red-600 font-semibold mb-2">Nombre de tentatives maximum atteint pour ce quiz.</p>
        {attempts.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-1">Historique de vos tentatives :</h4>
            <ul className="text-sm">
              {attempts.map((a, idx) => (
                <li key={a.startedAt?.toString() || idx}>
                  Tentative {attempts.length - idx} : {a.score}% ({a.passed ? 'Réussi' : 'Échec'})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  if (quizCompleted && result) {
    // Calculs pour l'affichage détaillé
    const passingScore = chapter?.quizSettings?.passingScore || 60;
    const correctAnswers = result.questionsAsked.filter(q => q.isCorrect).length;
    const incorrectAnswers = result.questionsAsked.length - correctAnswers;
    // On ne peut pas toujours avoir le temps utilisé, donc on affiche 0 si non dispo
    const timeUsed = result.timeSpent || 0;
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* En-tête des résultats */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Résultats du Quiz</h1>
            <div className={`text-6xl font-bold mb-4 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>{result.score}%</div>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${result.passed ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{result.passed ? '🎉 Quiz réussi!' : '❌ Quiz échoué'}</div>
            <p className="text-gray-600 mt-4">
              {result.passed
                ? `Félicitations! Vous avez dépassé le score minimum requis de ${passingScore}%`
                : `Vous n'avez pas atteint le score minimum requis de ${passingScore}%. Vous pouvez recommencer.`
              }
            </p>
          </div>
          {/* Statistiques détaillées */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{result.questionsAsked.length}</div>
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
              <div className="text-2xl font-bold text-gray-600">{Math.floor(timeUsed / 60)}:{(timeUsed % 60).toString().padStart(2, '0')}</div>
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
            {result.questionsAsked.map((q, idx) => {
              const isCorrect = q.isCorrect;
              const hasAnswered = typeof q.selectedAnswerIndex === 'number';
              return (
                <div key={idx} className={`border rounded-lg p-6 ${isCorrect ? 'border-green-200 bg-green-50' : hasAnswered ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${isCorrect ? 'bg-green-500 text-white' : hasAnswered ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>{idx + 1}</span>
                      Question {idx + 1}
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${isCorrect ? 'bg-green-200 text-green-800' : hasAnswered ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>{isCorrect ? 'Correct' : hasAnswered ? 'Incorrect' : 'Non répondu'}</div>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-800 font-medium">{q.questionText}</p>
                  </div>
                  <div className="space-y-2 mb-4">
                    {q.options.map((option, optionIndex) => {
                      const isUserChoice = q.selectedAnswerIndex === optionIndex;
                      const isCorrectAnswer = q.correctAnswerIndex === optionIndex;
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
                            <span className={`${isCorrectAnswer ? 'font-semibold text-green-800' : isUserChoice && !isCorrectAnswer ? 'font-semibold text-red-800' : 'text-gray-700'}`}>{String.fromCharCode(65 + optionIndex)}. {option}</span>
                            <div className="flex items-center space-x-2">
                              {isUserChoice && (<span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">Votre choix</span>)}
                              {icon}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Explication
                      </h4>
                      <p className="text-blue-800">{q.explanation}</p>
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
              onClick={onQuizComplete}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Relire le chapitre
            </button>
            <button
              onClick={() => {
                setQuizCompleted(false);
                setResult(null);
                setCurrentQuestion(0);
                setSelectedAnswers({});
                setQuizStarted(false);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Refaire le quiz
            </button>
          </div>
        </div>
      </div>
    );
  }
  // Affichage de l'écran de preview avant de commencer le quiz
  if (!quizStarted) {
    // Afficher les règles et paramètres du quiz
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Quiz du chapitre</h2>
          <h3 className="text-lg font-semibold mb-2">{chapter?.title}</h3>
          <div className="mb-4">
            <div className="mb-2">Nombre de questions : <b>{questions.length}</b></div>
            {chapter?.quizSettings?.timeLimit && (
              <div className="mb-2">Temps limite : <b>{chapter.quizSettings.timeLimit} minutes</b></div>
            )}
            {chapter?.quizSettings?.passingScore && (
              <div className="mb-2">Score minimum requis : <b>{chapter.quizSettings.passingScore}%</b></div>
            )}
            {attemptsAllowed && (
              <div className="mb-2">Tentatives autorisées : <b>{attemptsAllowed}</b></div>
            )}
            <div className="mb-2">Mode de génération : <b>{chapter?.quizSettings?.generationMode === 'onTheFly' ? 'Génération à la volée' : 'Banque de questions'}</b></div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <b>Règles importantes :</b>
            <ul className="list-disc pl-6 text-sm mt-2">
              <li>Le chronomètre ne peut pas être mis en pause une fois le quiz commencé.</li>
              <li>Ne fermez pas cette page pendant le quiz.</li>
              <li>Le quiz se termine automatiquement à la fin du temps imparti.</li>
              <li>Vous pouvez naviguer entre les questions avant de soumettre.</li>
            </ul>
          </div>
          <button
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-lg shadow-lg"
            onClick={() => setQuizStarted(true)}
          >
            🚀 Commencer le Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded bg-white">
      <h3 className="text-lg font-bold mb-2">Quiz du chapitre</h3>
      {attemptsAllowed !== null && (
        <div className="mb-2 text-sm text-gray-600">Tentatives restantes : <b>{attemptsLeft}</b> / {attemptsAllowed}</div>
      )}
      {timeLeft !== null && (
        <div className="mb-2 text-sm text-blue-700 font-semibold">Temps restant : {formatTime(timeLeft)}</div>
      )}
      <div className="mb-4">
        <b>Question {currentQuestion + 1} / {questions.length}</b>
        <div className="mt-2 mb-2">{questions[currentQuestion]?.question}</div>
        <div className="flex flex-col gap-2">
          {questions[currentQuestion]?.options.map((option: string, idx: number) => (
            <button
              key={idx}
              className={`px-3 py-2 rounded border text-left ${selectedAnswers[currentQuestion] === idx ? 'bg-blue-200 border-blue-600' : 'bg-gray-100 border-gray-300'}`}
              onClick={() => handleAnswerSelection(idx)}
              disabled={quizCompleted}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-4">
        <button
          className="px-3 py-1 rounded bg-gray-200"
          onClick={goToPreviousQuestion}
          disabled={currentQuestion === 0}
        >
          Précédent
        </button>
        <button
          className="px-3 py-1 rounded bg-blue-600 text-white"
          onClick={goToNextQuestion}
          disabled={currentQuestion === questions.length - 1}
        >
          Suivant
        </button>
        <button
          className="px-3 py-1 rounded bg-green-600 text-white"
          onClick={handleQuizSubmit}
          disabled={quizCompleted}
        >
          Soumettre le quiz
        </button>
      </div>
    </div>
  );
};

export default CourseQuiz; 