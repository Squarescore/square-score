import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, setLogLevel } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getPerformance } from "firebase/performance";

const firebaseConfig = {
  apiKey: "AIzaSyA2lOefmdM38PgaCxczRpW1QCSbocW52cU",
  authDomain: "square-score-ai.firebaseapp.com",
  databaseURL: "https://square-score-ai-default-rtdb.firebaseio.com",
  projectId: "square-score-ai",
  storageBucket: "square-score-ai.appspot.com",
  messagingSenderId: "73489610245",
  appId: "1:73489610245:web:be332826c1ed09b91f0e6c",
  measurementId: "G-CWS62P260H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const performance = getPerformance(app);

// Enable Firestore debug logging in development


export { db, auth, storage };