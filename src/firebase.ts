// ============================================
// Firebase Configuration + Firestore Database
// ============================================

import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    writeBatch,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import type { Auth } from 'firebase/auth';

// ============================================
// Firebase Config
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyBmwbpBdrHtvr20l2f083L-TeWmd0YKsF4",
    authDomain: "menuqr-fbd4e.firebaseapp.com",
    projectId: "menuqr-fbd4e",
    storageBucket: "menuqr-fbd4e.firebasestorage.app",
    messagingSenderId: "971173182268",
    appId: "1:971173182268:web:aea5c619a4018a18053c39",
    measurementId: "G-9N1V1281D7"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let useFirebase = false;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    useFirebase = true;
    console.log('✅ Firebase initialized successfully');
} catch (e) {
    console.warn('⚠️ Firebase init failed:', e);
}

// ============================================
// Data Types
// ============================================

export interface Restaurant {
    id: string;
    name: string;
    description: string;
    phone: string;
    address: string;
    logo?: string;
    coverImage?: string;
    themeColor: string;
    currency: string;
    ownerId: string;
    createdAt: number;
    isActive: boolean;
    slug: string;
    whatsappNumber?: string;
    enableOrdering?: boolean;
    enableWaiterCall?: boolean;
    orderNotifyType?: 'panel' | 'whatsapp' | 'both';
    tableCount?: number;
    languages?: string[];
    socialLinks?: { instagram?: string; facebook?: string; website?: string; };
    workingHours?: string;
}

export interface MenuCategory {
    id: string;
    restaurantId: string;
    name: string;
    description?: string;
    icon?: string;
    order: number;
    translations?: Record<string, string>;
}

export interface MenuItem {
    id: string;
    categoryId: string;
    restaurantId: string;
    name: string;
    description: string;
    price: number;
    discountPrice?: number;
    image?: string;
    isAvailable: boolean;
    isPopular: boolean;
    allergens?: string[];
    calories?: number;
    preparationTime?: number;
    order: number;
    translations?: Record<string, { name: string; description: string; }>;
}

export interface Order {
    id: string;
    restaurantId: string;
    tableNumber?: number;
    orderType: 'dine-in' | 'takeaway' | 'delivery';
    items: { itemId: string; name: string; price: number; quantity: number; notes?: string; }[];
    total: number;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'cancelled';
    customerName?: string;
    customerPhone?: string;
    notes?: string;
    billRequested?: boolean;
    billRequestedAt?: number;
    createdAt: number;
}

export interface Table {
    id: string;
    restaurantId: string;
    number: number;
    label?: string;
    hasActiveCall: boolean;
    callTime?: number;
}

export interface Feedback {
    id: string;
    restaurantId: string;
    rating: number;
    comment?: string;
    tableNumber?: number;
    orderId?: string;
    createdAt: number;
}

export interface UserProfile {
    id: string;
    email: string;
    businessName: string;
    phone: string;
    plan: 'free' | 'pro' | 'premium';
    createdAt: number;
}

// ============================================
// Utility: Generate IDs
// ============================================

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + generateId().substr(0, 4);
}

// ============================================
// Helper: clean undefined values for Firestore
// ============================================
function cleanForFirestore(obj: any): any {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            cleaned[key] = value;
        }
    }
    return cleaned;
}

// ============================================
// Firestore Database Adapter
// ============================================

class FirestoreDB {
    private firestore: Firestore;

    constructor(firestore: Firestore) {
        this.firestore = firestore;
    }

    // ---------- Auth ----------
    getCurrentUser(): UserProfile | null {
        const data = localStorage.getItem('menuqr_currentUser');
        return data ? JSON.parse(data) : null;
    }

