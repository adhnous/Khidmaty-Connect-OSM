// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDr43GAZFdLh674vZOzlXR_OawyFP0arRY",
  authDomain: "khidmaty-connect-2d512.firebaseapp.com",
  projectId: "khidmaty-connect-2d512",
  storageBucket: "khidmaty-connect-2d512.appspot.com",
  messagingSenderId: "587434148277",
  appId: "1:587434148277:web:1a1aeec6f34435023fd9fc"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
