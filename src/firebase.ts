// ============================================
// Firebase Configuration
// ============================================
// IMPORTANT: Replace these with your own Firebase config
// Go to https://console.firebase.google.com
// 1. Create a new project (free)
// 2. Enable Firestore Database
// 3. Enable Authentication (Email/Password)
// 4. Copy your config here
// ============================================

import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

// Firebase config - REPLACE WITH YOUR OWN
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let useFirebase = false;

// Try to initialize Firebase
try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "") {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        useFirebase = true;
        console.log('✅ Firebase initialized');
    } else {
        console.log('ℹ️ Firebase not configured - using localStorage mode');
        console.log('📖 See src/firebase.ts to add your Firebase config');
    }
} catch (e) {
    console.warn('⚠️ Firebase init failed, using localStorage:', e);
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
    // New fields
    whatsappNumber?: string;
    enableOrdering?: boolean;
    enableWaiterCall?: boolean;
    orderNotifyType?: 'panel' | 'whatsapp' | 'both';
    tableCount?: number;
    languages?: string[];  // e.g. ['tr', 'en', 'ar']
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
    translations?: Record<string, string>;  // { en: 'Soups', ar: 'شوربات' }
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
    preparationTime?: number;  // minutes
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
    rating: number; // 1-5
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
// localStorage Adapter (Fallback)
// ============================================

class LocalStorageDB {
    private getCollection<T>(name: string): T[] {
        const data = localStorage.getItem(`menuqr_${name}`);
        return data ? JSON.parse(data) : [];
    }

    private setCollection<T>(name: string, data: T[]): void {
        localStorage.setItem(`menuqr_${name}`, JSON.stringify(data));
    }

    // Auth
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
        const users = this.getCollection<UserProfile & { password: string }>('users');
        const existing = users.find(u => u.email === email);
        if (existing) throw new Error('Bu e-posta adresi zaten kayıtlı');

        const user: UserProfile & { password: string } = {
            id: generateId(),
            email,
            password,
            businessName,
            phone,
            plan: 'free',
            createdAt: Date.now()
        };
        users.push(user);
        this.setCollection('users', users);

        const profile: UserProfile = { id: user.id, email: user.email, businessName: user.businessName, phone: user.phone, plan: user.plan, createdAt: user.createdAt };
        this.setCurrentUser(profile);
        return profile;
    }

    async login(email: string, password: string): Promise<UserProfile> {
        const users = this.getCollection<UserProfile & { password: string }>('users');
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            const profile: UserProfile = { id: user.id, email: user.email, businessName: user.businessName, phone: user.phone, plan: user.plan, createdAt: user.createdAt };
            this.setCurrentUser(profile);
            return profile;
        }

        // Auto-register on new device if no users exist with this email
        const existingEmail = users.find(u => u.email === email);
        if (existingEmail) {
            throw new Error('E-posta veya şifre hatalı');
        }

        // No account on this device - create it automatically
        const newUser: UserProfile & { password: string } = {
            id: generateId(),
            email,
            password,
            businessName: email.split('@')[0],
            phone: '',
            plan: 'free',
            createdAt: Date.now()
        };
        users.push(newUser);
        this.setCollection('users', users);
        const profile: UserProfile = { id: newUser.id, email: newUser.email, businessName: newUser.businessName, phone: newUser.phone, plan: newUser.plan, createdAt: newUser.createdAt };
        this.setCurrentUser(profile);
        return profile;
    }

    async logout(): Promise<void> {
        this.setCurrentUser(null);
    }

    // Restaurants
    async getRestaurants(ownerId: string): Promise<Restaurant[]> {
        const restaurants = this.getCollection<Restaurant>('restaurants');
        return restaurants.filter(r => r.ownerId === ownerId);
    }

    async getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
        const restaurants = this.getCollection<Restaurant>('restaurants');
        return restaurants.find(r => r.slug === slug) || null;
    }

    async getRestaurantById(id: string): Promise<Restaurant | null> {
        const restaurants = this.getCollection<Restaurant>('restaurants');
        return restaurants.find(r => r.id === id) || null;
    }

    async saveRestaurant(restaurant: Omit<Restaurant, 'id' | 'createdAt' | 'slug'>): Promise<Restaurant> {
        const restaurants = this.getCollection<Restaurant>('restaurants');
        const newRestaurant: Restaurant = {
            ...restaurant,
            id: generateId(),
            slug: generateSlug(restaurant.name),
            createdAt: Date.now()
        };
        restaurants.push(newRestaurant);
        this.setCollection('restaurants', restaurants);
        return newRestaurant;
    }

    async updateRestaurant(id: string, data: Partial<Restaurant>): Promise<void> {
        const restaurants = this.getCollection<Restaurant>('restaurants');
        const index = restaurants.findIndex(r => r.id === id);
        if (index >= 0) {
            restaurants[index] = { ...restaurants[index], ...data };
            this.setCollection('restaurants', restaurants);
        }
    }

    async deleteRestaurant(id: string): Promise<void> {
        let restaurants = this.getCollection<Restaurant>('restaurants');
        restaurants = restaurants.filter(r => r.id !== id);
        this.setCollection('restaurants', restaurants);
        // Also delete categories and items
        let categories = this.getCollection<MenuCategory>('categories');
        categories = categories.filter(c => c.restaurantId !== id);
        this.setCollection('categories', categories);
        let items = this.getCollection<MenuItem>('items');
        items = items.filter(i => i.restaurantId !== id);
        this.setCollection('items', items);
    }

    // Categories
    async getCategories(restaurantId: string): Promise<MenuCategory[]> {
        const categories = this.getCollection<MenuCategory>('categories');
        return categories
            .filter(c => c.restaurantId === restaurantId)
            .sort((a, b) => a.order - b.order);
    }

    async saveCategory(category: Omit<MenuCategory, 'id'>): Promise<MenuCategory> {
        const categories = this.getCollection<MenuCategory>('categories');
        const newCategory: MenuCategory = {
            ...category,
            id: generateId()
        };
        categories.push(newCategory);
        this.setCollection('categories', categories);
        return newCategory;
    }

    async updateCategory(id: string, data: Partial<MenuCategory>): Promise<void> {
        const categories = this.getCollection<MenuCategory>('categories');
        const index = categories.findIndex(c => c.id === id);
        if (index >= 0) {
            categories[index] = { ...categories[index], ...data };
            this.setCollection('categories', categories);
        }
    }

    async deleteCategory(id: string): Promise<void> {
        let categories = this.getCollection<MenuCategory>('categories');
        categories = categories.filter(c => c.id !== id);
        this.setCollection('categories', categories);
        let items = this.getCollection<MenuItem>('items');
        items = items.filter(i => i.categoryId !== id);
        this.setCollection('items', items);
    }

    // Menu Items
    async getItems(restaurantId: string): Promise<MenuItem[]> {
        const items = this.getCollection<MenuItem>('items');
        return items
            .filter(i => i.restaurantId === restaurantId)
            .sort((a, b) => a.order - b.order);
    }

    async getItemsByCategory(categoryId: string): Promise<MenuItem[]> {
        const items = this.getCollection<MenuItem>('items');
        return items
            .filter(i => i.categoryId === categoryId)
            .sort((a, b) => a.order - b.order);
    }

    async saveItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
        const items = this.getCollection<MenuItem>('items');
        const newItem: MenuItem = {
            ...item,
            id: generateId()
        };
        items.push(newItem);
        this.setCollection('items', items);
        return newItem;
    }

    async updateItem(id: string, data: Partial<MenuItem>): Promise<void> {
        const items = this.getCollection<MenuItem>('items');
        const index = items.findIndex(i => i.id === id);
        if (index >= 0) {
            items[index] = { ...items[index], ...data };
            this.setCollection('items', items);
        }
    }

    async deleteItem(id: string): Promise<void> {
        let items = this.getCollection<MenuItem>('items');
        items = items.filter(i => i.id !== id);
        this.setCollection('items', items);
    }

    // Orders
    async getOrders(restaurantId: string): Promise<Order[]> {
        const orders = this.getCollection<Order>('orders');
        return orders
            .filter(o => o.restaurantId === restaurantId)
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    async saveOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
        const orders = this.getCollection<Order>('orders');
        const newOrder: Order = { ...order, id: generateId(), createdAt: Date.now() };
        orders.push(newOrder);
        this.setCollection('orders', orders);
        return newOrder;
    }

    async updateOrder(id: string, data: Partial<Order>): Promise<void> {
        const orders = this.getCollection<Order>('orders');
        const index = orders.findIndex(o => o.id === id);
        if (index >= 0) {
            orders[index] = { ...orders[index], ...data };
            this.setCollection('orders', orders);
        }
    }

    // Tables
    async getTables(restaurantId: string): Promise<Table[]> {
        const tables = this.getCollection<Table>('tables');
        return tables.filter(t => t.restaurantId === restaurantId).sort((a, b) => a.number - b.number);
    }

    async setupTables(restaurantId: string, count: number): Promise<void> {
        let tables = this.getCollection<Table>('tables');
        tables = tables.filter(t => t.restaurantId !== restaurantId);
        for (let i = 1; i <= count; i++) {
            tables.push({ id: generateId(), restaurantId, number: i, hasActiveCall: false });
        }
        this.setCollection('tables', tables);
    }

    async callWaiter(restaurantId: string, tableNumber: number): Promise<void> {
        const tables = this.getCollection<Table>('tables');
        const table = tables.find(t => t.restaurantId === restaurantId && t.number === tableNumber);
        if (table) {
            table.hasActiveCall = true;
            table.callTime = Date.now();
            this.setCollection('tables', tables);
        }
    }

    async dismissWaiterCall(tableId: string): Promise<void> {
        const tables = this.getCollection<Table>('tables');
        const table = tables.find(t => t.id === tableId);
        if (table) {
            table.hasActiveCall = false;
            table.callTime = undefined;
            this.setCollection('tables', tables);
        }
    }

    // Feedback
    async saveFeedback(data: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> {
        const feedbacks = this.getCollection<Feedback>('feedbacks');
        const feedback: Feedback = {
            ...data,
            id: generateId(),
            createdAt: Date.now()
        };
        feedbacks.push(feedback);
        this.setCollection('feedbacks', feedbacks);
        return feedback;
    }

    async getFeedbacks(restaurantId: string): Promise<Feedback[]> {
        return this.getCollection<Feedback>('feedbacks')
            .filter(f => f.restaurantId === restaurantId)
            .sort((a, b) => b.createdAt - a.createdAt);
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

// Export singleton
export const localDB = new LocalStorageDB();
export { useFirebase, db, auth, generateId, generateSlug };