    setCurrentUser(user: UserProfile | null): void {
        if (user) {
            localStorage.setItem('menuqr_currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('menuqr_currentUser');
        }
    }

    async register(email: string, password: string, businessName: string, phone: string): Promise<UserProfile> {
        if (!auth) throw new Error('Firebase Auth not initialized');

        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = credential.user.uid;

        const profile: UserProfile = {
            id: uid,
            email,
            businessName,
            phone,
            plan: 'free',
            createdAt: Date.now()
        };

        await setDoc(doc(this.firestore, 'users', uid), cleanForFirestore(profile));
        this.setCurrentUser(profile);
        return profile;
    }

    async login(email: string, password: string): Promise<UserProfile> {
        if (!auth) throw new Error('Firebase Auth not initialized');

        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const uid = credential.user.uid;

            // Get profile from Firestore
            const userDoc = await getDoc(doc(this.firestore, 'users', uid));
            if (userDoc.exists()) {
                const profile = { ...userDoc.data(), id: uid } as UserProfile;
                this.setCurrentUser(profile);
                return profile;
            }

            // Profile doesn't exist in Firestore yet, create it
            const profile: UserProfile = {
                id: uid,
                email,
                businessName: email.split('@')[0],
                phone: '',
                plan: 'free',
                createdAt: Date.now()
            };
            await setDoc(doc(this.firestore, 'users', uid), cleanForFirestore(profile));
            this.setCurrentUser(profile);
            return profile;
        } catch (error: any) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                throw new Error('E-posta veya şifre hatalı');
            }
            throw error;
        }
    }

    async logout(): Promise<void> {
        if (auth) await signOut(auth);
        this.setCurrentUser(null);
    }

    // ---------- Restaurants ----------
    async getRestaurants(ownerId: string): Promise<Restaurant[]> {
        const q = query(
            collection(this.firestore, 'restaurants'),
            where('ownerId', '==', ownerId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Restaurant));
    }

    async getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
        const q = query(
            collection(this.firestore, 'restaurants'),
            where('slug', '==', slug)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const d = snapshot.docs[0];
        return { ...d.data(), id: d.id } as Restaurant;
    }

    async getRestaurantById(id: string): Promise<Restaurant | null> {
        const d = await getDoc(doc(this.firestore, 'restaurants', id));
        if (!d.exists()) return null;
        return { ...d.data(), id: d.id } as Restaurant;
    }

    async saveRestaurant(restaurant: Omit<Restaurant, 'id' | 'createdAt' | 'slug'>): Promise<Restaurant> {
        const id = generateId();
        const newRestaurant: Restaurant = {
            ...restaurant,
            id,
            slug: generateSlug(restaurant.name),
            createdAt: Date.now()
        };
        await setDoc(doc(this.firestore, 'restaurants', id), cleanForFirestore(newRestaurant));
        return newRestaurant;
    }

    async updateRestaurant(id: string, data: Partial<Restaurant>): Promise<void> {
        await updateDoc(doc(this.firestore, 'restaurants', id), cleanForFirestore(data));
    }

    async deleteRestaurant(id: string): Promise<void> {
        // Delete restaurant
        await deleteDoc(doc(this.firestore, 'restaurants', id));

        // Delete related categories
        const catsQ = query(collection(this.firestore, 'categories'), where('restaurantId', '==', id));
        const catsSnap = await getDocs(catsQ);
        const batch1 = writeBatch(this.firestore);
        catsSnap.docs.forEach(d => batch1.delete(d.ref));
        if (!catsSnap.empty) await batch1.commit();

        // Delete related items
        const itemsQ = query(collection(this.firestore, 'items'), where('restaurantId', '==', id));
        const itemsSnap = await getDocs(itemsQ);
        const batch2 = writeBatch(this.firestore);
        itemsSnap.docs.forEach(d => batch2.delete(d.ref));
        if (!itemsSnap.empty) await batch2.commit();
    }

    // ---------- Categories ----------
    async getCategories(restaurantId: string): Promise<MenuCategory[]> {
        const q = query(
            collection(this.firestore, 'categories'),
            where('restaurantId', '==', restaurantId),
            orderBy('order')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MenuCategory));
    }

    async saveCategory(category: Omit<MenuCategory, 'id'>): Promise<MenuCategory> {
        const id = generateId();
        const newCategory: MenuCategory = { ...category, id };
        await setDoc(doc(this.firestore, 'categories', id), cleanForFirestore(newCategory));
        return newCategory;
    }

    async updateCategory(id: string, data: Partial<MenuCategory>): Promise<void> {
        await updateDoc(doc(this.firestore, 'categories', id), cleanForFirestore(data));
    }

    async deleteCategory(id: string): Promise<void> {
        await deleteDoc(doc(this.firestore, 'categories', id));
        // Delete related items
        const itemsQ = query(collection(this.firestore, 'items'), where('categoryId', '==', id));
        const itemsSnap = await getDocs(itemsQ);
        const batch = writeBatch(this.firestore);
        itemsSnap.docs.forEach(d => batch.delete(d.ref));
        if (!itemsSnap.empty) await batch.commit();
    }

    // ---------- Menu Items ----------
    async getItems(restaurantId: string): Promise<MenuItem[]> {
        const q = query(
            collection(this.firestore, 'items'),
            where('restaurantId', '==', restaurantId),
            orderBy('order')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MenuItem));
    }

    async getItemsByCategory(categoryId: string): Promise<MenuItem[]> {
        const q = query(
            collection(this.firestore, 'items'),
            where('categoryId', '==', categoryId),
            orderBy('order')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MenuItem));
    }

    async saveItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
        const id = generateId();
        const newItem: MenuItem = { ...item, id };
        await setDoc(doc(this.firestore, 'items', id), cleanForFirestore(newItem));
        return newItem;
    }

    async updateItem(id: string, data: Partial<MenuItem>): Promise<void> {
        await updateDoc(doc(this.firestore, 'items', id), cleanForFirestore(data));
    }

    async deleteItem(id: string): Promise<void> {
        await deleteDoc(doc(this.firestore, 'items', id));
    }

    // ---------- Orders ----------
    async getOrders(restaurantId: string): Promise<Order[]> {
        const q = query(
            collection(this.firestore, 'orders'),
            where('restaurantId', '==', restaurantId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Order));
    }

    async saveOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
        const id = generateId();
        const newOrder: Order = { ...order, id, createdAt: Date.now() };
        await setDoc(doc(this.firestore, 'orders', id), cleanForFirestore(newOrder));
        return newOrder;
    }

    async updateOrder(id: string, data: Partial<Order>): Promise<void> {
        await updateDoc(doc(this.firestore, 'orders', id), cleanForFirestore(data));
    }

    // ---------- Tables ----------
    async getTables(restaurantId: string): Promise<Table[]> {
        const q = query(
            collection(this.firestore, 'tables'),
            where('restaurantId', '==', restaurantId),
            orderBy('number')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Table));
    }

    async setupTables(restaurantId: string, count: number): Promise<void> {
        // Delete existing tables for this restaurant
        const existingQ = query(collection(this.firestore, 'tables'), where('restaurantId', '==', restaurantId));
        const existingSnap = await getDocs(existingQ);
        const deleteBatch = writeBatch(this.firestore);
        existingSnap.docs.forEach(d => deleteBatch.delete(d.ref));
        if (!existingSnap.empty) await deleteBatch.commit();

        // Create new tables
        const createBatch = writeBatch(this.firestore);
        for (let i = 1; i <= count; i++) {
            const id = generateId();
            createBatch.set(doc(this.firestore, 'tables', id), {
                id, restaurantId, number: i, hasActiveCall: false
            });
        }
        await createBatch.commit();
    }

    async callWaiter(restaurantId: string, tableNumber: number): Promise<void> {
        const q = query(
            collection(this.firestore, 'tables'),
            where('restaurantId', '==', restaurantId),
            where('number', '==', tableNumber)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            await updateDoc(snapshot.docs[0].ref, { hasActiveCall: true, callTime: Date.now() });
        }
    }

    async dismissWaiterCall(tableId: string): Promise<void> {
        await updateDoc(doc(this.firestore, 'tables', tableId), {
            hasActiveCall: false,
            callTime: null
        });
    }

    // ---------- Feedback ----------
    async saveFeedback(data: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> {
        const id = generateId();
        const feedback: Feedback = { ...data, id, createdAt: Date.now() };
        await setDoc(doc(this.firestore, 'feedbacks', id), cleanForFirestore(feedback));
        return feedback;
    }

    async getFeedbacks(restaurantId: string): Promise<Feedback[]> {
        const q = query(
            collection(this.firestore, 'feedbacks'),
            where('restaurantId', '==', restaurantId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Feedback));
    }

    async getFeedbackStats(restaurantId: string): Promise<{ avg: number; count: number; distribution: number[] }> {
        const feedbacks = await this.getFeedbacks(restaurantId);
        if (feedbacks.length === 0) return { avg: 0, count: 0, distribution: [0, 0, 0, 0, 0] };
        const sum = feedbacks.reduce((s, f) => s + f.rating, 0);
        const distribution = [0, 0, 0, 0, 0];
        feedbacks.forEach(f => { if (f.rating >= 1 && f.rating <= 5) distribution[f.rating - 1]++; });
        return { avg: sum / feedbacks.length, count: feedbacks.length, distribution };
    }
}

// ============================================
// Auth State Listener
// ============================================
export function onAuthReady(callback: (user: UserProfile | null) => void): void {
    if (auth) {
        onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser && db) {
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    const profile = { ...userDoc.data(), id: firebaseUser.uid } as UserProfile;
                    localStorage.setItem('menuqr_currentUser', JSON.stringify(profile));
                    callback(profile);
                } else {
                    callback(null);
                }
            } else {
                callback(null);
            }
        });
    }
}

// ============================================
// Export singleton
// ============================================
export const localDB = new FirestoreDB(db!);
export { useFirebase, db, auth, generateId, generateSlug };
