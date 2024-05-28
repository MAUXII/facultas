// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { GithubAuthProvider, GoogleAuthProvider, getAuth, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBrJUzmFNY0D8NSSVcZhUXyBbQF0p4X35U",
  authDomain: "presencetrack-31fa4.firebaseapp.com",
  projectId: "presencetrack-31fa4",
  storageBucket: "presencetrack-31fa4.appspot.com",
  messagingSenderId: "736668627790",
  appId: "1:736668627790:web:a96d2ff3fef3c7162da41f",
  measurementId: "G-8FRZ82VPZM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const githubProvider = new GithubAuthProvider();
const googleProvider = new GoogleAuthProvider();

const db = getFirestore(app);


export { githubProvider, googleProvider, db, signInWithPopup, signOut  };
