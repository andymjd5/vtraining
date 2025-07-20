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
    if (timeLeft === null || quizCompleted || isBlocked) return;
    if (timeLeft <= 0) {
      if (!quizCompleted) {
        handleQuizSubmit();
      }
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, quizCompleted, isBlocked]);

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
      onQuizComplete();
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
    return (
      <div className="p-4 border rounded bg-white">
        <h3 className="text-lg font-bold mb-2">Résultat du quiz</h3>
        <p>Score : <b>{result.score}%</b> ({result.passed ? 'Réussi' : 'Non réussi'})</p>
        <ul className="mt-2">
          {result.questionsAsked.map((q, idx) => (
            <li key={idx} className={q.isCorrect ? 'text-green-600' : 'text-red-600'}>
              Q{idx + 1}. {q.questionText} <br />
              <span className="text-xs">Votre réponse : {typeof q.selectedAnswerIndex === 'number' ? q.options[q.selectedAnswerIndex] : 'Non répondu'} | Bonne réponse : {q.options[q.correctAnswerIndex]}</span>
            </li>
          ))}
        </ul>
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