// shared/firebase-init.js

// Importar Firebase (desde CDN)
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
    where 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Tu configuración de Firebase (la que me diste)
const firebaseConfig = {
    apiKey: "AIzaSyDD3Kw5RHSoJLD1314xAwSWG4QUQTdHWPA",
    authDomain: "evently-b612b.firebaseapp.com",
    projectId: "evently-b612b",
    storageBucket: "evently-b612b.firebasestorage.app",
    messagingSenderId: "433464825628",
    appId: "1:433464825628:web:1b4848f5ea155379fbccd9"
};

// Inicializar
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Exportar todo para que esté disponible globalmente
window.db = db;
window.auth = auth;
window.collection = collection;
window.getDocs = getDocs;
window.addDoc = addDoc;
window.doc = doc;
window.getDoc = getDoc;
window.updateDoc = updateDoc;
window.query = query;
window.where = where;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.onAuthStateChanged = onAuthStateChanged;

console.log("🔥 Firebase inicializado correctamente");