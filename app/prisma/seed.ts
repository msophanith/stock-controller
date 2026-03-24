// prisma/seed.ts
// Firebase seed script for initial data

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const firebaseConfig = {
  apiKey: "AIzaSyDY_cyuMOlNQk4dSWMTClmHJuF-qOwxHtc",
  authDomain: "stock-controller-8b62d.firebaseapp.com",
  projectId: "stock-controller-8b62d",
  storageBucket: "stock-controller-8b62d.firebasestorage.app",
  messagingSenderId: "1080293816959",
  appId: "1:1080293816959:web:0da4728d276a60d0fa1d4a",
  measurementId: "G-QBEECK0NEC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sampleProducts = [
  {
    barcode: '5901234123457',
    name: 'Bosch Spark Plug WR7DC',
    category: 'Engine Parts',
    description: 'OEM replacement spark plug for petrol engines',
    buyPrice: 2.5,
    sellPrice: 5.99,
    quantity: 48,
    minStock: 10,
    shelf: 'A1',
    unit: 'pcs',
  },
  {
    barcode: '4006381333931',
    name: 'Castrol GTX 5W-30 1L',
    category: 'Engine Oils',
    description: 'Fully synthetic engine oil 1 litre',
    buyPrice: 6.0,
    sellPrice: 12.99,
    quantity: 120,
    minStock: 20,
    shelf: 'B2',
    unit: 'L',
  },
  {
    barcode: '5390143996706',
    name: 'Mann Oil Filter HU 612/2 x',
    category: 'Filters',
    description: 'Premium oil filter for VW/Audi group vehicles',
    buyPrice: 3.2,
    sellPrice: 8.49,
    quantity: 35,
    minStock: 8,
    shelf: 'C3',
    unit: 'pcs',
  },
  {
    barcode: '0300013001008',
    name: 'Bosch Wiper Blade 500mm',
    category: 'Wipers',
    description: 'Aerotwin flat wiper blade 500mm',
    buyPrice: 4.5,
    sellPrice: 11.99,
    quantity: 22,
    minStock: 5,
    shelf: 'D1',
    unit: 'pcs',
  },
  {
    barcode: '4007106019722',
    name: 'Hella H7 Headlight Bulb',
    category: 'Lighting',
    description: 'H7 55W halogen headlight bulb twin pack',
    buyPrice: 3.8,
    sellPrice: 9.99,
    quantity: 4,
    minStock: 6,
    shelf: 'E2',
    unit: 'pcs',
  },
  {
    barcode: '3521890001234',
    name: 'Comma Brake Fluid DOT4',
    category: 'Fluids',
    description: 'DOT4 brake fluid 500ml',
    buyPrice: 2.1,
    sellPrice: 5.49,
    quantity: 60,
    minStock: 15,
    shelf: 'F1',
    unit: 'pcs',
  },
  {
    barcode: '5013639037826',
    name: 'Gates Timing Belt K015624XS',
    category: 'Drive Belts',
    description: 'Timing belt kit for Ford/Peugeot 1.6 HDi',
    buyPrice: 28.0,
    sellPrice: 59.99,
    quantity: 8,
    minStock: 3,
    shelf: 'G4',
    unit: 'pcs',
  },
  {
    barcode: '8012223012345',
    name: 'Febi Brake Pad Set 16578',
    category: 'Brakes',
    description: 'Front brake pad set for VW Golf/Passat',
    buyPrice: 12.0,
    sellPrice: 26.99,
    quantity: 3,
    minStock: 5,
    shelf: 'H2',
    unit: 'set',
  },
];

async function seed() {
  console.log('Seeding Firebase database...');

  const productsCollection = collection(db, 'products');
  const now = new Date();

  for (const product of sampleProducts) {
    const id = uuidv4();
    const productRef = doc(productsCollection, id);

    await setDoc(productRef, {
      id,
      ...product,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`✓ Created product: ${product.name}`);
  }

  console.log(`\n✓ Successfully seeded ${sampleProducts.length} products to Firebase.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
