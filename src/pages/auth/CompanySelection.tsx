import React, { useState, useContext, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Combobox, Transition } from '@headlessui/react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { CompanyContext } from '../../contexts/CompanyContext';

interface Company {
  id: string;
  name: string;
  logo: string;
}

const companies: Company[] = [
  { id: 'fonarev', name: 'FONAREV', logo: '🏢' },
  { id: 'unikin', name: 'UNIKIN', logo: '🎓' },
  { id: 'vision26', name: 'VISION 26', logo: '👁️' },
  { id: 'pnjt', name: 'PNJT', logo: '⚖️' },
  { id: 'besdu', name: 'BESDU', logo: '📚' },
];

const CompanySelection = () => {
  const { selectCompany } = useContext(CompanyContext);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Company | null>(null);
  const [query, setQuery] = useState('');

  const filteredCompanies = query === ''
    ? companies
    : companies.filter((company) =>
        company.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(query.toLowerCase().replace(/\s+/g, ''))
      );

  const handleContinue = () => {
    if (selected) {
      selectCompany(selected.id);
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
                <Combobox value={selected} onChange={setSelected}>
                  <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border-2 border-gray-300 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-opacity-30 transition-all duration-200">
                      <Combobox.Input
                        className="w-full border-none py-3 pl-4 pr-10 text-base leading-5 text-gray-900 focus:ring-0 placeholder-gray-400"
                        displayValue={(company: Company) => company?.name || ''}
                        onChange={(event) => setQuery(event.target.value)}
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
                      afterLeave={() => setQuery('')}
                    >
                      <Combobox.Options className="absolute z-50 mt-1 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {filteredCompanies.length === 0 && query !== '' ? (
                          <div className="relative cursor-default select-none py-4 px-4 text-center text-gray-700">
                            Aucune entreprise trouvée.
                          </div>
                        ) : (
                          filteredCompanies.map((company) => (
                            <Combobox.Option
                              key={company.id}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${
                                  active ? 'bg-primary-600 text-white' : 'text-gray-900'
                                }`
                              }
                              value={company}
                            >
                              {({ selected, active }) => (
                                <>
                                  <span className={`flex items-center truncate text-sm ${selected ? 'font-medium' : 'font-normal'}`}>
                                    <span className="mr-2 text-lg">{company.logo}</span>
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