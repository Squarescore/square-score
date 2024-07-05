import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import the storage module
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const storage = getStorage(app); // Initialize the storage service

export { db, auth, storage };