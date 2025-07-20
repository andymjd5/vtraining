import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Share2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const EventsPage = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    { src: '/photovt1.jpg', alt: 'Cérémonie de signature - Vue d\'ensemble' },
    { src: '/photovt2.jpg', alt: 'Représentants des trois institutions' },
    { src: '/photovt3.jpg', alt: 'Signature du protocole d\'accord' },
    { src: '/photovt4.jpg', alt: 'Allocution du Recteur de l\'UNIKIN' }
  ];

  // Auto-slide every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  const upcomingEvents = [
    {
      date: '25 juillet 2025',
      title: 'Formation Leadership et Management Public',
      type: 'En ligne',
      description: 'Formation intensive sur les techniques de leadership moderne dans le secteur public.'
    },
    {
      date: '10 août 2025',
      title: 'Webinaire IA & Administration Publique',
      type: 'En ligne',
      description: 'Découvrez comment l\'intelligence artificielle transforme l\'administration publique.'
    },
    {
      date: '29 août 2025',
      title: 'Atelier Excel Avancé',
      type: 'Présentiel, Kinshasa',
      description: 'Maîtrisez les fonctionnalités avancées d\'Excel pour optimiser votre productivité.'
    },
    {
      date: '15 septembre 2025',
      title: 'Journée Portes Ouvertes Vision Training',
      type: 'UNIKIN',
      description: 'Venez découvrir notre programme et rencontrer nos formateurs experts.'
    }
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const shareEvent = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Signature du Protocole d\'Accord Tripartite - Vision Training',
        text: 'Découvrez cet événement majeur pour le renforcement des capacités en RDC',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papiers !');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link 
              to="/" 
              className="inline-flex items-center text-red-200 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Événements & Actualités
            </h1>
            <p className="text-xl text-red-100 max-w-3xl">
              Découvrez les moments forts de notre programme Vision Training et les événements 
              qui marquent notre engagement pour le développement des compétences en RDC.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Événement principal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-12"
        >
          {/* En-tête de l'événement */}
          <div className="bg-gradient-to-r from-red-50 to-red-50 px-8 py-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    13 Juin 2025
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Rectorat de l'Université de Kinshasa
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                  Signature du Protocole d'Accord Tripartite et d'une Convention de Coopération Académique
                </h2>
                <p className="text-gray-600 mt-2">
                  Entre la Société Kongo Vision Multimédias SARL (KVM), le Programme National de Justice Transitionnelle (PNJT) et l'Université de Kinshasa (UNIKIN)
                </p>
              </div>
              <button
                onClick={shareEvent}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors self-start md:self-center"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>
            </div>
          </div>

          {/* Galerie d'images */}
          <div className="px-8 py-6">
            <h3 className="text-xl font-semibold mb-4">Galerie photos</h3>
            <div className="relative mb-6">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={images[currentImageIndex].src}
                  alt={images[currentImageIndex].alt}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Contrôles du carrousel */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Indicateurs */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Légende de l'image */}
            <p className="text-sm text-gray-600 text-center mb-6 italic">
              {images[currentImageIndex].alt}
            </p>

            {/* Miniatures */}
            <div className="grid grid-cols-4 gap-2 mb-8">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex 
                      ? 'border-red-500 opacity-100' 
                      : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Description complète */}
          <div className="px-8 pb-8">
            <h3 className="text-xl font-semibold mb-4">À propos de cet événement</h3>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-4">
              <p>
                Kinshasa, le 13 Juin 2025, une étape majeure a été franchie dans le cadre d'une ambition reposant sur la stratégie nationale, celle de renforcer les capacités en République Démocratique du Congo à travers la signature officielle du Protocole d'Accord Général de Partenariat Tripartite et d'une Convention de Coopération Académique dans le cadre du Programme Vision Training.
              </p>
              
              <p>
                Cette cérémonie solennelle, organisée dans les locaux du Rectorat de l'UNIKIN, a rassemblé des représentants du secteur public ainsi que celui du secteur privé comme partenaires techniques et porteur du projet.
              </p>
              
              <p>
                Ce partenariat vise à offrir des formations innovantes et de haut niveau aux agents et cadres des secteurs public et privé, dans une optique de transformation structurelle des compétences professionnelles en RDC. Ce partenariat avec l'Université de Kinshasa, l'une des plus prestigieuses institutions d'enseignement supérieur du pays, marque une nouvelle phase dans la mise en œuvre du programme.
              </p>
              
              <p>
                Dans son allocution, le Recteur de l'UNIKIN, Professeur Docteur Jean Marie KAYEMBE NTUMBA a salué la vision stratégique de ce projet et se dit satisfait de la signature de cet accord car en associant les forces académiques à un programme de formation comme Vision Training, permet à l'université de contribuer directement à l'élévation du capital humain au cœur des actions nationales et à la consolidation d'une administration plus efficace, compétente et au service du développement.
              </p>
              
              <p>
                De son côté, le Coordinateur National du Programme National de Justice Transitionnelle (PNJT), Me Joseph KHASA MABIKA, a insisté sur la nature inclusive et durable du projet. Par ailleurs il précise que ce partenariat tripartite symbolise un engagement commun à bâtir une culture de performance, de leadership éthique et de responsabilité dans tous les secteurs de gouvernance en RDC.
              </p>
              
              <p>
                La collaboration prévoit également l'ouverture de modules de formation décentralisés, accessibles aux provinces via la plateforme e-learning Vision Training, afin de garantir une portée nationale du programme.
              </p>
              
              <blockquote className="border-l-4 border-red-500 pl-4 italic text-red-800 bg-red-50 p-4 rounded-r-lg">
                « La RDC a besoin d'agents formés, compétents et conscients de leur rôle dans le développement du pays. Ce protocole est un levier structurant pour atteindre cet objectif. »
              </blockquote>
            </div>
          </div>
        </motion.div>

        {/* Événements à venir */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Événements à venir</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    {event.date}
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {event.type}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {event.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {event.description}
                </p>
                
                <button className="mt-4 text-red-600 hover:text-red-800 font-medium text-sm transition-colors">
                  En savoir plus →
                </button>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              Restez informé de tous nos événements et formations
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-medium"
            >
              Nous contacter pour plus d'informations
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EventsPage;