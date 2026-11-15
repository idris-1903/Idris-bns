/* =====================================================================
   CONFIGURATION — le seul fichier à modifier.
   1) Collez ci-dessous la configuration de VOTRE projet Firebase
      (Console Firebase → ⚙ Paramètres du projet → Vos applications → </> Web).
   2) Mettez l'adresse e-mail des administrateurs dans ADMINS
      (la même liste que dans firestore.rules).
   ===================================================================== */
window.PARC_CONFIG = {
  firebase: {
    apiKey: "COLLER_ICI",
    authDomain: "COLLER_ICI.firebaseapp.com",
    projectId: "COLLER_ICI",
    storageBucket: "COLLER_ICI.firebasestorage.app",
    messagingSenderId: "COLLER_ICI",
    appId: "COLLER_ICI"
  },

  // Administrateurs (adresse e-mail du compte de connexion, en minuscules)
  ADMINS: ["i.benslimene@smti.com.tn"],

  // Modèle d'IA Gemini (offre gratuite). Laissez tel quel sauf si Google le retire.
  MODELE_IA: "gemini-flash-latest",
  MODELE_IA_SECOURS: "gemini-2.5-flash"
};
