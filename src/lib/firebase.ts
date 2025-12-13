import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB1TWCK01NxHxTC6W01_1Yrb-JfdeI-ZFs",
  authDomain: "school-e54d1.firebaseapp.com",
  projectId: "school-e54d1",
  storageBucket: "school-e54d1.firebasestorage.app",
  messagingSenderId: "617634728760",
  appId: "1:617634728760:web:49ae7611c5d50150d80fcd",
  measurementId: "G-KZB64E930F"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);