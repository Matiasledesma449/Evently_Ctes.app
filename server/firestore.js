// server/firestore.js
// Conexion unica a Firestore con la cuenta de servicio dedicada a los pagos
// (rol "Cloud Datastore User"). El Admin SDK no pasa por las reglas de Firestore.
// Esta cuenta es la unica que escribe en `ventas`.
//
// IMPORTANTE: este archivo nunca imprime las variables ni sus valores.

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { requerir, VARIABLES } = require('./config');

// En Vercel la clave privada suele guardarse con los saltos de linea escritos
// como "\n" (dos caracteres). Los convertimos a saltos de linea reales.
function normalizarClavePrivada(clave) {
  return clave.replace(/\\n/g, '\n');
}

// Devuelve la base de datos. La app se crea una sola vez por proceso:
// las llamadas siguientes (o las funciones que reusan la instancia) la reutilizan.
// Si falta alguna variable, lanza ConfigError y no crea nada.
function obtenerDb() {
  if (getApps().length === 0) {
    const v = requerir([
      VARIABLES.FIREBASE_PROJECT_ID,
      VARIABLES.FIREBASE_CLIENT_EMAIL,
      VARIABLES.FIREBASE_PRIVATE_KEY,
    ]);
    initializeApp({
      credential: cert({
        projectId: v.FIREBASE_PROJECT_ID,
        clientEmail: v.FIREBASE_CLIENT_EMAIL,
        privateKey: normalizarClavePrivada(v.FIREBASE_PRIVATE_KEY),
      }),
    });
  }
  return getFirestore();
}

module.exports = { obtenerDb, normalizarClavePrivada, FieldValue, Timestamp };
