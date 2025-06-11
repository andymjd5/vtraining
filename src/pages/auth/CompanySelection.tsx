import React, { useState, useContext, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Combobox, Transition } from '@headlessui/react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { CompanyContext } from '../../contexts/CompanyContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
}

const CompanySelection = () => {
  const { selectCompany } = useContext(CompanyContext);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Company | null>(null);
  const [queryText, setQueryText] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveCompanies = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'companies'), where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);
        
        const companiesData: Company[] = [];
        querySnapshot.forEach((doc) => {
          companiesData.push({
            id: doc.id,
            ...doc.data()
          } as Company);
        });
        
        setCompanies(companiesData);
      } catch (err: any) {
        setError('Erreur lors du chargement des entreprises');
        console.error('Error fetching companies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveCompanies();
  }, []);

  const filteredCompanies = queryText === ''
    ? companies
    : companies.filter((company) =>
        company.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(queryText.toLowerCase().replace(/\s+/g, ''))
      );

  const handleContinue = () => {
    if (selected) {
      selectCompany(selected.id);
      navigate(`/login/${selected.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des entreprises...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

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
                <Combobox value={selected} onChange={setSelected}>
                  <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border-2 border-gray-300 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-opacity-30 transition-all duration-200">
                      <Combobox.Input
                        className="w-full border-none py-3 pl-4 pr-10 text-base leading-5 text-gray-900 focus:ring-0 placeholder-gray-400"
                        displayValue={(company: Company) => company?.name || ''}
                        onChange={(event) => setQueryText(event.target.value)}
                        placeholder="Rechercher une entreprise..."
                      />
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronDown
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </Combobox.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                      afterLeave={() => setQueryText('')}
                    >
                      <Combobox.Options className="absolute z-50 mt-1 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60">
                        {filteredCompanies.length === 0 && queryText !== '' ? (
                          <div className="relative cursor-default select-none py-4 px-4 text-center text-gray-700">
                            Aucune entreprise trouvée.
                          </div>
                        ) : (
                          filteredCompanies.map((company) => (
                            <Combobox.Option
                              key={company.id}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-3 pl-12 pr-4 ${
                                  active ? 'bg-primary-600 text-white' : 'text-gray-900'
                                }`
                              }
                              value={company}
                            >
                              {({ selected, active }) => (
                                <>
                                  <span className={`flex items-center truncate text-sm ${selected ? 'font-medium' : 'font-normal'}`}>
                                    <img
                                      src={company.logoUrl || '/default-logo.png'}
                                      alt={`${company.name} logo`}
                                      className="w-6 h-6 object-contain mr-3 flex-shrink-0"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/default-logo.png';
                                      }}
                                    />
                                    {company.name}
                                  </span>
                                  {selected ? (
                                    <span
                                      className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                        active ? 'text-white' : 'text-primary-600'
                                      }`}
                                    >
                                      <Check className="h-4 w-4" aria-hidden="true" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Combobox.Option>
                          ))
                        )}
                      </Combobox.Options>
                    </Transition>
                  </div>
                </Combobox>
              </div>

              {companies.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Aucune entreprise active disponible.</p>
                </div>
              )}

              <Button
                onClick={handleContinue}
                disabled={!selected}
                className="w-full py-3 text-base font-medium"
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