import React, { useState } from 'react';
import { Search, BookOpen, Scale, Brain, Monitor, Globe, ChevronDown, ChevronUp } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
}

const CoursesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const courses: Course[] = [
    // Droit
    {
      id: '1',
      title: 'Droits Humains',
      category: 'Droit',
      description: 'Formation complète sur les droits fondamentaux et leur application.',
      icon: <Scale className="h-6 w-6" />,
      details: [
        'Introduction aux Droits de l\'Homme (Déclaration universelle & Principes fondamentaux)',
        'Introduction aux Droits de l\'Homme II (types de droits : civil, politiques, économiques, sociaux et culturels)',
        'Droit international des droits de l\'homme',
        'Traités et Résolutions de l\'ONU (Histoire des Nations Unies, Systèmes Régionaux)',
        'Accords Internationaux de droits de l\'homme'
      ]
    },
    {
      id: '2',
      title: 'Droit International Humanitaire',
      category: 'Droit',
      description: 'Comprendre les règles du droit international en situation de conflit.',
      icon: <Scale className="h-6 w-6" />,
      details: [
        'Introduction au Droit humanitaire (Histoire et Principes fondamentaux, distinction entre DIH et DH)',
        'Droit des réfugiés',
        'Conventions de Genève (droit coutumier humanitaire, convention sur les armes chimiques, mines et antipersonnel, Rôle du CICR)',
        'Typologie des conflits armés (Conflits armés internationaux et nationaux)',
        'Protection des personnes (civils, blessés, malades, naufragés, personnel humanitaire et médical)'
      ]
    },
    {
      id: '3',
      title: 'Justice Transitionnelle',
      category: 'Droit',
      description: 'Mécanismes de transition vers la paix et la réconciliation.',
      icon: <Scale className="h-6 w-6" />,
      details: [
        'Introduction à la Justice Transitionnelle (Histoire et objectifs)',
        'Les quatre piliers de la Justice Transitionnelle (la Vérité, la Justice, les Réparations et les garanties de non-répétition)',
        'Approches comparées et études de cas (Rwanda, Afrique du Sud, Colombie, Sierra Leone, Bosnie, Argentine)',
        'Genre et Justice Transitionnelle (impacts différenciés des conflits sur les femmes)',
        'Justice transitionnelle, victimes et société civile (Rôle des victimes et des ONG, justice communautaire et approches mixtes)',
        'Mémoires collectives et justice réparatrice (Santé mentale, traitement de la mémoire, réconciliation)',
        'Médiation & Résolution des conflits'
      ]
    },
    // Psychologie
    {
      id: '4',
      title: 'Accompagnement Psychologique',
      category: 'Psychologie',
      description: 'Techniques d\'accompagnement et de soutien psychologique.',
      icon: <Brain className="h-6 w-6" />,
      details: [
        'Introduction à la psychologie du trauma (Concepts clés, Stress, traumatisme, résilience, formes de traumatismes individuels & collectifs, notion de choc psychologique et de trouble de stress post-traumatique)',
        'Approches théoriques du traumatisme',
        'Techniques et outils d\'accompagnement psychologique (soutien psychologique à travers l\'écoute & dramathérapie, musicothérapie, Art-Thérapie, thérapie narrative et de la reconstruction du sens, Thérapie Cognitivo-Comportementale TCC, intervention urgente)',
        'Pratiques spécifiques selon le type de victime (victimes de conflit armé et de génocide, victimes de catastrophe naturelle, victime de violence sexuelle liée au conflit armé)'
      ]
    },
    // Informatique
    {
      id: '5',
      title: 'Informatique (Initiation + Bureautique)',
      category: 'Informatique',
      description: 'Bases de l\'informatique et maîtrise des outils bureautiques.',
      icon: <Monitor className="h-6 w-6" />,
      details: [
        'Cybersécurité (Introduction générale)',
        'Protection des données personnelles (Phishing, Ransomware, Malware, Attaque par force brute, Cryptographie, Gestion de mot de passe)',
        'Technique de saisie et de mise en page (Word, Excel & PowerPoint)'
      ]
    },
    {
      id: '6',
      title: 'Informatique Avancée',
      category: 'Informatique',
      description: 'Power BI, Excel avancé, WordPress et outils professionnels.',
      icon: <Monitor className="h-6 w-6" />,
      details: [
        'Power BI et analyse de données',
        'Excel avancé (fonctions complexes, tableaux croisés dynamiques)',
        'WordPress (création et gestion de sites web)',
        'Outils professionnels avancés'
      ]
    },
    // Langues
    {
      id: '7',
      title: 'Anglais Professionnel',
      category: 'Langues',
      description: 'Perfectionnez votre anglais dans un contexte professionnel.',
      icon: <Globe className="h-6 w-6" />,
      details: [
        'Formation de base (niveau I)',
        'Formation de base (niveau II)',
        'Formation avancée (niveau III)',
        'Anglais administratif',
        'Anglais commercial (Affaires)',
        'Anglais pour le voyage'
      ]
    }
  ];

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = ['Droit', 'Psychologie', 'Informatique', 'Langues'];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Droit':
        return <Scale className="h-8 w-8 text-red-600" />;
      case 'Psychologie':
        return <Brain className="h-8 w-8 text-red-600" />;
      case 'Informatique':
        return <Monitor className="h-8 w-8 text-red-600" />;
      case 'Langues':
        return <Globe className="h-8 w-8 text-red-600" />;
      default:
        return <BookOpen className="h-8 w-8 text-red-600" />;
    }
  };

  const toggleCourseDetails = (courseId: string) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  const CourseCard = ({ course }: { course: Course }) => {
    const isExpanded = expandedCourse === course.id;
    
    return (
      <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        <div 
          className="p-6 cursor-pointer"
          onClick={() => toggleCourseDetails(course.id)}
        >
          <div className="flex items-start space-x-4">
            <div className="text-red-600 mt-1">
              {course.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {course.description}
                  </p>
                </div>
                <div className="ml-4 text-red-600">
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>
              <div className="text-xs text-red-600 font-medium">
                Cliquez pour voir le programme détaillé
              </div>
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <div className="border-t border-gray-200 bg-white">
            <div className="p-6">
              <h4 className="text-md font-semibold text-gray-800 mb-4">
                Programme de formation :
              </h4>
              <ul className="space-y-3">
                {course.details.map((detail, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm leading-relaxed">
                      {detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Nos Formations
          </h1>
          <p className="text-xl text-red-100 max-w-3xl mx-auto">
            Découvrez notre catalogue complet de formations professionnelles 
            conçues pour développer vos compétences et faire progresser votre carrière.
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher une formation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
            />
          </div>
          <div className="text-center mt-4 text-sm text-gray-600">
            💡 Cliquez sur une formation pour voir son programme détaillé
          </div>
        </div>

        {/* Courses by Category */}
        {searchTerm === '' ? (
          // Display by categories when no search
          <div className="space-y-12">
            {categories.map((category) => {
              const categoryIcon = getCategoryIcon(category);
              const categoryCourses = courses.filter(course => course.category === category);
              
              return (
                <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gray-100 px-8 py-6 border-b">
                    <div className="flex items-center space-x-4">
                      {categoryIcon}
                      <h2 className="text-2xl font-bold text-gray-800">{category}</h2>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryCourses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Display search results
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Résultats de recherche ({filteredCourses.length})
            </h2>
            {filteredCourses.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <div key={course.id}>
                    <div className="text-sm text-red-600 font-medium mb-2">
                      {course.category}
                    </div>
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Aucune formation ne correspond à votre recherche.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-red-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à commencer votre formation ?
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-3xl mx-auto">
            Rejoignez nos autres partenaires et perfectionnez vos compétences 
            avec notre programme d'apprentissage professionnel en ligne.
          </p>
          <a
            href="/select-company"
            className="inline-block bg-gray-800 hover:bg-gray-900 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 text-lg"
          >
            S'identifier maintenant
          </a>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;