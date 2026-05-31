// Firebase Configuration - The Officer's Ascent
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2Z_m1Te4haUugGqhn-EKdLh27Fg2_dYM",
  authDomain: "the-officers-ascent.firebaseapp.com",
  projectId: "the-officers-ascent",
  storageBucket: "the-officers-ascent.firebasestorage.app",
  messagingSenderId: "394780789406",
  appId: "1:394780789406:web:ae7cc63dd57fe8cad9c98f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, ref, uploadBytes, getDownloadURL, collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp };
