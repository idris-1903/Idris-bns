# Parc Remorques TN ⇄ FR · SMTI

Application web de suivi des remorques entre la Tunisie et la France. Elle fonctionne sur mobile et sur ordinateur, en HTTPS.

- **Hébergement :** GitHub Pages (gratuit, HTTPS)
- **Base de données partagée, sauvegarde automatique en temps réel :** Firebase Firestore (offre gratuite *Spark*)
- **Comptes utilisateurs :** Firebase Authentication (e-mail ou Google)
- **Assistant IA :** Gemini via Firebase AI Logic (offre gratuite)

Aucune carte bancaire n'est nécessaire.

---

## 1. Créer le projet Firebase (10 min)

1. Ouvrez **console.firebase.google.com** avec un compte Google, puis cliquez sur **Créer un projet**. Nommez-le par exemple `parc-smti`. Google Analytics n'est pas nécessaire.
2. Restez sur le forfait **Spark (gratuit)**. N'ajoutez pas de carte bancaire : l'IA gratuite ne fonctionne que sur ce forfait.
3. **Authentication** : cliquez sur *Commencer*, puis ouvrez l'onglet *Méthode de connexion*. Activez **Adresse e-mail/Mot de passe** et **Google**.
4. **Firestore Database** : cliquez sur *Créer une base de données*. Choisissez le mode **production** et l'emplacement `europe-west1` (ou `eur3`).
5. **Firestore → Règles** : remplacez tout le contenu par celui du fichier `firestore.rules`, puis cliquez sur **Publier**.
6. **AI Logic** (dans le menu *Build* ou *IA*) : cliquez sur *Commencer* et choisissez **Gemini Developer API**.
7. **⚙ Paramètres du projet → Vos applications** : cliquez sur l'icône **`</>`** (Web). Donnez un nom à l'application et ne cochez pas *Hosting*. Copiez ensuite le bloc `firebaseConfig` affiché.

## 2. Mettre le site en ligne avec GitHub Pages (5 min)

1. Créez un compte sur **github.com**, puis cliquez sur **New repository**. Nommez-le `parc-remorques` et choisissez **Public**.
2. Cliquez sur **Add file → Upload files** et déposez **tous les fichiers de ce dossier**. Validez avec *Commit changes*.
3. Ouvrez `config.js` et cliquez sur le crayon ✏️. Remplacez les valeurs `COLLER_ICI` par celles de votre `firebaseConfig`, puis validez avec *Commit changes*.
4. Allez dans **Settings → Pages**. Dans *Branch*, choisissez `main` et `/ (root)`, puis cliquez sur **Save**.
5. Après une à deux minutes, le site est en ligne à l'adresse **`https://VOTRE-NOM.github.io/parc-remorques/`**.

## 3. Autoriser le site dans Firebase

Dans **Authentication → Paramètres → Domaines autorisés**, cliquez sur *Ajouter un domaine* et saisissez `VOTRE-NOM.github.io`.

## 4. Premier démarrage (administrateur)

1. Ouvrez le site et cliquez sur **Créer un compte** avec l'adresse de `config.js` (`i.benslimene@smti.com.tn`). Vous pouvez aussi utiliser *Continuer avec Google* avec cette même adresse.
2. Ouvrez le lien de validation reçu par e-mail, puis touchez **« J'ai validé mon e-mail »** en bas de l'écran.
3. Un bandeau propose d'importer les données. Touchez **Choisir le fichier** et sélectionnez `donnees-initiales.json`, qui est fourni à part et ne doit pas être mis sur GitHub. Les 27 remorques et les 8 membres de l'équipe sont alors importés.
4. Touchez **Connexion**, choisissez votre nom (ADMIN), puis créez votre mot de passe de l'application.

## 5. Ajouter les collègues

1. Envoyez-leur l'adresse du site. Chacun crée son compte, puis choisit son nom dans la liste pour demander l'accès.
2. Validez la demande dans l'onglet **Équipe**. La personne crée ensuite son mot de passe de l'application.

Pour installer l'application sur un téléphone, ouvrez le site puis :
- **iPhone :** Partager → *Sur l'écran d'accueil*
- **Android :** menu ⋮ → *Installer l'application*

## Bon à savoir

- **Sauvegarde :** chaque modification est enregistrée immédiatement en ligne. Sans réseau, elle est gardée sur l'appareil et envoyée dès le retour de la connexion.
- **Limites gratuites :** Firestore autorise environ 50 000 lectures et 20 000 écritures par jour, ce qui suffit largement pour une équipe. L'IA gratuite est limitée à quelques requêtes par minute ; en cas de dépassement, l'assistant demande de patienter.
- **Confidentialité de l'IA :** avec l'offre gratuite de Gemini, Google peut utiliser les questions envoyées pour améliorer ses services. N'y mettez pas d'informations confidentielles.
- **Documents scannés :** 6 Mo maximum par fichier. Les photos sont réduites automatiquement.
- **Nom de domaine personnalisé** (ex. `parc.smti.com.tn`) : renseignez-le dans *Settings → Pages → Custom domain*, ajoutez l'enregistrement DNS indiqué par GitHub, puis ajoutez aussi ce domaine dans Firebase (étape 3).
- **Étiquettes QR déjà imprimées :** elles pointent vers l'ancienne adresse Claude, mais le scanner de l'application les reconnaît toujours. Les nouvelles étiquettes pointeront vers le nouveau site.
- **Ajouter un administrateur par e-mail :** ajoutez son adresse dans `config.js` (`ADMINS`) **et** dans `firestore.rules` (`admins()`), puis publiez les règles. Vous pouvez aussi lui donner simplement le rôle *Administrateur* dans l'onglet Équipe.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | L'application |
| `config.js` | **À compléter** : configuration Firebase et administrateurs |
| `firebase-claude.js` | Connexion de l'application à Firebase (base, comptes, IA, fichiers) |
| `firestore.rules` | Règles de sécurité à coller dans Firebase |
| `manifest.webmanifest`, `icon-*.png` | Installation sur l'écran d'accueil du téléphone |
