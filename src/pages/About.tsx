import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const About = () => {
  return (
    <div className="container mx-auto px-2 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">À Propos</h1>
        
        <div className="prose prose-lg max-w-none">
          {/* À Propos - Bloc unique */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8 mx-2">
            <p className="text-gray-700 mb-4 text-justify leading-relaxed">
              Le Programme Vision Training est une initiative novatrice avec un style de partenariat 
              tripartite, dédiée au renforcement des capacités des agents, cadres et managers des secteurs public 
              et privé dans tous les domaines et ceux des droits humains en particulier.
            </p>

            <p className="text-gray-700 mb-4 text-justify leading-relaxed">
              Il vise à offrir des formations pratiques, accessibles et de haute qualité, 
              axées sur le développement des compétences clés en Justice Transitionnelle, 
              Droits Humains, Droit International Humanitaire, Lutte contre la Corruption, leadership, 
              bonne gouvernance, gestion stratégique, Médecine, Mines, Hydrocarbures, Économie, 
              Comptabilité et Gestion Financière, communication, éthique & Intégrité professionnelle 
              ainsi que la performance organisationnelle.
            </p>

            <p className="text-gray-700 mb-4 text-justify leading-relaxed">
              Par une approche pédagogique centrée sur l'action et l'acquisition de savoir-faire concrets, 
              Vision Training ambitionne de répondre efficacement aux défis actuels du monde professionnel 
              en République Démocratique du Congo et dans la sous-région avant d'étendre sa vision dans le monde entier.
            </p>

            <p className="text-gray-700 mb-4 text-justify leading-relaxed">
              Ce Programme s'inscrit dans une dynamique d'amélioration continue et d'adaptation 
              aux besoins spécifiques des institutions, entreprises et OSC.
            </p>

            <p className="text-gray-700 text-justify leading-relaxed">
              Grâce à une offre de modules diversifiés préparés par l'université de Kinshasa (UNIKIN), 
              des professeurs expérimentés, experts thématiques et des outils pédagogiques modernes, 
              Vision Training se positionne comme un levier stratégique pour la transformation des pratiques de gestion 
              et la promotion de l'excellence professionnelle.
            </p>
          </div>

          {/* Notre Vision et Mission - Côte à côte */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8 mx-2">
            {/* Notre Vision */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Notre Vision</h2>
              
              <p className="text-gray-700 mb-3 text-justify leading-relaxed text-sm">
                L'objectif de Vision Training est de devenir la référence incontestée en matière
                de développement des compétences institutionnelles en République Démocratique du Congo. 
                Ce programme s'appuie sur une philosophie de transformation durable et inclusive, plaçant l'humain, 
                la connaissance et l'innovation au cœur de la gouvernance publique, de la performance des entreprises 
                et du développement du tissu institutionnel.
              </p>

              <p className="text-gray-700 mb-3 text-justify leading-relaxed text-sm">
                Vision Training incarne l'ambition d'un écosystème où les institutions, entreprises 
                et organisations de la société civile évoluent dans un environnement d'excellence, 
                porté par la rigueur académique, l'éthique et la créativité pédagogique.
              </p>

              <p className="text-gray-700 mb-3 text-justify leading-relaxed text-sm">
                Il s'agit de catalyser une dynamique de réforme, de redevabilité et de compétence, 
                avec pour finalité une RDC gouvernée par l'efficacité et l'intégrité.
              </p>

              <p className="text-gray-700 mb-3 text-justify leading-relaxed text-sm">
                La vision repose sur une intégration harmonieuse des connaissances locales 
                et internationales, adaptées aux réalités congolaises. Elle entend générer un impact tangible 
                sur le terrain à travers une offre de formation flexible, certifiante et connectée aux défis actuels : 
                Gouvernance, Justice, Droits Humains, Justice Transitionnelle, Contrôle de gestion, Contrôle qualité, 
                Sécurité, Environnement, Innovation Technologique, Développement humain.
              </p>

              <p className="text-gray-700 text-justify leading-relaxed text-sm">
                Enfin, Vision Training aspire à bâtir une société apprenante, dans laquelle chaque acteur 
                institutionnel, privé ou citoyen devient le moteur de sa propre montée en compétence et participe 
                activement à l'essor d'une RDC plus juste, performante et respectée dans le concert des nations.
              </p>
            </div>

            {/* Notre Mission */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Notre Mission</h2>
              
              <p className="text-gray-700 mb-3 text-justify leading-relaxed text-sm">
                La mission fondamentale de Vision Training est de renforcer les capacités des agents publics, 
                privés et des organisations de la société civile par des formations de haute qualité, 
                basées sur une analyse rigoureuse des besoins sectoriels et l'utilisation de méthodes pédagogiques innovantes.
              </p>

              <p className="text-gray-700 mb-3 text-justify leading-relaxed text-sm">
                Le programme vise à professionnaliser les acteurs à travers des parcours structurés et certifiés.
              </p>

              <p className="text-gray-700 mb-3 text-justify leading-relaxed text-sm">
                En collaboration avec des partenaires académiques comme l'Université de Kinshasa, 
                Vision Training conçoit des modules spécialisés adaptés aux contextes réels des institutions,
                entreprises et organisations. Ces formations visent non seulement à combler les lacunes techniques 
                et managériales, mais également à développer une éthique professionnelle, une culture de performance 
                et un sens aigu de la responsabilité publique.
              </p>

              <p className="text-gray-700 mb-3 text-justify leading-relaxed text-sm">
                L'approche est participative et inclusive. Chaque contenu est co-construit avec les institutions bénéficiaires 
                et les experts académiques afin de garantir sa pertinence, son efficacité et sa durabilité. 
                Cette mission comprend également l'accompagnement institutionnel, l'appui aux réformes et le développement 
                d'un cadre d'apprentissage continu favorisant le changement structurel.
              </p>

              <p className="text-gray-700 text-justify leading-relaxed text-sm">
                Vision Training entend ainsi devenir un levier stratégique pour l'amélioration de la gouvernance, 
                la qualité des services publics, le développement du leadership transformationnel, 
                et l'autonomisation des jeunes talents congolais, contribuant à l'émergence d'une nouvelle élite compétente et éthique.
              </p>
            </div>
          </div>

          {/* Call to Action Section */}
          <div className="bg-red-600 rounded-lg p-8 text-center text-white shadow-lg mx-2">
            <h2 className="text-2xl font-bold mb-4">
              Prêt à commencer votre formation ?
            </h2>
            <p className="text-lg mb-6 opacity-90">
              Rejoignez nos autres partenaires et perfectionnez vos compétences avec notre programme d'apprentissage professionnel en ligne.
            </p>
            <button className="bg-gray-800 text-white font-bold py-3 px-8 rounded hover:bg-gray-700 transition duration-300 shadow-lg transform hover:scale-105">
              S'identifier maintenant
            </button>
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get Started</h2>
            <p className="text-gray-700 mb-4">
              Ready to transform your organization's learning experience? Contact us 
              to learn more about how we can help you achieve your training goals.
            </p>
            <Link to="/login">
              <Button 
                size="lg" 
                variant="primary"
                className="mt-2"
              >
                Sign in now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;