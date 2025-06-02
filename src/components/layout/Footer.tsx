import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Mail, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Vision Training</h3>
            <p className="text-gray-300 text-sm">
              Plateforme de formation en ligne dédiée aux professionnels des entreprises partenaires.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Liens utiles</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-gray-300 hover:text-white transition-colors">
                  Formations
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-gray-300 hover:text-white transition-colors">
                  Événements
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Formations</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/courses/human-rights" className="text-gray-300 hover:text-white transition-colors">
                  Droits Humains
                </Link>
              </li>
              <li>
                <Link to="/courses/humanitarian-law" className="text-gray-300 hover:text-white transition-colors">
                  Droit International Humanitaire
                </Link>
              </li>
              <li>
                <Link to="/courses/transitional-justice" className="text-gray-300 hover:text-white transition-colors">
                  Justice Transitionnelle
                </Link>
              </li>
              <li>
                <Link to="/courses/psychological-support" className="text-gray-300 hover:text-white transition-colors">
                  Accompagnement Psychologique
                </Link>
              </li>
              <li>
                <Link to="/courses/computer-science" className="text-gray-300 hover:text-white transition-colors">
                  Informatique
                </Link>
              </li>
              <li>
                <Link to="/courses/english" className="text-gray-300 hover:text-white transition-colors">
                  Anglais
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <a href="mailto:contact@visiontraining.com" className="text-gray-300 hover:text-white transition-colors">
                  contact@visiontraining.com
                </a>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <a href="tel:+243123456789" className="text-gray-300 hover:text-white transition-colors">
                  +243 123 456 789
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} Vision Training. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;