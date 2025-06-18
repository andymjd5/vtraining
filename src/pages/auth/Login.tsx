import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, Building2, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useParams } from 'react-router-dom';

// IMPORT DU TABLEAU STATIQUE - SOLUTION PROPRE
import { companies } from '../../lib/companies'; // Ajustez le chemin

// Types
interface Company {
  id: string;
  name: string;
  logoUrl: string;
  domain?: string;
  slug?: string;
}

// Composant Button (inchangé)
const Button: React.FC<{
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary";
  className?: string;
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ type = "button", variant = "primary", className = "", isLoading = false, disabled = false, children, onClick }) => {
  const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center";
  const variantClasses = variant === "primary" 
    ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400" 
    : "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100";
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="animate-spin h-4 w-4 mr-2" />
      ) : null}
      {children}
    </button>
  );
};

// COMPOSANT CORRIGÉ - Utilise le tableau statique
const CompanySelector: React.FC<{
  onCompanySelect: (company: Company) => void;
  error?: string;
}> = ({ onCompanySelect, error }) => {
  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <div className="text-center mb-6">
          <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">
            Sélectionner votre entreprise
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Choisissez l'entreprise à laquelle vous appartenez
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-3">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => onCompanySelect(company)}
              className="w-full p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200 flex items-center"
            >
              <img
                src={company.logoUrl}
                alt={`${company.name} Logo`}
                className="h-10 w-10 object-contain mr-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `data:image/svg+xml;base64,${btoa(`<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="#3B82F6"/><text x="20" y="26" font-family="Arial" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${company.name[0]}</text></svg>`)}`;
                }}
              />
              <div className="text-left">
                <h3 className="font-medium text-gray-900">{company.name}</h3>
              </div>
            </button>
          ))}
        </div>

        {companies.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune entreprise disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant Login principal (reste identique sauf CompanySelector)
interface LoginProps {
  onCompanyChange?: () => void;
}

const Login: React.FC<LoginProps> = ({ onCompanyChange }) => {
  const { companyId } = useParams<{ companyId: string }>();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [showCompanySelector, setShowCompanySelector] = useState(false);

  // Récupération de l'entreprise au chargement - CORRIGÉ
  useEffect(() => {
    const loadCompany = async () => {
      if (!companyId) {
        setShowCompanySelector(true);
        setIsLoadingCompany(false);
        return;
      }

      try {
        // Chercher d'abord dans le tableau statique
        const foundCompany = companies.find(c => c.id === companyId);
        if (foundCompany) {
          setCompany(foundCompany);
          setIsLoadingCompany(false);
          return;
        }

        // Si pas trouvé dans le tableau statique, essayer Firestore (nécessite auth)
        // Cette partie ne fonctionnera que si l'utilisateur est déjà connecté
        if (auth.currentUser) {
          const companyDoc = await getDoc(doc(db, 'companies', companyId));
          if (companyDoc.exists()) {
            const companyData = {
              id: companyDoc.id,
              ...companyDoc.data()
            } as Company;
            setCompany(companyData);
          } else {
            setError('Entreprise non trouvée');
            setShowCompanySelector(true);
          }
        } else {
          setError('Entreprise non trouvée dans la liste disponible');
          setShowCompanySelector(true);
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement de l\'entreprise:', err);
        setError('Erreur lors du chargement de l\'entreprise');
        setShowCompanySelector(true);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    loadCompany();
  }, [companyId]);

  const handleCompanySelect = (selectedCompany: Company) => {
    setCompany(selectedCompany);
    setShowCompanySelector(false);
    setError('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!company) return;
    
    setError('');
    setIsLoading(true);

    try {
      // 1. Authentification Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 2. Lecture du user Firestore (maintenant possible car l'utilisateur est authentifié)
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error("Profil utilisateur introuvable.");
      }

      const userData = userDoc.data();
      
      // 3. Contrôle de la cohérence entreprise
      if (userData.companyId !== company.id) {
        await signOut(auth);
        throw new Error(
          `Ce compte n'appartient pas à l'entreprise ${company.name}. Veuillez réessayer avec le bon identifiant.`
        );
      }

      // 4. Redirection ou callback de succès
      console.log('Connexion réussie pour', userData);
      // window.location.href = '/dashboard';

    } catch (err: any) {
      setError(err.message || 'Erreur de connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  // Affichage du loader pendant le chargement de l'entreprise
  if (isLoadingCompany) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  // Affichage du sélecteur d'entreprise
  if (showCompanySelector || !company) {
    return (
      <CompanySelector 
        onCompanySelect={handleCompanySelect}
        error={error}
      />
    );
  }

  // Affichage du formulaire de connexion (reste identique)
  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
          <div className="text-center mb-8">
            <img
              src={company.logoUrl}
              alt={`${company.name} Logo`}
              className="h-16 w-auto mx-auto mb-6"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `data:image/svg+xml;base64,${btoa(`<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="12" fill="#3B82F6"/><text x="32" y="40" font-family="Arial" font-size="24" font-weight="bold" fill="white" text-anchor="middle">${company.name[0]}</text></svg>`)}`;
              }}
            />
            <h1 className="text-2xl font-bold text-gray-900">
              Connexion - {company.name}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Entrez vos identifiants pour accéder à votre espace de formation
            </p>
            <button
              type="button"
              onClick={() => setShowCompanySelector(true)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
            >
              <Building2 className="h-4 w-4 mr-1" />
              Changer d'entreprise
            </button>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="votre.email@exemple.com"
                disabled={isLoading}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                disabled={!email || !password}
              >
                Se connecter
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;