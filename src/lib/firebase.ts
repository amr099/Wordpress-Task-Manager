import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDHy0hoZzOK8LKzAO_V8Z006c7kTgFoi-c",
  authDomain: "wordpress-task-manager.firebaseapp.com",
  projectId: "wordpress-task-manager",
  storageBucket: "wordpress-task-manager.firebasestorage.app",
  messagingSenderId: "773790565762",
  appId: "1:773790565762:web:17c13c3cc93b8bfe44bb9b",
  measurementId: "G-7K2RZK8162"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
