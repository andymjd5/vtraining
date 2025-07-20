import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useCourseProgress } from '../../hooks/useCourseProgress';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/Avatar';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  User, 
  Star,
  ChevronRight,
  FileText,
  Video,
  Award,
  Target,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Course, Chapter, Section, ContentBlock, Instructor, Category } from '../../types/course';

const CoursePreview = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [instructor, setInstructor] = useState<Instructor | null>(null);

  // Vérifier la progression de l'utilisateur
  const {
    progress,
    currentChapter,
    currentSection,
    currentBlock,
    progressPercentage
  } = useCourseProgress(user?.uid || '', courseId || '');

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les données du cours
      const courseDoc = await getDoc(doc(db, 'courses', courseId!));
      if (!courseDoc.exists()) {
        setError('Cours introuvable');
        return;
      }

      const courseData = { id: courseDoc.id, ...courseDoc.data() } as Course;
      setCourse(courseData);

      // Charger la catégorie et l'instructeur si besoin
      if (courseData.categoryId) {
        const catDoc = await getDoc(doc(db, 'categories', courseData.categoryId));
        if (catDoc.exists()) setCategory({ id: catDoc.id, ...catDoc.data() } as Category);
      }
      if (courseData.instructorId) {
        const instDoc = await getDoc(doc(db, 'instructors', courseData.instructorId));
        if (instDoc.exists()) setInstructor({ id: instDoc.id, ...instDoc.data() } as Instructor);
      }

      // Récupérer les chapitres
      if (courseData.chaptersOrder && courseData.chaptersOrder.length > 0) {
        const chaptersData = await fetchChapters(courseData.chaptersOrder);
        setChapters(chaptersData as any); // Cast to any to avoid type issues with sections
      }

    } catch (error) {
      console.error('Error fetching course data:', error);
      setError('Erreur lors du chargement du cours');
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async (chaptersOrder: string[]): Promise<Chapter[]> => {
    const chaptersData: Chapter[] = [];

    for (const chapterId of chaptersOrder) {
      const chapterDoc = await getDoc(doc(db, 'chapters', chapterId));
      if (chapterDoc.exists()) {
        const chapterData = { id: chapterDoc.id, ...chapterDoc.data(), sections: [] } as Chapter & { sections: Section[] };
        
        // Récupérer les sections du chapitre
        const sectionsQuery = query(
          collection(db, 'sections'),
          where('chapterId', '==', chapterId)
        );
        const sectionsSnapshot = await getDocs(sectionsQuery);
        const sections = sectionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Section[];

        // Trier les sections par ordre
        chapterData.sections = sections.sort((a, b) => a.order - b.order);
        chaptersData.push(chapterData);
      }
    }

    return chaptersData.sort((a, b) => a.order - b.order);
  };

  const handleStartCourse = () => {
    // Toujours aller au cours (la logique de progression est gérée dans CourseView)
    navigate(`/student/courses/${courseId}`);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Débutant':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermédiaire':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Avancé':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'quiz':
        return <Award className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'aperçu du cours...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-6">{error || 'Cours introuvable'}</p>
            <Button onClick={() => navigate('/student/courses')}>
              Retour aux cours
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/student/courses')}
              variant="ghost"
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-gray-600">Aperçu du cours</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            {/* Vidéo d'introduction */}
            {course && course.videoUrl && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="aspect-video bg-black relative">
                  {!videoPlaying ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="bg-white bg-opacity-90 rounded-full p-4 mb-4 mx-auto w-16 h-16 flex items-center justify-center">
                          <Play className="h-8 w-8 text-blue-600" />
                        </div>
                        <p className="text-white text-lg font-medium">Vidéo d'introduction</p>
                      </div>
                    </div>
                  ) : null}
                  <video
                    src={course.videoUrl}
                    className="w-full h-full object-cover"
                    controls
                    onPlay={() => setVideoPlaying(true)}
                    onPause={() => setVideoPlaying(false)}
                  />
                </div>
              </div>
            )}

            {/* Description du cours */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">À propos de ce cours</h2>
              <p className="text-gray-700 leading-relaxed">{course.description}</p>
            </div>

            {/* Plan du cours */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Plan du cours</h2>
              <div className="space-y-6">
                {chapters.map((chapter, chapterIndex) => (
                  <motion.div
                    key={chapter.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: chapterIndex * 0.1 }}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {chapterIndex + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                            {chapter.description && (
                              <p className="text-sm text-gray-600">{chapter.description}</p>
                            )}
                          </div>
                        </div>
                        {chapter.hasQuiz && (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Award className="h-3 w-3 mr-1" />
                            Quiz
                          </Badge>
                        )}
                      </div>
                    </div>

                    {chapter.sections && chapter.sections.length > 0 && (
                      <div className="divide-y divide-gray-100">
                        {chapter.sections.map((section, sectionIndex) => (
                          <div key={section.id} className="px-4 py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                                  {sectionIndex + 1}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{section.title}</h4>
                                  {section.description && (
                                    <p className="text-sm text-gray-600">{section.description}</p>
                                  )}
                                </div>
                              </div>
                              {section.content && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <span>{section.content.length} éléments</span>
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CTA Principal */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">
                  {progress && progressPercentage > 0 ? 'Reprendre le cours' : 'Commencer le cours'}
                </h3>
                {progress && progressPercentage > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Progression</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-blue-500 rounded-full h-2">
                      <div
                        className="bg-white h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {/* Remplacer le bouton desktop par une version avec fond bleu et texte blanc pour plus de contraste */}
                <div className="hidden sm:block">
                  <Button
                    onClick={handleStartCourse}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold py-3"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    {progress && progressPercentage > 0 ? 'Continuer' : 'Commencer'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Informations du cours */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Informations</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Durée: {formatDuration(course.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {chapters.length} chapitres
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Niveau: {course.level}
                  </span>
                </div>
                {category && (
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Catégorie: {category.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Instructeur */}
            {instructor && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Instructeur</h3>
                <div className="flex items-center gap-3">
                  <Avatar>
                    {instructor.photoUrl ? (
                      <AvatarImage src={instructor.photoUrl} alt={instructor.name} />
                    ) : (
                      <AvatarFallback>
                        {instructor.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-gray-900">{instructor.name}</h4>
                    <p className="text-sm text-gray-600">{instructor.title}</p>
                  </div>
                </div>
                {instructor.bio && (
                  <p className="text-sm text-gray-600 mt-3">{instructor.bio}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Footer mobile CTA avec progression */}
      {course && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-4 sm:hidden flex flex-col items-center shadow-lg">
          {progress && progressPercentage > 0 && (
            <div className="w-full max-w-md mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Progression</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
          <Button
            onClick={handleStartCourse}
            className="w-full max-w-md bg-blue-600 text-white hover:bg-blue-700 font-semibold py-3 text-lg rounded-xl shadow"
          >
            <Play className="h-5 w-5 mr-2" />
            {progress && progressPercentage > 0 ? 'Continuer' : 'Commencer'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CoursePreview; 