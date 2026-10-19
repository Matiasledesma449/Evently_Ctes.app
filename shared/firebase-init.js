// shared/firebase-init.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    addDoc, 
    doc, 
    getDoc, 
    updateDoc, 
    query, 
    where,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDD3Kw5RHSoJLD1314xAwSWG4QUQTdHWPA",
    authDomain: "evently-b612b.firebaseapp.com",
    projectId: "evently-b612b",
    storageBucket: "evently-b612b.firebasestorage.app",
    messagingSenderId: "433464825628",
    appId: "1:433464825628:web:1b4848f5ea155379fbccd9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

window.db = db;
window.auth = auth;
window.storage = storage;
window.collection = collection;
window.getDocs = getDocs;
window.addDoc = addDoc;
window.doc = doc;
window.getDoc = getDoc;
window.updateDoc = updateDoc;
window.query = query;
window.where = where;
window.onSnapshot = onSnapshot;
window.serverTimestamp = serverTimestamp;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.onAuthStateChanged = onAuthStateChanged;
window.sendPasswordResetEmail = sendPasswordResetEmail;
window.signOut = signOut;

console.log("🔥 Firebase inicializado correctamente");

// ✅ Prevenir navegación hacia atrás después de cerrar sesión
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        if (!auth.currentUser) {
            window.location.replace('login.html');
        }
    }
});

// ✅ Avisar a otros scripts que Firebase está listo
window.dispatchEvent(new Event('firebase-ready'));