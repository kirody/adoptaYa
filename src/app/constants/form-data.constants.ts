export const PROVINCES_SPAIN = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Barcelona',
  'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real', 'Córdoba',
  'La Coruña', 'Cuenca', 'Gerona', 'Granada', 'Guadalajara', 'Guipúzcoa', 'Huelva',
  'Huesca', 'Islas Baleares', 'Jaén', 'León', 'Lérida', 'Lugo', 'Madrid', 'Málaga',
  'Murcia', 'Navarra', 'Orense', 'Palencia', 'Las Palmas', 'Pontevedra', 'La Rioja',
  'Salamanca', 'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Santa Cruz de Tenerife',
  'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza',
  'Ceuta', 'Melilla'
];

export const DOG_BREEDS = [
  'Mestizo', 'Labrador Retriever', 'Pastor Alemán', 'Golden Retriever', 'Bulldog Francés',
  'Beagle', 'Poodle', 'Rottweiler', 'Yorkshire Terrier', 'Boxer', 'Dachshund',
  'Husky Siberiano', 'Chihuahua', 'Border Collie', 'Galgo', 'Podenco', 'Otro'
];

export const CAT_BREEDS = [
  'Común Europeo', 'Mestizo', 'Siamés', 'Persa', 'Maine Coon', 'Ragdoll', 'Bengalí',
  'British Shorthair', 'Sphynx', 'Abisinio', 'Otro'
];

export const SPECIES = [
    'Perro', 'Gato', 'Otro'
];

// Podrías tener una estructura más compleja si quieres que las razas dependan de la especie
export const RACES_BY_SPECIES: { [key: string]: string[] } = {
  'Perro': DOG_BREEDS,
  'Gato': CAT_BREEDS,
  'Otro': ['No aplica']
};
