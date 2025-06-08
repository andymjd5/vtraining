import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  chapters?: string[];
}

const QuizView: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // États principaux
  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes en secondes
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Récupération des données du cours
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
        } else {
          setError('Cours non trouvé');
        }
      } catch (err) {
        setError('Erreur lors du chargement du cours');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // Génération du quiz via API DeepSeek
  useEffect(() => {
    const generateQuiz = async () => {
      if (!course) return;
      
      setIsGeneratingQuiz(true);
      
      try {
        const content = course.chapters ? course.chapters.join('\n') : course.description;
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: 'Tu es un assistant qui génère des quiz éducatifs. Réponds uniquement avec un JSON valide contenant un tableau de 5 questions à choix multiples.'
              },
              {
                role: 'user',
                content: `Génère un quiz de 5 questions à choix multiples basé sur ce contenu de cours. Chaque question doit avoir 4 options et une réponse correcte (index 0-3). Format JSON requis:
[
  {
    "question": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "answer": 0
  }
]

Contenu du cours:
${content}`
              }
            ],
            temperature: 0.8,
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          throw new Error('Erreur API DeepSeek');
        }

        const data = await response.json();
        const quizData = JSON.parse(data.choices[0].message.content);
        
        setQuestions(quizData);
        setSelectedAnswers(new Array(quizData.length).fill(-1));
      } catch (err) {
        setError('Erreur lors de la génération du quiz');
        console.error(err);
      } finally {
        setIsGeneratingQuiz(false);
      }
    };

    if (course && !isGeneratingQuiz && questions.length === 0) {
      generateQuiz();
    }
  }, [course]);

  // Chronomètre
  useEffect(() => {
    if (timeLeft <= 0 && !quizCompleted) {
      handleQuizEnd();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quizCompleted]);

  // Formatage du temps
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Gestion des réponses
  const handleAnswerSelect = (answerIndex: number) => {
    if (quizCompleted || timeLeft <= 0) return;
    
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  // Navigation entre questions
  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  // Fin du quiz
  const handleQuizEnd = () => {
    const correctAnswers = questions.reduce((acc, question, index) => {
      return selectedAnswers[index] === question.answer ? acc + 1 : acc;
    }, 0);
    
    setScore(correctAnswers);
    setQuizCompleted(true);
    
    // Redirection si score < 60%
    const percentage = (correctAnswers / questions.length) * 100;
    if (percentage < 60) {
      setTimeout(() => {
        navigate(`/student/course/${courseId}`);
      }, 3000);
    }
  };

  // Écrans de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  if (isGeneratingQuiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">🧠</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Génération du Quiz</h2>
          <p className="text-gray-600">L'IA prépare vos questions personnalisées...</p>
        </div>
      </div>
    );
  }

  // Écran de résultats
  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 60;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md w-full mx-4">
          <div className={`text-6xl mb-6 ${passed ? 'text-green-500' : 'text-red-500'}`}>
            {passed ? '🎉' : '😞'}
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {passed ? 'Félicitations !' : 'Quiz Terminé'}
          </h2>
          
          <div className="mb-6">
            <div className={`text-4xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {score}/{questions.length}
            </div>
            <div className={`text-2xl font-semibold ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {percentage}%
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">
            {passed 
              ? 'Excellent travail ! Vous maîtrisez bien le sujet.'
              : 'Vous devez réviser le cours avant de continuer. Redirection en cours...'
            }
          </p>
          
          {passed && (
            <button
              onClick={() => navigate('/student/dashboard')}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Retour au tableau de bord
            </button>
          )}
          
          {!passed && (
            <div className="text-sm text-gray-500">
              Redirection automatique vers le cours dans 3 secondes...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Interface principale du quiz
  const currentQ = questions[currentQuestion];
  const isTimeUp = timeLeft <= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header avec titre et chronomètre */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🧠 Quiz - {course?.title}
              </h1>
              <p className="text-gray-600">
                Testez vos connaissances sur ce cours
              </p>
            </div>
            
            <div className={`text-right ${isTimeUp ? 'text-red-700' : 'text-red-600'}`}>
              <div className="text-lg font-semibold mb-1">⏱️ Temps restant</div>
              <div className={`text-3xl font-bold ${isTimeUp ? 'animate-pulse' : ''}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        {/* Message temps écoulé */}
        {isTimeUp && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⏱️</span>
              <div>
                <div className="font-bold">Temps écoulé !</div>
                <div>Le quiz est terminé. Calcul du score en cours...</div>
              </div>
            </div>
          </div>
        )}

        {/* Question actuelle */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm font-semibold text-gray-500">
              Question {currentQuestion + 1} sur {questions.length}
            </div>
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
            {currentQ?.question}
          </h2>

          <div className="space-y-4">
            {currentQ?.options.map((option, index) => (
              <label
                key={index}
                className={`
                  flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${selectedAnswers[currentQuestion] === index
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                  }
                  ${isTimeUp ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !isTimeUp && handleAnswerSelect(index)}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion}`}
                  value={index}
                  checked={selectedAnswers[currentQuestion] === index}
                  onChange={() => {}}
                  className="sr-only"
                  disabled={isTimeUp}
                />
                <div className={`
                  w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center
                  ${selectedAnswers[currentQuestion] === index
                    ? 'border-red-500 bg-red-500'
                    : 'border-gray-300'
                  }
                `}>
                  {selectedAnswers[currentQuestion] === index && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="text-lg">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestion === 0 || isTimeUp}
              className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Précédent
            </button>

            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Progression</div>
              <div className="font-bold text-gray-800">
                {currentQuestion + 1} / {questions.length} questions
              </div>
            </div>

            <div className="space-x-3">
              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  disabled={isTimeUp}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant →
                </button>
              ) : (
                <button
                  onClick={handleQuizEnd}
                  disabled={isTimeUp}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  🏁 Terminer le Quiz
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bouton de sortie */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate(`/student/course/${courseId}`)}
            className="text-gray-600 hover:text-gray-800 underline transition-colors"
          >
            Quitter le quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizView;