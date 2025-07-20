import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { certificateService, CertificateData } from '../../services/certificateService';
import Certificate from '../Certificate';

const Certificates: React.FC = () => {
  const [user] = useAuthState(auth);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  // Charger les certificats de l'utilisateur
  useEffect(() => {
    const loadUserCertificates = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        const userCertificates = await certificateService.getUserCertificates(user.uid);
        setCertificates(userCertificates);
      } catch (err) {
        console.error('Erreur lors du chargement des certificats:', err);
        setError('Impossible de charger vos certificats');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserCertificates();
  }, [user]);

  // Afficher un certificat spécifique
  const handleViewCertificate = (certificate: CertificateData) => {
    setSelectedCertificate(certificate);
    setShowCertificate(true);
  };

  // Fermer la vue du certificat
  const handleCloseCertificate = () => {
    setShowCertificate(false);
    setSelectedCertificate(null);
  };

  // Imprimer un certificat
  const handlePrintCertificate = () => {
    window.print();
  };

  // Télécharger un certificat (fonction basique - peut être étendue)
  const handleDownloadCertificate = (certificate: CertificateData) => {
    // Pour l'instant, on ouvre la page d'impression
    // Dans une version plus avancée, on pourrait générer un PDF
    handleViewCertificate(certificate);
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  // Rendu du chargement
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Chargement de vos certificats...</p>
      </div>
    );
  }

  // Rendu de l'erreur
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-lg w-full mx-4">
          <h2 className="text-red-600 text-xl font-semibold mb-4">Erreur</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Rendu du certificat en plein écran
  if (showCertificate && selectedCertificate) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* En-tête avec bouton de fermeture */}
        <div className="bg-white shadow-sm border-b print:hidden">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                Certificat - {selectedCertificate.chapterName}
              </h1>
              <button
                onClick={handleCloseCertificate}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Fermer
              </button>
            </div>
          </div>
        </div>

        {/* Certificat */}
        <div className="py-8">
          <Certificate
            participantName={selectedCertificate.userName}
            moduleName={selectedCertificate.chapterName}
            completionDate={certificateService.formatCertificateDate(selectedCertificate.completionDate)}
            instructorName={selectedCertificate.instructorName}
            certificateNumber={selectedCertificate.certificateNumber}
            onPrint={handlePrintCertificate}
          />
        </div>
      </div>
    );
  }

  // Rendu de la liste des certificats
  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Certificats</h1>
              <p className="text-gray-600 mt-1">
                Retrouvez tous vos certificats de formation Vision Training
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>{certificates.length}</strong> certificat{certificates.length > 1 ? 's' : ''} obtenu{certificates.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {certificates.length === 0 ? (
          // Aucun certificat
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun certificat disponible
              </h3>
              <p className="text-gray-600 mb-4">
                Vous n'avez pas encore obtenu de certificat. Complétez vos formations pour en obtenir !
              </p>
              <button
                onClick={() => window.location.href = '/student/courses'}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Voir mes cours
              </button>
            </div>
          </div>
        ) : (
          // Liste des certificats
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <div
                key={certificate.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
              >
                {/* En-tête de la carte */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg truncate">
                        {certificate.chapterName}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {certificate.courseName}
                      </p>
                    </div>
                    <div className="flex items-center bg-blue-500 bg-opacity-50 rounded-full px-3 py-1">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-medium">Validé</span>
                    </div>
                  </div>
                </div>

                {/* Contenu de la carte */}
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 012 0v4m0 0V7a1 1 0 011 1v4.586a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L13 12.586V8a1 1 0 011-1h4a1 1 0 110 2h-3v3.586l3 3a1 1 0 01-1.414 1.414L14 14.414V16a1 1 0 01-1 1H9a1 1 0 01-1-1v-1.586l-3-3A1 1 0 013.586 10L7 6.586V8a1 1 0 001 1z" />
                      </svg>
                      Obtenu le {certificateService.formatCertificateDate(certificate.completionDate)}
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {certificate.instructorName}
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      N° {certificate.certificateNumber}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 bg-gray-50 border-t">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewCertificate(certificate)}
                      className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Voir
                    </button>
                    <button
                      onClick={() => handleDownloadCertificate(certificate)}
                      className="flex-1 bg-green-600 text-white text-sm py-2 px-3 rounded hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Télécharger
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificates;