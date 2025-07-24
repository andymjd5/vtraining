import React from 'react';
import Card from '../ui/Card';
import { BookOpen, Clock, User, Play, CheckCircle, Star } from 'lucide-react';
import type { EnrichedCourse } from '../../types/course';
import { useCourseProgress } from '../../hooks/useCourseProgress';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';

interface CourseCardProps {
  course: EnrichedCourse;
  onClick: (course: EnrichedCourse) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
  // Utilitaires locaux copiés de Courses.tsx si besoin
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };
  const [user] = useAuthState(auth);
  const { progressPercentage } = useCourseProgress(user?.uid || '', course.id || '')

  return (
    <div onClick={() => onClick(course)} className="group block cursor-pointer">
      <Card className="h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden bg-white">
        {/* Image/Thumbnail */}
        <div className="relative h-48 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 overflow-hidden">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-white opacity-70" />
            </div>
          )}

          {/* Badges sur l'image */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${course.level === 'Débutant' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : course.level === 'Intermédiaire' ? 'bg-amber-100 text-amber-700 border-amber-200' : course.level === 'Avancé' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>{course.level}</span>
            {course.status_user === 'completed' && (
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Terminé
              </span>
            )}
          </div>

          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white bg-opacity-90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Play className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Titre et catégorie */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                {course.title}
              </h3>
            </div>

            {course.category && (
              <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {course.category.name}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {course.description}
          </p>

          {/* Statistiques */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {course.chaptersCount || 0} chapitres
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {course.estimatedDuration || course.duration}min
            </div>
            {course.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-current text-yellow-400" />
                {course.rating.toFixed(1)}
              </div>
            )}
          </div>

          {/* Instructeur */}
          {course.instructor && (
            <div className="flex items-center gap-3">
              {course.instructor.photoUrl ? (
                <img
                  src={course.instructor.photoUrl}
                  alt={course.instructor.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-100"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">{course.instructor.name}</div>
                <div className="text-xs text-gray-500">{course.instructor.title}</div>
              </div>
            </div>
          )}

          {/* Progression */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Progression</span>
              <span className="text-sm font-bold text-blue-600">{progressPercentage || 0}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage || 0}%` }}
              />
            </div>
          </div>

          {/* Action et statut */}
          <div className="flex justify-between items-center pt-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(course.status_user || 'not-started')}`}>
              {course.status_user === 'completed' ? 'Terminé' :
                course.status_user === 'in-progress' ? 'En cours' :
                  'Commencer'}
            </span>
            <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-800 flex items-center gap-1">
              {course.status_user === 'completed' ? 'Revoir' :
                course.status_user === 'in-progress' ? 'Continuer' :
                  'Commencer'}
              <Play className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CourseCard; 