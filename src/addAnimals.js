// Importa las funciones necesarias de Firebase
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

// --- 1. CONFIGURACIÓN DE TU PROYECTO FIREBASE ---
// Reemplaza estos valores con la configuración de tu proyecto de Firebase.
export const firebaseConfig = {
  apiKey: 'AIzaSyC1w7-mAlmHt_NNfgiU8SUFGCAC7UDX1tY',
  authDomain: 'adoptaya2.firebaseapp.com',
  projectId: 'adoptaya2',
  storageBucket: 'adoptaya2.firebasestorage.app',
  messagingSenderId: '917908569284',
  appId: '1:917908569284:web:4e4b773fc74fa9aacc9d91',
  measurementId: 'G-B6B6DT0MTC',
};
// Inicializa la aplicación de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 2. DATOS DE LOS 10 ANIMALES ---
// Los IDs se generarán en el script
const animalsData = [
  {
    name: "Toby",
    specie: "Perro",
    age: 3,
    race: "Golden Retriever",
    province: "Madrid",
    description: "Un perro muy enérgico y amigable, le encanta jugar con la pelota.",
    urlImage: "https://example.com/toby.jpg",
    size: "grande",
    gender: "Macho",
    state: "ADOPTION",
    published: false,
    scaled: [],
    protectressName: "Asociación Canina",
    protectressPhone: "600111222",
    protectressEmail: "asociacioncanina@email.com",
  },
  {
    name: "Mona",
    specie: "Gato",
    age: 1,
    race: "Mestizo",
    province: "Barcelona",
    description: "Gatita muy curiosa y tranquila, ideal para apartamentos.",
    urlImage: "https://example.com/mona.jpg",
    size: "pequeño",
    gender: "Hembra",
    state: "ADOPTION",
    published: false,
    scaled: [],
    protectressName: "Gatos Solidarios",
    protectressPhone: "600333444",
    protectressEmail: "gatossolidarios@email.com",
  },
  {
    name: "Leo",
    specie: "Conejo",
    age: 2,
    race: "Belier",
    province: "Valencia",
    description: "Conejo cariñoso, le gusta correr en espacios abiertos.",
    urlImage: "https://example.com/leo.jpg",
    size: "mediano",
    gender: "Macho",
    state: "ADOPTION",
    published: false,
    scaled: [],
    protectressName: "El Refugio Animal",
    protectressPhone: "600555666",
    protectressEmail: "refugioanimal@email.com",
  },
  {
    name: "Nina",
    specie: "Perro",
    age: 5,
    race: "Border Collie",
    province: "Sevilla",
    description: "Inteligente y obediente. Necesita mucho ejercicio físico y mental.",
    urlImage: "https://example.com/nina.jpg",
    size: "grande",
    gender: "Hembra",
    state: "ADOPTION",
    published: false,
    scaled: [],
    protectressName: "Asociación Canina",
    protectressPhone: "600111222",
    protectressEmail: "asociacioncanina@email.com",
  },
  {
    name: "Simba",
    specie: "Gato",
    age: 4,
    race: "Persa",
    province: "Zaragoza",
    description: "Gato de pelo largo, tranquilo y muy limpio. Ideal para convivir.",
    urlImage: "https://example.com/simba.jpg",
    size: "mediano",
    gender: "Macho",
    state: "ADOPTION",
    published: false,
    scaled: [],
    protectressName: "Gatos Solidarios",
    protectressPhone: "600333444",
    protectressEmail: "gatossolidarios@email.com",
  },
  {
    name: "Rocky",
    specie: "Perro",
    age: 2,
    race: "Pitbull",
    province: "Málaga",
    description: "Perro cariñoso y leal. Busca un dueño con experiencia.",
    urlImage: "https://example.com/rocky.jpg",
    size: "grande",
    gender: "Macho",
    state: "ADOPTION",
    published: false,
    scaled: [],
    protectressName: "El Refugio Animal",
    protectressPhone: "600555666",
    protectressEmail: "refugioanimal@email.com",
  },
  {
    name: "Kira",
    specie: "Gato",
    age: 6,
    race: "Siames",
    province: "Bilbao",
    description: "Gata muy parlanchina y activa. Le encanta la atención.",
    urlImage: "https://example.com/kira.jpg",
    size: "mediano",
    gender: "Hembra",
    state: "ADOPTION",
    published: false,
    scaled: [],
    protectressName: "Gatos Solidarios",
    protectressPhone: "600333444",
    protectressEmail: "gatossolidarios@email.com",
  },
  {
    name: "Nala",
    specie: "Perro",
    age: 1,
    race: "Labrador",
    province: "Alicante",
    description: "Cachorra muy dulce y juguetona. Es ideal para familias.",
    urlImage: "https://example.com/nala.jpg",
    size: "grande",
    gender: "Hembra",
    state: "ADOPTION",
    published: false,
    scaled: [],
    protectressName: "Asociación Canina",
    protectressPhone: "600111222",
    protectressEmail: "asociacioncanina@email.com",
  },
  {
    name: "Milo",
    specie: "Hurón",
    age: 2,
    race: "Albino",
    province: "Murcia",
    description: "Hurón simpático, le gusta explorar y esconderse.",
    urlImage: "https://example.com/milo.jpg",
    size: "pequeño",
    gender: "Macho",
    state: "ADOPTION",
    published: false,
    scaled: [],
    protectressName: "Animales Exóticos",
    protectressPhone: "600777888",
    protectressEmail: "animalesexoticos@email.com",
  },
  {
    name: "Coco",
    specie: "Pájaro",
    age: 3,
    race: "Cacatúa",
    province: "Las Palmas",
    description: "Pájaro con gran personalidad, imita sonidos y palabras.",
    urlImage: "https://example.com/coco.jpg",
    size: "mediano",
    gender: "Hembra",
    state: "ADOPTION",
    published: false,
    scaled: [],
    protectressName: "El Refugio Animal",
    protectressPhone: "600555666",
    protectressEmail: "refugioanimal@email.com",
  },
];

// --- 3. FUNCIÓN PARA AÑADIR LOS ANIMALES A FIRESTORE ---
const addAnimalsToFirestore = async () => {
  const animalsCollectionRef = collection(db, "animals");
  let addedCount = 0;

  console.log("Iniciando la adición de 10 animales...");

  for (const animalData of animalsData) {
    try {
      // 1. Genera una referencia de documento con un ID automático
      const newAnimalRef = doc(animalsCollectionRef);

      // 2. Asigna el ID al objeto del animal
      const animalWithId = {
        ...animalData, // Copia todos los datos del animal
        id: newAnimalRef.id, // Añade el nuevo ID
      };

      // 3. Usa setDoc para crear el documento con el ID y los datos completos
      await setDoc(newAnimalRef, animalWithId);

      addedCount++;
      console.log(`- Animal "${animalWithId.name}" añadido con el ID: ${animalWithId.id}`);
    } catch (e) {
      console.error(`Error al añadir el animal "${animalData.name}":`, e);
    }
  }

  console.log(`\n¡Proceso finalizado! Se añadieron ${addedCount} de 10 animales.`);
};

// Ejecuta la función principal
addAnimalsToFirestore();
