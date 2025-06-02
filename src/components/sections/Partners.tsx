import { motion } from 'framer-motion';

const Partners = () => {
  const partners = [
    {
      name: 'FONAREV',
      logo: '/partners/fonarev.png',
    },
    {
      name: 'PNJT',
      logo: '/partners/pnjt.png',
    },
    {
      name: 'Vision 26',
      logo: '/partners/vision26.png',
    },
    {
      name: 'BESDU',
      logo: '/partners/besdu.png',
    },
    {
      name: 'UNIKIN',
      logo: '/partners/unikin.png',
    },
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Nos partenaires
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex justify-center"
            >
              <img
                src={partner.logo}
                alt={`${partner.name} logo`}
                className="h-16 md:h-20 w-auto object-contain transition-all duration-300"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partners;