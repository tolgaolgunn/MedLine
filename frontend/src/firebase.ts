import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "PLACEHOLDER_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "placeholder-app.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "placeholder-project",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "placeholder-project.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

let app;
let messaging: Messaging | null = null;

try {
    app = initializeApp(firebaseConfig);
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        messaging = getMessaging(app);
    }
} catch (error) {
    console.warn('Firebase initialization failed (expected if config is missing):', error);
}

export { app, messaging, onMessage };
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const requestPermission = async () => {
    if (!messaging) return null;

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY
            });
            return token;
        }
    } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
    }
    return null;
};
export const requestPermission = async () => {
    if (!messaging) return null;

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            // Service Worker'ı manuel olarak kaydedip getToken'a paslıyoruz
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration // Bu satır 404 hatasını çözer
            });

            return token;
        }
    } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
    }
    return null;
};