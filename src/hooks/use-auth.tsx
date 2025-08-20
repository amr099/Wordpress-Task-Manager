import { useState, useEffect } from "react";
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import type { User } from "@shared/schema";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up auth listener...");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email || "No user");
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          console.log("User authenticated, checking Firestore document...");
          // Check if user exists in Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            console.log("User data found:", userData);
            setUser(userData);
          } else {
            // User needs to set display name
            console.log("User document not found, needs to create profile");
            setUser(null);
          }
        } catch (error) {
          console.error("Error checking user document:", error);
          // On error, still set loading to false and let user try to create profile
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log("Starting Google sign in...");
      console.log("Firebase config check:", {
        apiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        appId: !!import.meta.env.VITE_FIREBASE_APP_ID
      });
      
      // Use popup instead of redirect for better debugging
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Sign in successful:", result.user.email);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const createUserProfile = async (displayName: string) => {
    if (!firebaseUser) return;

    const isAdmin = firebaseUser.email === "amr90ahmad@gmail.com";
    
    const userData: Omit<User, 'id' | 'createdAt'> = {
      email: firebaseUser.email!,
      displayName,
      isAdmin: isAdmin ? "true" : "false",
    };

    await setDoc(doc(db, "users", firebaseUser.uid), {
      ...userData,
      id: firebaseUser.uid,
      createdAt: new Date(),
    });

    setUser({
      ...userData,
      id: firebaseUser.uid,
      createdAt: new Date(),
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  return {
    user,
    firebaseUser,
    loading,
    signInWithGoogle,
    createUserProfile,
    logout,
    isAdmin: user?.isAdmin === "true",
  };
}
