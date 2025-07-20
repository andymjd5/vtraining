import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock, CheckCircle } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simuler l'envoi du formulaire
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset après 3 secondes
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Message envoyé !</h2>
          <p className="text-gray-600">Merci pour votre message. Nous vous répondrons dans les plus brefs délais.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Contactez-nous</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-2xl mx-auto">
            Notre équipe est là pour vous aider. N'hésitez pas à nous contacter pour toute question concernant nos formations.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations de contact */}
          <div className="lg:col-span-1 space-y-6">
            {/* Coordonnées principales */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <Mail className="h-4 w-4 text-red-600" />
                </div>
                Nos coordonnées
              </h2>
              
              <div className="space-y-6">
                {/* Emails */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Adresses email</h3>
                  <div className="space-y-2">
                    <a 
                      href="mailto:contact@visiontraining.cd" 
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors group"
                    >
                      <Mail className="h-4 w-4 text-red-600 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700 group-hover:text-red-700">
                        contact@visiontraining.cd
                      </span>
                    </a>
                    <a 
                      href="mailto:vision.training.rdc@gmail.com" 
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors group"
                    >
                      <Mail className="h-4 w-4 text-red-600 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700 group-hover:text-red-700 break-all">
                        vision.training.rdc@gmail.com
                      </span>
                    </a>
                  </div>
                </div>

                {/* Téléphone */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Téléphones</h3>
                  <div className="space-y-2">
                    <a 
                      href="tel:+243995900200" 
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors group"
                    >
                      <Phone className="h-4 w-4 text-red-600 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700 group-hover:text-red-700">
                        +243 995 900 200
                      </span>
                    </a>
                    <a 
                      href="tel:+243824503705" 
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors group"
                    >
                      <Phone className="h-4 w-4 text-red-600 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700 group-hover:text-red-700">
                        +243 824 503 705
                      </span>
                    </a>
                  </div>
                </div>

                {/* Adresse */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Adresse</h3>
                  <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-4 w-4 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700 leading-relaxed">
                      29 Avenue Canivaux<br />
                      Quartier Funa1, C/Barumbu<br />
                      Kinshasa, RD Congo
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Heures d'ouverture */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                Heures d'ouverture
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Lundi - Vendredi</span>
                  <span className="font-semibold text-gray-900">8:00 - 18:00</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Samedi</span>
                  <span className="font-semibold text-gray-900">9:00 - 14:00</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Dimanche</span>
                  <span className="font-semibold text-red-600">Fermé</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire de contact */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <Send className="h-4 w-4 text-red-600" />
                </div>
                Envoyez-nous un message
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Votre nom complet"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Adresse email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    Sujet *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="Objet de votre message"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                    placeholder="Décrivez votre demande en détail..."
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none sm:px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 focus:ring-4 focus:ring-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-3"></div>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer le message
                      </>
                    )}
                  </button>
                  
                  <p className="text-xs text-gray-500 flex items-center">
                    * Champs obligatoires
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;