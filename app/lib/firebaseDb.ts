// lib/firebaseDb.ts
// Firebase Firestore database operations

import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Product, StockMovement } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const PRODUCTS_COLLECTION = 'products';
const MOVEMENTS_COLLECTION = 'stock_movements';

// ─── Product helpers ──────────────────────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    } as Product));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate?.() || docSnap.data().createdAt,
      updatedAt: docSnap.data().updatedAt?.toDate?.() || docSnap.data().updatedAt,
    } as Product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('barcode', '==', barcode)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    } as Product;
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    return null;
  }
}

export async function createProduct(
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product> {
  try {
    const id = uuidv4();
    const now = new Date();
    const productData: Product = {
      id,
      ...product,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, PRODUCTS_COLLECTION, id), {
      ...productData,
      createdAt: now,
      updatedAt: now,
    });

    return productData;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };
    await updateDoc(docRef, updateData);
    return getProductById(id);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

export async function getLowStockProducts(minStock?: number): Promise<Product[]> {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('quantity', '<=', minStock || 5)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    } as Product));
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    return [];
  }
}

// ─── Movement helpers ─────────────────────────────────────────────────────────

export async function addMovement(
  movement: Omit<StockMovement, 'id' | 'createdAt'>
): Promise<StockMovement> {
  try {
    const id = uuidv4();
    const now = new Date();
    const movementData: StockMovement = {
      id,
      ...movement,
      createdAt: now,
    };

    await setDoc(doc(db, MOVEMENTS_COLLECTION, id), {
      ...movementData,
      createdAt: now,
    });

    // Update product quantity
    const product = await getProductById(movement.productId);
    if (product) {
      const delta =
        movement.type === 'IN'
          ? movement.quantity
          : movement.type === 'OUT'
          ? -movement.quantity
          : movement.quantity;

      const newQty = Math.max(0, product.quantity + delta);
      await updateProduct(movement.productId, { quantity: newQty });
    }

    return movementData;
  } catch (error) {
    console.error('Error adding movement:', error);
    throw error;
  }
}

export async function getMovementsForProduct(
  productId: string,
  limitCount = 50
): Promise<StockMovement[]> {
  try {
    const q = query(
      collection(db, MOVEMENTS_COLLECTION),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    } as StockMovement));
  } catch (error) {
    console.error('Error fetching movements:', error);
    return [];
  }
}

export async function getRecentMovements(
  limitCount = 50
): Promise<StockMovement[]> {
  try {
    const q = query(
      collection(db, MOVEMENTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    } as StockMovement));
  } catch (error) {
    console.error('Error fetching recent movements:', error);
    return [];
  }
}

// ─── Bulk operations ──────────────────────────────────────────────────────────

export async function bulkImportProducts(
  products: Product[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    const now = new Date();

    for (const product of products) {
      const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
      batch.set(docRef, {
        ...product,
        createdAt: product.createdAt || now,
        updatedAt: product.updatedAt || now,
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error bulk importing products:', error);
    throw error;
  }
}
