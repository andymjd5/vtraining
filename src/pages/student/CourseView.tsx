import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../lib/firebase';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Progress } from '../../components/ui/Progress';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';

import { 
  CheckCircle, 
  Clock, 
  BookOpen, 
  ArrowLeft,
  PlayCircle,
  Users,
  Star,
  Award
} from 'lucide-react';

const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message)
};

interface Chapter {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  description?: string;
  completed?: boolean;
}

interface Instructor {
  name: string;
  avatarUrl?: string;
  bio?: string;
  title?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  videoUrl: string;
  instructor: Instructor;
  chapters?: Chapter[];
  enrolledCount?: number;
  rating?: number;
  createdAt: any;
}

interface UserProgress {
  courseId: string;
  completedChapters: string[];
  currentChapter: string;
  progressPercentage: number;
  lastAccessedAt: any;
}

export default function CourseView() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);

  useEffect(() => {
    if (courseId && user) {
      loadCourseData();
      loadUserProgress();
    }
  }, [courseId, user]);

  const loadCourseData = async () => {
    if (!courseId) return;
    
    try {
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (courseDoc.exists()) {
        const courseData = { id: courseDoc.id, ...courseDoc.data() } as Course;
        setCourse(courseData);
        
        // Set first chapter as current if available
        if (courseData.chapters && courseData.chapters.length > 0) {
          setCurrentChapter(courseData.chapters[0]);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du cours:', error);
      toast.error('Erreur lors du chargement du cours');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    if (!user?.uid || !courseId) return;
    
    try {
      const progressDoc = await getDoc(doc(db, 'userProgress', `${user.uid}_${courseId}`));
      if (progressDoc.exists()) {
        setUserProgress(progressDoc.data() as UserProgress);
      } else {
        // Initialize progress
        const initialProgress: UserProgress = {
          courseId: courseId,
          completedChapters: [],
          currentChapter: course?.chapters?.[0]?.id || '',
          progressPercentage: 0,
          lastAccessedAt: new Date()
        };
        setUserProgress(initialProgress);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des progrès:', error);
    }
  };

  const markChapterComplete = async (chapterId: string) => {
    if (!user?.uid || !course || !userProgress || !courseId) return;

    try {
      const updatedCompletedChapters = [...userProgress.completedChapters];
      if (!updatedCompletedChapters.includes(chapterId)) {
        updatedCompletedChapters.push(chapterId);
      }

      const progressPercentage = Math.round(
        (updatedCompletedChapters.length / (course.chapters?.length || 1)) * 100
      );

      const updatedProgress: UserProgress = {
        ...userProgress,
        completedChapters: updatedCompletedChapters,
        progressPercentage,
        lastAccessedAt: new Date()
      };

      await setDoc(doc(db, 'userProgress', `${user.uid}_${courseId}`), updatedProgress);
      setUserProgress(updatedProgress);

      toast.success('Chapitre terminé !');

      // Move to next chapter if available
      const currentIndex = course.chapters?.findIndex(ch => ch.id === chapterId) || 0;
      if (course.chapters && currentIndex < course.chapters.length - 1) {
        setCurrentChapter(course.chapters[currentIndex + 1]);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des progrès:', error);
      toast.error('Erreur lors de la sauvegarde des progrès');
    }
  };

  const selectChapter = (chapter: Chapter) => {
    setCurrentChapter(chapter);
    setVideoLoading(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du cours...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cours non trouvé</h2>
          <Button onClick={() => navigate('/student/dashboard')}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/student/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{course.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {course.duration}
                  </span>
                  <Badge variant="secondary">{course.level}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userProgress && (
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    Progression: {userProgress.progressPercentage}%
                  </div>
                  <Progress value={userProgress.progressPercentage} className="w-32" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video Player */}
            <Card>
              <CardContent className="p-0">
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  {currentChapter?.videoUrl || course.videoUrl ? (
                    <div className="relative w-full h-full">
                      {videoLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                          <div className="text-center text-white">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                            <p>Chargement de la vidéo...</p>
                          </div>
                        </div>
                      )}
                      <video
                        controls
                        className="w-full h-full"
                        onLoadStart={() => setVideoLoading(true)}
                        onCanPlay={() => setVideoLoading(false)}
                        src={currentChapter?.videoUrl || course.videoUrl}
                      >
                        Votre navigateur ne supporte pas les vidéos HTML5.
                      </video>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-white">
                        <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">Vidéo Introductive</h3>
                        <p className="opacity-75">Présentation du cours</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Course Content Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="content">Contenu</TabsTrigger>
                <TabsTrigger value="instructor">Instructeur</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Description du cours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{course.description}</p>
                    <div className="flex items-center space-x-6 mt-6 pt-6 border-t">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {course.enrolledCount || 0} étudiants inscrits
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-400" />
                        <span className="text-sm text-gray-600">
                          {course.rating ? `${course.rating}/5` : 'Pas encore noté'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Contenu du cours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentChapter ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{currentChapter.title}</h3>
                          <Button 
                            onClick={() => markChapterComplete(currentChapter.id)}
                            disabled={userProgress?.completedChapters.includes(currentChapter.id)}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600"
                          >
                            {userProgress?.completedChapters.includes(currentChapter.id) ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Terminé
                              </>
                            ) : (
                              <>
                                <Award className="h-4 w-4 mr-2" />
                                Terminer cette leçon
                              </>
                            )}
                          </Button>
                        </div>
                        {currentChapter.description && (
                          <p className="text-gray-700">{currentChapter.description}</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Contenu du cours en cours de préparation</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="instructor" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={course.instructor.avatarUrl} />
                        <AvatarFallback className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                          {getInitials(course.instructor.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {course.instructor.name}
                        </h3>
                        {course.instructor.title && (
                          <p className="text-indigo-600 font-medium">{course.instructor.title}</p>
                        )}
                        {course.instructor.bio && (
                          <p className="text-gray-700 mt-3 leading-relaxed">
                            {course.instructor.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Course Navigation */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Plan du cours</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {course.chapters && course.chapters.length > 0 ? (
                  <div className="space-y-1">
                    {course.chapters.map((chapter, index) => {
                      const isCompleted = userProgress?.completedChapters.includes(chapter.id);
                      const isCurrent = currentChapter?.id === chapter.id;
                      
                      return (
                        <button
                          key={chapter.id}
                          onClick={() => selectChapter(chapter)}
                          className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            isCurrent ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                isCompleted 
                                  ? 'bg-green-100 text-green-700' 
                                  : isCurrent 
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-gray-100 text-gray-600'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  index + 1
                                )}
                              </div>
                              <div>
                                <div className={`font-medium ${isCurrent ? 'text-indigo-900' : 'text-gray-900'}`}>
                                  {chapter.title}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {chapter.duration}
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Pas de chapitres disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Summary */}
            {userProgress && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Votre progression</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progression globale</span>
                        <span>{userProgress.progressPercentage}%</span>
                      </div>
                      <Progress value={userProgress.progressPercentage} />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{userProgress.completedChapters.length} sur {course.chapters?.length || 0} chapitres terminés</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}