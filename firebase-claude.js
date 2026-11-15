/* =====================================================================
   Pont Firebase pour « Parc Remorques TN ⇄ FR »
   ---------------------------------------------------------------------
   L'application a été écrite pour claude.ai, qui lui fournit window.claude
   (base partagée, utilisateur, IA, fichiers, téléchargements).
   Ce fichier fournit exactement les mêmes services, mais avec Firebase :
     - db        → Cloud Firestore (temps réel, sauvegarde automatique, hors ligne)
     - user      → Firebase Authentication (e-mail + mot de passe, ou Google)
     - sample    → Gemini via Firebase AI Logic (offre gratuite)
     - assets    → documents scannés stockés dans Firestore (sans carte bancaire)
     - downloads → téléchargement direct dans le navigateur
   Rien n'est à modifier ici : la configuration est dans config.js.
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.PARC_CONFIG || {};
  var V = '12.15.0', CDN = CFG.CDN || ('https://www.gstatic.com/firebasejs/' + V + '/');
  var ADMINS = (CFG.ADMINS || []).map(function (s) { return String(s).trim().toLowerCase(); });
  var configured = !!(CFG.firebase && CFG.firebase.apiKey && !/COLLER_ICI/.test(CFG.firebase.apiKey + CFG.firebase.projectId));

  function E(code, message, extra) { var e = new Error(message || code); e.code = code; if (extra) Object.assign(e, extra); return e; }
  function mapErr(e) {
    if (e && e.code && !/\//.test(e.code) && !/-/.test(e.code)) return e;
    var c = String((e && e.code) || '');
    if (/permission-denied|unauthenticated/.test(c)) return E('invalid_argument', e.message);
    if (/resource-exhausted/.test(c)) return E('quota_exceeded', e.message);
    if (/not-found/.test(c)) return E('not_found', e.message);
    return E(c || 'unknown', e && e.message);
  }
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ------------------------------------------------------------------ */
  /* Écran de connexion                                                  */
  /* ------------------------------------------------------------------ */
  var CSS = '' +
    '#fbGate{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:flex-end;padding:24px;' +
    'background:#0a1a3a url(connexion.jpg) center/cover no-repeat;font-family:"IBM Plex Sans",system-ui,-apple-system,sans-serif;color:#0d1f3a}' +
    '#fbGate::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,18,44,.15),rgba(6,18,44,.55))}' +
    '@media (max-width:760px),(orientation:portrait){#fbGate{background-image:url(connexion-mobile.jpg);background-position:top center;align-items:flex-end;justify-content:center;padding:16px}' +
    '#fbGate::before{background:linear-gradient(180deg,rgba(6,18,44,0) 35%,rgba(6,18,44,.75))}}' +
    '#fbGate .card{position:relative;width:100%;max-width:400px;background:#fff;border-radius:14px;padding:24px 22px;box-shadow:0 20px 60px rgba(0,0,0,.35)}' +
    '#fbGate img.logo{height:46px;width:auto;max-width:70%;object-fit:contain;display:block;margin-bottom:10px}' +
    '#fbGate h1{font:700 26px/1.1 "Barlow Condensed",Arial Narrow,sans-serif;margin:0 0 4px;letter-spacing:.2px}' +
    '#fbGate .sub{color:#5d6b80;font-size:14px;margin:0 0 16px}' +
    '#fbGate .tabs{display:flex;gap:6px;background:#f1f4f8;border-radius:9px;padding:4px;margin-bottom:14px}' +
    '#fbGate .tabs button{flex:1;border:0;background:none;padding:9px;border-radius:7px;font:600 14px inherit;font-family:inherit;color:#5d6b80;cursor:pointer}' +
    '#fbGate .tabs button.on{background:#fff;color:#0d1f3a;box-shadow:0 1px 3px rgba(0,0,0,.12)}' +
    '#fbGate label{display:block;font-size:13px;font-weight:600;margin:10px 0 5px}' +
    '#fbGate input{width:100%;box-sizing:border-box;border:1px solid #c9d2de;border-radius:8px;padding:12px;font:16px inherit;font-family:inherit}' +
    '#fbGate input:focus{outline:2px solid #0b5fa8;border-color:#0b5fa8}' +
    '#fbGate .btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:14px;padding:12px;border-radius:8px;border:1px solid #c9d2de;background:#fff;font:600 15px inherit;font-family:inherit;cursor:pointer;color:#0d1f3a}' +
    '#fbGate .btn.primary{background:#0b5fa8;border-color:#0b5fa8;color:#fff}' +
    '#fbGate .btn:disabled{opacity:.6;cursor:wait}' +
    '#fbGate .or{display:flex;align-items:center;gap:10px;color:#8a96a8;font-size:12px;margin:14px 0 0}' +
    '#fbGate .or::before,#fbGate .or::after{content:"";flex:1;height:1px;background:#dde3eb}' +
    '#fbGate .link{background:none;border:0;color:#0b5fa8;font:500 13px inherit;font-family:inherit;padding:0;margin-top:12px;cursor:pointer;text-decoration:underline}' +
    '#fbGate .msg{font-size:13px;margin-top:10px;min-height:1em}#fbGate .msg.err{color:#b3261e}#fbGate .msg.ok{color:#2e7d4f}' +
    '#fbGate .foot{font-size:11.5px;color:#8a96a8;margin-top:14px;line-height:1.4}' +
    '#fbChip{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:2147482000;background:rgba(13,31,58,.92);color:#fff;' +
    'font:12.5px "IBM Plex Sans",system-ui,sans-serif;border-radius:999px;padding:7px 8px 7px 14px;display:flex;gap:10px;align-items:center;max-width:94vw;box-shadow:0 6px 20px rgba(0,0,0,.25)}' +
    '#fbChip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '#fbChip button{border:0;background:#fff;color:#0d1f3a;border-radius:999px;padding:5px 11px;font:600 12px inherit;font-family:inherit;cursor:pointer;white-space:nowrap}' +
    '#fbBanner{position:fixed;top:calc(10px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);z-index:2147482500;background:#fff;color:#0d1f3a;border:1px solid #c9d2de;' +
    'border-radius:12px;padding:12px 14px;box-shadow:0 10px 30px rgba(0,0,0,.2);font:14px "IBM Plex Sans",system-ui,sans-serif;max-width:94vw;width:440px}' +
    '#fbBanner .row{display:flex;gap:8px;margin-top:10px}#fbBanner button{flex:1;padding:9px;border-radius:8px;border:1px solid #c9d2de;background:#fff;font:600 13px inherit;font-family:inherit;cursor:pointer}' +
    '#fbBanner button.primary{background:#0b5fa8;border-color:#0b5fa8;color:#fff}';

  function injectCSS() { if (document.getElementById('fbCss')) return; var s = document.createElement('style'); s.id = 'fbCss'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s); }
  function whenBody() { return document.body ? Promise.resolve() : new Promise(function (r) { document.addEventListener('DOMContentLoaded', r, { once: true }); }); }

  var GOOGLE_IC = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

  function authMsg(e) {
    var c = String((e && e.code) || '');
    if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return 'E-mail ou mot de passe incorrect.';
    if (/email-already-in-use/.test(c)) return 'Un compte existe déjà avec cet e-mail : utilisez « Se connecter ».';
    if (/weak-password/.test(c)) return 'Mot de passe trop court (8 caractères minimum).';
    if (/invalid-email|missing-email/.test(c)) return 'Adresse e-mail invalide.';
    if (/too-many-requests/.test(c)) return 'Trop de tentatives. Réessayez dans quelques minutes.';
    if (/network-request-failed/.test(c)) return 'Pas de connexion internet.';
    if (/popup-closed|cancelled-popup/.test(c)) return '';
    if (/unauthorized-domain/.test(c)) return "Ce site n'est pas encore autorisé : ajoutez son adresse dans Firebase → Authentication → Paramètres → Domaines autorisés.";
    if (/operation-not-allowed/.test(c)) return 'Cette méthode de connexion n\'est pas activée dans Firebase (Authentication → Méthodes de connexion).';
    return 'Connexion impossible pour le moment (' + c + ').';
  }

  function showSetup() {
    injectCSS();
    whenBody().then(function () {
      var g = document.createElement('div'); g.id = 'fbGate';
      g.innerHTML = '<div class="card"><img class="logo" src="logo-smti-color.png" alt="SMTI"><h1>Configuration à terminer</h1>' +
        '<p class="sub">Le site est en ligne, mais il n\'est pas encore relié à votre base Firebase.</p>' +
        '<p style="font-size:14px;line-height:1.5">Ouvrez le fichier <b>config.js</b> sur GitHub, collez la configuration de votre projet Firebase à la place des « COLLER_ICI », puis enregistrez. Le site se met à jour en une minute environ.</p></div>';
      document.body.appendChild(g);
    });
  }

  var pendingName = '';
  function gate(auth, A) {
    return new Promise(function (resolve) {
      var shown = null, mode = 'login';
      function hide() { if (shown) { shown.remove(); shown = null; } }
      function render() {
        var g = shown;
        g.innerHTML = '<div class="card" role="dialog" aria-labelledby="fbT">' +
          '<img class="logo" src="logo-smti-color.png" alt="SMTI Transport & Logistics">' +
          '<h1 id="fbT">Parc Remorques TN ⇄ FR</h1>' +
          '<p class="sub">Espace réservé aux équipes SMTI et partenaires.</p>' +
          '<div class="tabs"><button type="button" data-m="login" class="' + (mode === 'login' ? 'on' : '') + '">Se connecter</button>' +
          '<button type="button" data-m="signup" class="' + (mode === 'signup' ? 'on' : '') + '">Créer un compte</button></div>' +
          '<form id="fbF" novalidate>' +
          '<label for="fbE">E-mail professionnel</label><input id="fbE" type="email" autocomplete="email" inputmode="email" required>' +
          '<label for="fbP">Mot de passe' + (mode === 'signup' ? ' · 8 caractères minimum' : '') + '</label>' +
          '<input id="fbP" type="password" autocomplete="' + (mode === 'signup' ? 'new-password' : 'current-password') + '" required>' +
          (mode === 'signup' ? '<label for="fbN">Prénom et nom</label><input id="fbN" type="text" autocomplete="name">' : '') +
          '<button class="btn primary" type="submit" id="fbGo">' + (mode === 'signup' ? 'Créer mon compte' : 'Se connecter') + '</button></form>' +
          '<div class="or">ou</div><button class="btn" type="button" id="fbG">' + GOOGLE_IC + 'Continuer avec Google</button>' +
          (mode === 'login' ? '<button class="link" type="button" id="fbR">Mot de passe oublié ?</button>' : '') +
          '<div class="msg" id="fbM" aria-live="polite"></div>' +
          '<div class="foot">Après la création du compte, demandez l\'accès dans l\'application avec votre identifiant : un administrateur le valide.</div></div>';
        g.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { mode = b.dataset.m; render(); }; });
        var M = g.querySelector('#fbM');
        var say = function (t, ok) { M.textContent = t || ''; M.className = 'msg ' + (ok ? 'ok' : 'err'); };
        var busy = function (on) { g.querySelectorAll('button').forEach(function (b) { b.disabled = on; }); };
        g.querySelector('#fbF').onsubmit = function (ev) {
          ev.preventDefault();
          var em = g.querySelector('#fbE').value.trim(), pw = g.querySelector('#fbP').value;
          if (!em) return say('Saisissez votre e-mail.');
          if (mode === 'signup' && pw.length < 8) return say('Le mot de passe doit contenir au moins 8 caractères.');
          busy(true); say('');
          pendingName = mode === 'signup' ? ((g.querySelector('#fbN') || {}).value || '').trim() : '';
          var p = mode === 'signup'
            ? A.createUserWithEmailAndPassword(auth, em, pw).then(function (cr) {
                var n = pendingName;
                return Promise.all([n ? A.updateProfile(cr.user, { displayName: n }) : null, A.sendEmailVerification(cr.user).catch(function () {})]);
              })
            : A.signInWithEmailAndPassword(auth, em, pw);
          p.catch(function (e) { busy(false); say(authMsg(e)); });
        };
        g.querySelector('#fbG').onclick = function () {
          busy(true); say('');
          var pr = new A.GoogleAuthProvider(); pr.setCustomParameters({ prompt: 'select_account' });
          A.signInWithPopup(auth, pr).catch(function (e) {
            if (/popup-blocked|operation-not-supported/.test(e.code || '')) return A.signInWithRedirect(auth, pr);
            busy(false); say(authMsg(e));
          });
        };
        var r = g.querySelector('#fbR');
        if (r) r.onclick = function () {
          var em = g.querySelector('#fbE').value.trim();
          if (!em) return say('Saisissez d\'abord votre e-mail ci-dessus.');
          A.sendPasswordResetEmail(auth, em).then(function () { say('Un e-mail de réinitialisation vient d\'être envoyé (vérifiez aussi les spams).', true); }, function (e) { say(authMsg(e)); });
        };
      }
      A.getRedirectResult(auth).catch(function () {});
      A.onAuthStateChanged(auth, function (u) {
        if (u) { hide(); resolve(u); return; }
        injectCSS();
        whenBody().then(function () {
          if (shown) return;
          shown = document.createElement('div'); shown.id = 'fbGate'; document.body.appendChild(shown); render();
        });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Démarrage Firebase                                                  */
  /* ------------------------------------------------------------------ */
  var boot = (async function () {
    if (!configured) { showSetup(); return new Promise(function () {}); }
    var mods = await Promise.all([import(CDN + 'firebase-app.js'), import(CDN + 'firebase-auth.js'), import(CDN + 'firebase-firestore.js')]);
    var FA = mods[0], A = mods[1], F = mods[2];
    var app = FA.initializeApp(CFG.firebase);
    var auth = A.getAuth(app);
    var fdb;
    try { fdb = F.initializeFirestore(app, { ignoreUndefinedProperties: true, localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) }); }
    catch (e) { fdb = F.initializeFirestore(app, { ignoreUndefinedProperties: true }); }
    var u = await gate(auth, A);
    var email = String(u.email || '').toLowerCase();
    var adminByEmail = ADMINS.indexOf(email) >= 0 && !!u.emailVerified;
    var ctx = { app: app, auth: auth, A: A, F: F, fdb: fdb, u: u, email: email, adminByEmail: adminByEmail, owner: adminByEmail && email === ADMINS[0] };
    F.setDoc(F.doc(fdb, 'profils/' + u.uid), { name: u.displayName || pendingName || email, email: email, vu: new Date().toISOString() }, { merge: true }).catch(function () {});
    whenBody().then(function () { accountChip(ctx); if (adminByEmail) offerImport(ctx); });
    return ctx;
  })();
  boot.catch(function (e) { console.error('[Firebase]', e); });

  /* Bandeau compte (visible sur l'écran d'accueil de l'application) */
  function accountChip(c) {
    injectCSS();
    var ch = document.createElement('div'); ch.id = 'fbChip'; ch.hidden = true;
    var needVerify = ADMINS.indexOf(c.email) >= 0 && !c.u.emailVerified;
    ch.innerHTML = '<span>' + esc(c.email) + '</span>' +
      (needVerify ? '<button type="button" id="fbVer">J\'ai validé mon e-mail</button>' : '') +
      '<button type="button" id="fbOut">Changer de compte</button>';
    document.body.appendChild(ch);
    ch.querySelector('#fbOut').onclick = function () { try { sessionStorage.clear(); localStorage.removeItem('smti_sess'); } catch (e) {} c.A.signOut(c.auth).then(function () { location.reload(); }); };
    var v = ch.querySelector('#fbVer');
    if (v) {
      c.A.sendEmailVerification(c.u).catch(function () {});
      v.onclick = function () { c.u.reload().then(function () { return c.u.getIdToken(true); }).then(function () { location.reload(); }); };
    }
    var acc = document.getElementById('accueil');
    var sync = function () { ch.hidden = !(acc && !acc.hidden) && !needVerify; };
    if (acc) new MutationObserver(sync).observe(acc, { attributes: true, attributeFilter: ['hidden'] });
    sync();
  }

  /* Import unique des données de l'ancienne version (Claude).
     Le fichier est choisi sur l'appareil de l'administrateur : il n'est jamais publié sur GitHub. */
  async function offerImport(c) {
    var F = c.F;
    try {
      var s = await F.getDocsFromServer(F.query(F.collection(c.fdb, 'remorques'), F.limit(1)));
      if (!s.empty) return;
      var b = document.createElement('div'); b.id = 'fbBanner';
      b.innerHTML = '<b>La base est vide.</b> Importer les données de l\'ancienne version ?<div style="color:#5d6b80;font-size:13px;margin-top:4px">Choisissez le fichier <b>donnees-initiales.json</b> reçu avec l\'application.</div>' +
        '<div class="row"><button type="button" id="fbNo">Plus tard</button><button type="button" class="primary" id="fbYes">Choisir le fichier</button></div>' +
        '<input type="file" id="fbFile" accept=".json,application/json" hidden>';
      document.body.appendChild(b);
      var inp = b.querySelector('#fbFile');
      b.querySelector('#fbNo').onclick = function () { b.remove(); };
      b.querySelector('#fbYes').onclick = function () { inp.click(); };
      inp.onchange = async function () {
        var f = inp.files && inp.files[0]; if (!f) return;
        var data; try { data = JSON.parse(await f.text()); } catch (e) { b.querySelector('div').textContent = 'Ce fichier n\'est pas lisible. Choisissez donnees-initiales.json.'; return; }
        var nR = Object.keys(data.remorques || {}).length, nE = Object.keys(data.equipe || {}).length;
        if (!nR && !nE) { b.querySelector('div').textContent = 'Aucune donnée trouvée dans ce fichier.'; return; }
        b.innerHTML = '<b>Import en cours…</b>';
        try {
          var batch = F.writeBatch(c.fdb);
          Object.entries(data.equipe || {}).forEach(function (kv) { batch.set(F.doc(c.fdb, 'equipe/' + kv[0]), kv[1]); });
          Object.entries(data.remorques || {}).forEach(function (kv) { batch.set(F.doc(c.fdb, 'remorques/' + kv[0]), kv[1]); });
          batch.set(F.doc(c.fdb, 'journal/' + Date.now() + '-import'), { at: new Date().toISOString(), uid: c.u.uid, m: '', nom: c.u.displayName || c.email, cote: 'ALL', action: 'Import des données', immat: '', detail: nR + ' remorques · ' + nE + ' membres' });
          await batch.commit();
          b.innerHTML = '<b>Import terminé.</b> ' + nR + ' remorques et ' + nE + ' membres sont en ligne.';
          setTimeout(function () { b.remove(); }, 4000);
        } catch (e) { b.innerHTML = '<b>Import impossible.</b> Vérifiez que les règles Firestore sont publiées et que votre e-mail figure dans la liste des administrateurs.'; console.error(e); }
      };
    } catch (e) { /* hors ligne : on réessaiera au prochain chargement */ }
  }

  /* ------------------------------------------------------------------ */
  /* db : API de type Firestore attendue par l'application              */
  /* ------------------------------------------------------------------ */
  function makeDb(c) {
    var F = c.F, fdb = c.fdb;
    var wrapDoc = function (s) { var ex = s.exists(); return { id: s.id, exists: ex, data: function () { return ex ? s.data() : undefined; } }; };
    var wrapQ = function (s) { return { size: s.size, empty: s.empty, docs: s.docs.map(function (d) { return { id: d.id, exists: true, data: function () { return d.data(); } }; }) }; };

    async function write(op, path, ref, data) {
      try {
        var seg = path.split('/');
        if (seg[0] === 'equipe' && seg.length === 2) {
          // Tient à jour « acces/<uid> », utilisé par les règles de sécurité.
          var before = await F.getDoc(ref), prev = before.exists() ? before.data() : null;
          var next = op === 'delete' ? null : op === 'set' ? data : Object.assign({}, prev || {}, data);
          var b = F.writeBatch(fdb);
          if (op === 'set') b.set(ref, data); else if (op === 'update') b.update(ref, data); else b.delete(ref);
          var pu = prev && prev.uid, nu = next && next.uid;
          if (pu && pu !== nu) b.delete(F.doc(fdb, 'acces/' + pu));
          if (nu) b.set(F.doc(fdb, 'acces/' + nu), { m: seg[1], role: next.role || '', cote: next.cote || '' });
          await b.commit();
          return;
        }
        var p = op === 'set' ? F.setDoc(ref, data) : op === 'update' ? F.updateDoc(ref, data) : F.deleteDoc(ref);
        if (!navigator.onLine) { p.catch(function (e) { console.warn('[sync]', e); }); return; } // enregistré localement, envoyé au retour du réseau
        await p;
      } catch (e) { throw mapErr(e); }
    }
    function docApi(path) {
      var ref = F.doc(fdb, path);
      return {
        id: ref.id, path: path,
        get: function () { return F.getDoc(ref).then(wrapDoc, function (e) { throw mapErr(e); }); },
        set: function (d) { return write('set', path, ref, d); },
        update: function (d) { return write('update', path, ref, d); },
        delete: function () { return write('delete', path, ref); },
        onSnapshot: function (cb, onErr) { return F.onSnapshot(ref, function (s) { cb(wrapDoc(s)); }, function (e) { if (onErr) onErr(mapErr(e)); }); }
      };
    }
    function colApi(path, cons) {
      cons = cons || [];
      var q = function () { return cons.length ? F.query.apply(null, [F.collection(fdb, path)].concat(cons)) : F.collection(fdb, path); };
      return {
        orderBy: function (f, dir) { return colApi(path, cons.concat(F.orderBy(f, dir || 'asc'))); },
        limit: function (n) { return colApi(path, cons.concat(F.limit(n))); },
        where: function (f, op, v) { return colApi(path, cons.concat(F.where(f, op, v))); },
        doc: function (id) { return docApi(path + '/' + id); },
        get: function () { return F.getDocs(q()).then(wrapQ, function (e) { throw mapErr(e); }); },
        onSnapshot: function (cb, onErr) {
          // Accès pas encore validé : on affiche une liste vide et on réessaie toutes les 15 s,
          // pour que les données apparaissent dès qu'un administrateur valide la demande.
          var unsub = null, stop = false, timer = null, emptied = false;
          var sub = function () {
            unsub = F.onSnapshot(q(), function (s) { cb(wrapQ(s)); }, function (e) {
              if (/permission-denied/.test(String(e && e.code))) {
                if (!emptied) { emptied = true; cb({ size: 0, empty: true, docs: [] }); }
                if (!stop) timer = setTimeout(sub, 15000);
              } else if (onErr) onErr(mapErr(e));
            });
          };
          sub();
          return function () { stop = true; clearTimeout(timer); if (unsub) unsub(); };
        }
      };
    }
    return { doc: docApi, collection: function (p) { return colApi(p); } };
  }

  /* ------------------------------------------------------------------ */
  /* user                                                                */
  /* ------------------------------------------------------------------ */
  function makeUser(c) {
    var F = c.F;
    var accRole = null;
    var loadAcc = function () { return accRole !== null ? Promise.resolve(accRole) : F.getDoc(F.doc(c.fdb, 'acces/' + c.u.uid)).then(function (s) { accRole = s.exists() ? (s.data().role || '') : ''; return accRole; }, function () { accRole = ''; return ''; }); };
    return {
      id: function () { return Promise.resolve(c.u.uid); },
      can: function () { return Promise.resolve(true); },
      canEdit: function () { return c.adminByEmail ? Promise.resolve(true) : loadAcc().then(function (r) { return r === 'admin'; }); },
      isOwner: function () { return Promise.resolve(!!c.owner); },
      profiles: async function (ids) {
        var out = {};
        await Promise.all((ids || []).map(function (id) {
          return F.getDoc(F.doc(c.fdb, 'profils/' + id)).then(function (s) { if (s.exists()) { var d = s.data(); out[id] = { name: d.name || d.email || 'Compte', email: d.email || '' }; } }, function () {});
        }));
        return out;
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Fichiers (documents scannés) — stockés en morceaux dans Firestore   */
  /* ------------------------------------------------------------------ */
  function toB64(blob) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1] || ''); }; r.onerror = rej; r.readAsDataURL(blob); }); }
  async function shrinkImage(file, max, q) {
    try {
      var bmp = await createImageBitmap(file);
      var k = Math.min(1, max / Math.max(bmp.width, bmp.height));
      var cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      var g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(bmp, 0, 0, cv.width, cv.height);
      return await new Promise(function (r) { cv.toBlob(function (b) { r(b || file); }, 'image/jpeg', q); });
    } catch (e) { return file; }
  }
  var MAX_BYTES = 6 * 1024 * 1024, CHUNK = 900000;
  function makeAssets(c) {
    var F = c.F, fdb = c.fdb;
    return {
      upload: async function (file, o) {
        var ct = (o && o.type) || file.type || 'application/octet-stream', blob = file;
        if (/^image\/(jpeg|png|webp)$/.test(ct)) { blob = await shrinkImage(file, 2000, 0.82); ct = blob.type || ct; }
        if (blob.size > MAX_BYTES) throw E('too_large');
        var id = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        var b64 = await toB64(blob), n = Math.max(1, Math.ceil(b64.length / CHUNK));
        try {
          for (var i = 0; i < n; i++) await F.setDoc(F.doc(fdb, 'blobs/' + id + '/parts/' + i), { d: b64.slice(i * CHUNK, (i + 1) * CHUNK) });
          await F.setDoc(F.doc(fdb, 'blobs/' + id), { ct: ct, size: blob.size, n: n, by: c.u.uid, at: new Date().toISOString() });
        } catch (e) { throw mapErr(e); }
        return { id: id, contentType: ct, sizeBytes: blob.size };
      },
      delete: async function (id) {
        var m = await F.getDoc(F.doc(fdb, 'blobs/' + id)); var n = m.exists() ? (m.data().n || 1) : 0;
        for (var i = 0; i < n; i++) await F.deleteDoc(F.doc(fdb, 'blobs/' + id + '/parts/' + i)).catch(function () {});
        await F.deleteDoc(F.doc(fdb, 'blobs/' + id)).catch(function () {});
      }
    };
  }
  /* Les vignettes de l'application pointent vers « /_blob/<id> » : on les remplace par le fichier réel. */
  var blobCache = new Map();
  function blobURL(id) {
    if (!blobCache.has(id)) blobCache.set(id, boot.then(async function (c) {
      var F = c.F, m = await F.getDoc(F.doc(c.fdb, 'blobs/' + id)); if (!m.exists()) throw E('not_found');
      var md = m.data(), parts = [];
      for (var i = 0; i < (md.n || 1); i++) parts.push(F.getDoc(F.doc(c.fdb, 'blobs/' + id + '/parts/' + i)));
      var b64 = (await Promise.all(parts)).map(function (p) { return p.exists() ? p.data().d : ''; }).join('');
      var bin = Uint8Array.from(atob(b64), function (ch) { return ch.charCodeAt(0); });
      return URL.createObjectURL(new Blob([bin], { type: md.ct || 'application/octet-stream' }));
    }));
    return blobCache.get(id);
  }
  function fixBlobs(root) {
    if (!root.querySelectorAll) return;
    root.querySelectorAll('img[src^="/_blob/"],a[href^="/_blob/"]').forEach(function (el) {
      var at = el.tagName === 'IMG' ? 'src' : 'href', id = el.getAttribute(at).slice(7);
      el.setAttribute(at, el.tagName === 'IMG' ? 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' : '#');
      blobURL(id).then(function (u) { el.setAttribute(at, u); }, function () { if (el.tagName === 'IMG') el.alt = 'Document introuvable'; });
    });
  }
  whenBody().then(function () {
    new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { fixBlobs(n); if (n.matches && n.matches('img,a')) fixBlobs(n.parentNode || n); } }); }); })
      .observe(document.body, { childList: true, subtree: true });
  });

  /* ------------------------------------------------------------------ */
  /* Téléchargements                                                     */
  /* ------------------------------------------------------------------ */
  var MIME = { xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pdf: 'application/pdf', csv: 'text/csv', json: 'application/json' };
  var downloads = {
    save: function (o) {
      var ext = String(o.filename || '').split('.').pop().toLowerCase();
      var blob = o.data instanceof Blob ? o.data : new Blob([o.data], { type: o.mimeType || MIME[ext] || 'application/octet-stream' });
      var u = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = u; a.download = o.filename || 'export'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 60000);
      return Promise.resolve({ ok: true });
    }
  };

  /* ------------------------------------------------------------------ */
  /* IA : Gemini via Firebase AI Logic                                   */
  /* ------------------------------------------------------------------ */
  var aiMod = null;
  function aiErr(e, text) {
    if (e && e.code && /^(cancelled|rate_limited|not_granted|refused)$/.test(e.code)) return e;
    var s = String((e && (e.message || e.code)) || e);
    if ((e && e.name === 'AbortError') || /abort/i.test(s)) return E('cancelled', '', { text: text });
    if (/429|quota|RESOURCE_EXHAUSTED|rate/i.test(s)) return E('rate_limited', s, { text: text });
    if (/403|PERMISSION|api-not-enabled|not been used|disabled|API key|billing/i.test(s)) return E('not_granted', s);
    if (/SAFETY|blocked|PROHIBITED/i.test(s)) return E('refused', s);
    return E('unknown', s, { text: text });
  }
  async function withModel(json, fn) {
    var c = await boot;
    if (!aiMod) aiMod = await import(CDN + 'firebase-ai.js');
    var ai = aiMod.getAI(c.app, { backend: new aiMod.GoogleAIBackend() });
    var mk = function (name) { return aiMod.getGenerativeModel(ai, { model: name, generationConfig: json ? { responseMimeType: 'application/json' } : { maxOutputTokens: 4096 } }); };
    try { return await fn(mk(CFG.MODELE_IA || 'gemini-flash-latest')); }
    catch (e) {
      if (CFG.MODELE_IA_SECOURS && /404|not found|NOT_FOUND|is not supported/i.test(String(e && e.message))) return await fn(mk(CFG.MODELE_IA_SECOURS));
      throw e;
    }
  }
  function toContents(messages) {
    var out = [];
    (messages || []).forEach(function (m) {
      var role = m.role === 'assistant' ? 'model' : 'user';
      var text = typeof m.content === 'string' ? m.content : Array.isArray(m.content) ? m.content.map(function (p) { return p.text || ''; }).join('\n') : JSON.stringify(m.content);
      var last = out[out.length - 1];
      if (last && last.role === role) last.parts.push({ text: text }); else out.push({ role: role, parts: [{ text: text }] });
    });
    if (out.length && out[0].role !== 'user') out.unshift({ role: 'user', parts: [{ text: '.' }] });
    return out;
  }
  function sample(messages, opts) {
    opts = opts || {};
    var acc = '';
    return withModel(false, async function (model) {
      acc = '';
      var r = await model.generateContentStream({ contents: toContents(messages) }, opts.signal ? { signal: opts.signal } : undefined);
      for await (var ch of r.stream) {
        if (opts.signal && opts.signal.aborted) throw E('cancelled');
        var t = ''; try { t = ch.text(); } catch (_) {}
        if (t) { acc += t; if (opts.onText) opts.onText({ text: acc, delta: t }); }
      }
      var resp = await r.response, cand = resp.candidates && resp.candidates[0];
      return { text: acc, truncated: !!(cand && cand.finishReason === 'MAX_TOKENS') };
    }).catch(function (e) { var x = aiErr(e, acc); if (x.code === 'cancelled') x.text = acc; throw x; });
  }
  sample.json = function (prompt, opts) {
    opts = opts || {};
    return (async function () {
      var parts = [{ text: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) }];
      for (var f of (opts.images || [])) {
        var b = f; if (/^image\//.test(f.type || '') && f.size > 1500000) b = await shrinkImage(f, 2000, 0.85);
        parts.push({ inlineData: { mimeType: b.type || 'image/jpeg', data: await toB64(b) } });
      }
      return withModel(true, async function (model) {
        var r = await model.generateContent({ contents: [{ role: 'user', parts: parts }] });
        var t = String(r.response.text() || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        try { return JSON.parse(t); } catch (e) { throw E('invalid_output', 'Réponse IA illisible'); }
      });
    })().catch(function (e) { throw e && e.code === 'invalid_output' ? e : aiErr(e); });
  };

  /* ------------------------------------------------------------------ */
  /* window.claude.use(...) : point d'entrée attendu par l'application   */
  /* ------------------------------------------------------------------ */
  var cache = {};
  window.claude = {
    use: function (name) {
      if (!cache[name]) cache[name] = boot.then(function (c) {
        switch (name) {
          case 'db': return makeDb(c);
          case 'user': return makeUser(c);
          case 'downloads': return downloads;
          case 'sample': return sample;
          case 'assets': return makeAssets(c);
          default: return null;
        }
      });
      return cache[name];
    }
  };
})();
