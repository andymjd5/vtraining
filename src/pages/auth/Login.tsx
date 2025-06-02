import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';

const Login = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { login, getDashboardPath } = useAuth();
  const { success, error: toastError, info, warning } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const companies: Record<string, { name: string; logo: string }> = {
    'fonarev': { name: 'FONAREV', logo: '/partners/fonarev.png' },
    'unikin': { name: 'UNIKIN', logo: '/partners/unikin.png' },
    'vision26': { name: 'VISION 26', logo: '/partners/vision26.png' },
    'pnjt': { name: 'PNJT', logo: '/partners/pnjt.png' },
    'besdu': { name: 'BESDU', logo: '/partners/besdu.png' },
  };
  
  const companyInfo = companyId ? companies[companyId] : null;
  const companyName = companyInfo?.name || 'Entreprise';
  const logoPath = companyInfo?.logo || '/vtlogo.png';

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    await login(email, password);
    const dashboardPath = getDashboardPath();
    navigate(dashboardPath);

    // Notification de succès
    success('Connexion réussie ! Bienvenue sur votre tableau de bord.');

  } catch (error) {
    console.error('Login error:', error);
    setError('Identifiants incorrects. Veuillez réessayer.');

    // Notification d’erreur
    toastError('Erreur de connexion : identifiants incorrects.');

    setIsLoading(false);
  }
};

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <img 
              src={logoPath}
              alt={`${companyName} Logo`}
              className="h-16 w-auto mx-auto mb-6"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/vtlogo.png';
              }}
            />
            <h1 className="text-2xl font-bold text-gray-900">
              Connexion - {companyName}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Entrez votre identifiant pour accéder dans votre compte
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-error-50 text-error-700 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="votre.email@exemple.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <div className="mt-1 text-right">
                  <a href="#" className="text-sm text-primary-600 hover:text-primary-500">
                    Mot de passe oublié ?
                  </a>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isLoading}
                >
                  Se connecter
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Choisir une autre entreprise
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;