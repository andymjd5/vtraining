import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Award, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Partners from '../components/sections/Partners';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: 'https://images.pexels.com/photos/4778664/pexels-photo-4778664.jpeg',
      alt: 'Students watching a course projected on a large wall screen'
    },
    {
      image: 'https://images.pexels.com/photos/5905710/pexels-photo-5905710.jpeg',
      alt: 'People using various devices for online learning'
    },
    {
      image: 'https://images.pexels.com/photos/5905555/pexels-photo-5905555.jpeg',
      alt: 'People studying in different environments'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerChildren = {
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-primary-600" />,
      title: 'Formations Spécialisées',
      description: 'Accédez à des cours spécialisés dans les domaines des droits humains, justice transitionnelle et plus.'
    },
    {
      icon: <Award className="h-8 w-8 text-primary-600" />,
      title: 'Certification Officielle',
      description: 'Obtenez des certificats reconnus attestant de vos compétences acquises.'
    },
    {
      icon: <Users className="h-8 w-8 text-primary-600" />,
      title: 'Gestion Multi-Entreprises',
      description: 'Plateforme adaptée aux besoins spécifiques de chaque entreprise partenaire.'
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary-600" />,
      title: 'Événements & Webinaires',
      description: 'Participez à des événements en ligne pour approfondir vos connaissances.'
    },
  ];

  const categories = [
    { name: 'Droits Humains', path: '/courses/human-rights', image: 'https://images.pexels.com/photos/6249543/pexels-photo-6249543.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { name: 'Droit International Humanitaire', path: '/courses/humanitarian-law', image: 'https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { name: 'Justice Transitionnelle', path: '/courses/transitional-justice', image: 'https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { name: 'Accompagnement Psychologique', path: '/courses/psychological-support', image: 'https://images.pexels.com/photos/7176319/pexels-photo-7176319.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { name: 'Informatique', path: '/courses/computer-science', image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { name: 'Anglais', path: '/courses/english', image: 'https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg?auto=compress&cs=tinysrgb&w=600' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[600px] w-full overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full transition-opacity duration-1000 ${
              currentSlide === index ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.alt}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div 
            className="text-center w-full px-4 sm:px-0"
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-white mb-2"
              variants={fadeIn}
            >
              Formation
            </motion.h1>
            <motion.h2 
              className="text-4xl md:text-6xl font-bold text-white mb-6"
              variants={fadeIn}
            >
              Professionnelle
            </motion.h2>
            <motion.p 
              className="text-lg md:text-xl mb-8 text-white/90 max-w-3xl mx-auto"
              variants={fadeIn}
            >
              Développez vos compétences grâce à notre programme e-learning dédié 
              aux institutions publiques, entreprises publiques, entreprises privées et pour la société civile.
            </motion.p>
            <motion.div variants={fadeIn}>
              <Link to="/login">
                <Button 
                  size="lg" 
                  variant="secondary"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                  className="max-w-[280px] w-full sm:w-auto font-semibold text-lg px-6 sm:px-8 py-3"
                >
                  Commencer votre formation
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentSlide === index ? 'bg-white w-6' : 'bg-white/50'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Nos fonctionnalités clés</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez les outils qui rendront votre apprentissage plus efficace et agréable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full flex flex-col">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 flex-grow">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Catégories de Formations</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Explorez nos différentes catégories de formations spécialisées.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Link to={category.path} className="block h-full">
                  <div className="rounded-lg overflow-hidden shadow-md h-full bg-white hover:shadow-lg transition-shadow">
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={category.image} 
                        alt={category.name} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                      <div className="flex items-center text-primary-600 font-medium">
                        <span>Explorer les cours</span>
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <Partners />

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Prêt à commencer votre formation ?</h2>
            <p className="text-lg mb-8 text-white/90">
              Rejoignez nos autres partenaires et perfectionnez vos compétences avec notre programme d'apprentissage professionnel en ligne.
            </p>
            <Link to="/login">
              <Button 
                size="lg" 
                variant="secondary"
                className="max-w-[280px] w-full sm:w-auto font-semibold"
              >
                S'identifier maintenant
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;