import React from 'react';

// Interface pour les props du certificat
interface CertificateProps {
  participantName: string;
  moduleName: string;
  completionDate: string;
  instructorName: string;
  certificateNumber: string;
  // Props optionnelles pour personnalisation
  className?: string;
  showPrintButton?: boolean;
  onPrint?: () => void;
}

const Certificate: React.FC<CertificateProps> = ({
  participantName,
  moduleName,
  completionDate,
  instructorName,
  certificateNumber,
  className = '',
  showPrintButton = true,
  onPrint
}) => {
  // Fonction pour imprimer le certificat
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className={`certificate-container ${className}`}>
      {/* Bouton d'impression (masqué à l'impression) */}
      {showPrintButton && (
        <div className="print:hidden mb-4 flex justify-end">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            Imprimer le certificat
          </button>
        </div>
      )}

      {/* Certificat principal - Format A4 paysage */}
      <div className="certificate-content bg-white shadow-2xl relative overflow-hidden" 
           style={{ 
             width: '297mm', 
             height: '210mm', 
             maxWidth: '100%', 
             aspectRatio: '297/210',
             margin: '0 auto',
             position: 'relative'
           }}>
        
        {/* Watermark en arrière-plan */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <div className="text-6xl font-bold text-gray-400 transform rotate-45">
            Programme Vision Training - Université de Kinshasa
          </div>
        </div>

        {/* Bandeau officiel en haut */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-6 relative">
          <div className="flex items-center justify-between">
            {/* Logo UNIKIN à gauche */}
            <div className="flex items-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mr-4 overflow-hidden">
                <img 
                  src="/partners/unikin.png" 
                  alt="Logo UNIKIN" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg">UNIVERSITÉ DE KINSHASA</h3>
                <p className="text-sm opacity-90">République Démocratique du Congo</p>
              </div>
            </div>

            {/* Texte central */}
            <div className="text-center flex-1 mx-8">
              <h1 className="text-2xl font-bold mb-2">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h1>
              <h2 className="text-xl font-semibold">UNIVERSITÉ DE KINSHASA (UNIKIN)</h2>
              <p className="text-sm mt-2 opacity-90">
                Programme de renforcement des capacités des acteurs d'institutions,<br />
                entreprises publiques et privées ainsi que de la société civile<br />
                pour le relèvement des compétences
              </p>
            </div>

            {/* Logo Vision Training à droite */}
            <div className="flex items-center">
              <div className="text-right mr-4">
                <h3 className="font-bold text-lg">VISION TRAINING</h3>
                <p className="text-sm opacity-90">Formation Continue</p>
              </div>
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src="/vtlogo.png" 
                  alt="Logo Vision Training" 
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Corps du certificat */}
        <div className="p-12 text-center relative z-10">
          {/* Titre principal */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4" 
                style={{ color: '#1e40af', fontFamily: 'Georgia, serif' }}>
              Brevet de Fin de Formation
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-red-600 to-yellow-500 mx-auto rounded-full"></div>
          </div>

          {/* Texte de présentation */}
          <div className="mb-8">
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Le présent Brevet de fin de formation est décerné à :
            </p>
            
            {/* Nom du participant */}
            <div className="mb-8">
              <p className="text-base text-gray-600 mb-2">Nom du participant(e) :</p>
              <h2 className="text-3xl font-bold text-blue-800 border-b-2 border-blue-300 pb-2 inline-block px-8"
                  style={{ fontFamily: 'Georgia, serif' }}>
                {participantName}
              </h2>
            </div>

            {/* Module */}
            <div className="mb-8">
              <p className="text-lg text-gray-700 mb-4">
                Pour avoir suivi et satisfait aux exigences du module suivant :
              </p>
              <p className="text-base text-gray-600 mb-2">Module suivi :</p>
              <h3 className="text-2xl font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg p-4 inline-block">
                {moduleName}
              </h3>
            </div>

            {/* Texte de validation */}
            <div className="mb-8">
              <p className="text-lg text-gray-700 leading-relaxed italic">
                Cette formation, organisée par l'Université de Kinshasa (UNIKIN) à travers le programme 
                <strong className="text-blue-800"> VISION TRAINING</strong>, a permis au participant de renforcer 
                ses compétences et d'acquérir des connaissances essentielles en lien avec le module suivi.
              </p>
            </div>
          </div>

          {/* Informations finales */}
          <div className="flex justify-between items-end mt-12">
            {/* Informations à gauche */}
            <div className="text-left">
              <p className="text-lg text-gray-700 mb-4">
                <strong>Fait à Kinshasa, le</strong> <span className="text-blue-800 font-semibold">{completionDate}</span>
              </p>
              <p className="text-lg text-gray-700 mb-2">
                <strong>Professeur/Expert formateur :</strong>
              </p>
              <p className="text-xl font-semibold text-red-700 border-b border-red-300 pb-1">
                {instructorName}
              </p>
              <p className="text-sm text-gray-600 mt-2">Université de Kinshasa</p>
            </div>

            {/* Numéro du brevet à droite */}
            <div className="text-right">
              <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Numéro du brevet :</p>
                <p className="text-xl font-bold text-yellow-800 font-mono tracking-wider">
                  {certificateNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bordure décorative */}
        <div className="absolute inset-4 border-4 border-gradient-to-r from-blue-600 via-red-600 to-yellow-500 rounded-lg pointer-events-none"
             style={{ 
               border: '4px solid transparent',
               backgroundImage: 'linear-gradient(white, white), linear-gradient(45deg, #2563eb, #dc2626, #d97706)',
               backgroundOrigin: 'border-box',
               backgroundClip: 'content-box, border-box'
             }}>
        </div>
      </div>

      {/* Styles d'impression */}
      <style jsx>{`
        @media print {
          .certificate-container {
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
          }
          
          .certificate-content {
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            box-shadow: none;
            page-break-inside: avoid;
          }
          
          @page {
            size: A4 landscape;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Certificate;