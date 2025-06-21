export interface Company {
  id: string;         // ID Firestore !
  name: string;
  logoUrl: string;
}

export const companies: Company[] = [
  { id: 'besdu', name: 'BESDU', logoUrl: '/partners/besdu.png' },
  { id: 'fonarev', name: 'FONAREV', logoUrl: '/partners/fonarev.png' },
  { id: 'pnjt', name: 'PNJT', logoUrl: '/partners/pnjt.png' },
  { id: 'unikin', name: 'UNIKIN', logoUrl: '/partners/unikin.png' },
  { id: 'vision26', name: 'VISION 26', logoUrl: '/partners/vision26.png' },
  { id: '5nwpaINX8si53ZCK190Z', name: 'Redmagiccreative', logoUrl: '/partners/redmagiccreative.png' },
];


