import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { companies } from '../../lib/companies';

// Tableau statique des entreprises (tu peux l’importer d’un fichier à part si tu veux)
export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
}

const CompanySelection = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Company | null>(null);
  const [queryText, setQueryText] = useState('');

  // Recherche dynamique sur le nom de l'entreprise
  const filteredCompanies =
    queryText === ''
      ? companies
      : companies.filter((company) =>
          company.name.toLowerCase().replace(/\s+/g, '').includes(queryText.toLowerCase().replace(/\s+/g, ''))
        );

  const handleContinue = () => {
    if (selected) {
      // On passe l’id en paramètre à la page de login (adaptable selon ton router)
      navigate(`/login/${selected.id}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card elevated>
          <div className="p-6 sm:p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                Sélectionnez votre entreprise
              </h3>
              <p className="text-gray-600 text-base max-w-xl mx-auto">
                Pour accéder à votre espace de formation, veuillez sélectionner
                votre entreprise dans la liste ci-dessous.
              </p>
            </div>

            <div className="w-full max-w-xl mx-auto space-y-6">
              <div className="relative">
                <input
                  className="w-full py-3 px-4 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-30 transition-all duration-200"
                  type="text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Rechercher une entreprise..."
                />
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredCompanies.length === 0 ? (
                  <div className="col-span-2 text-center text-gray-500 py-6">
                    Aucune entreprise trouvée.
                  </div>
                ) : (
                  filteredCompanies.map((company) => (
                    <div
                      key={company.id}
                      onClick={() => setSelected(company)}
                      className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selected?.id === company.id
                          ? 'border-primary-500 bg-primary-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <img
                        src={company.logoUrl || '/vtlogo.png'}
                        alt={`${company.name} logo`}
                        className="w-10 h-10 object-contain flex-shrink-0 rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/vtlogo.png';
                        }}
                      />
                      <span className="font-medium text-gray-900 flex-1">{company.name}</span>
                      {selected?.id === company.id && (
                        <Check className="text-primary-600" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <Button
                onClick={handleContinue}
                disabled={!selected}
                className="w-full py-3 text-base font-medium bg-red-600 hover:bg-red-700 text-white"
              >
                Continuer
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default CompanySelection;
