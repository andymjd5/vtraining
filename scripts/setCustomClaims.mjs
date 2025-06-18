import admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json" with { type: "json" };

// Initialisation de Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// UID de l'utilisateur superadmin
const uid = "bMLRyiYWBRXfUfUxDEjH1fjuDm13";

// Claims personnalisés à définir (correspondant à la base de données)
const customClaims = {
  role: "SUPER_ADMIN"  // Corrigé pour correspondre à la valeur dans Firestore
};

// Application des claims
admin.auth().setCustomUserClaims(uid, customClaims)
  .then(() => {
    console.log("Custom claims définis avec succès.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Erreur lors de la définition des custom claims:", error);
    process.exit(1);
  });