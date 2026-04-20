let deferredPrompt;
let qrcodeInstance = null;

// --- VARIABLES ---
const installScreen = document.getElementById('install-screen');
const msgAndroid = document.getElementById('msg-android');
const msgIos = document.getElementById('msg-ios');
const iosArrow = document.getElementById('ios-arrow-help');

const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// ============================================================
// INDEXEDDB INIT
// ============================================================
const DB_NAME = 'adlil-db';
const DB_VERSION = 1;
const STORE_NAME = 'publications';
let idb;

function openIDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('date', 'date', { unique: false });
            }
        };
        req.onsuccess = (e) => { idb = e.target.result; resolve(idb); };
        req.onerror = (e) => reject(e);
    });
}

// ============================================================
// FIRESTORE SYNC
// ============================================================
function getLastSyncDate() {
    return localStorage.getItem('adlil_last_sync') || null;
}

function setLastSyncDate(date) {
    localStorage.setItem('adlil_last_sync', date);
}

async function syncPublications() {
    try {
        let query = db.collection('publications').orderBy('date', 'asc');
        const lastSync = getLastSyncDate();
        if (lastSync) {
            query = query.where('date', '>', new Date(lastSync));
        }
        const snapshot = await query.get();
        if (snapshot.empty) return;

        const tx = idb.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        let lastDate = null;

        snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data(), date: doc.data().date.toDate().toISOString() };
            store.put(data);
            lastDate = data.date;
        });

        if (lastDate) setLastSyncDate(lastDate);
        console.log(`✅ ${snapshot.size} publication(s) synced`);
    } catch (err) {
        console.warn('⚠️ Offline or sync error:', err);
    }
}

if (!isMobile || isStandalone) {
    showMainApp();
    iosArrow.style.display = 'none'; // Cacher la flèche si déjà installé
} else {
    // Si Mobile non installé
    installScreen.style.display = 'block';
    
    if (isIOS) {
        msgIos.style.display = 'block';
        msgAndroid.style.display = 'none';
        iosArrow.style.display = 'block'; // Afficher la flèche uniquement sur iPhone
    } else {
        msgAndroid.style.display = 'block';
        msgIos.style.display = 'none';
        iosArrow.style.display = 'none';
    }
}

function showMainApp() {
    document.getElementById('install-screen').style.display = 'none';
    document.getElementById('success-screen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('burgerBtn').style.display = 'flex';
    iosArrow.style.display = 'none'; 
}

// --- INSTALLATION ---
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

document.getElementById('btnInstallLarge').onclick = () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((res) => {
            if (res.outcome === 'accepted') {
                document.getElementById('install-screen').style.display = 'none';
                document.getElementById('success-screen').style.display = 'block';
            }
        });
    }
};

// --- NAVIGATION ---
document.getElementById('burgerBtn').onclick = () => document.getElementById('sideMenu').classList.toggle('active');

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    document.getElementById('sideMenu').classList.remove('active');
    console.log("Données pour QR:", viewId); 
    if(viewId === 'qr') generateQR();
}

function generateQR() {
    const container = document.getElementById('qrcode-container');
    if (!container) return;

    const d = JSON.parse(localStorage.getItem('pwa_profile') || '{}');
    const nom       = d.nom        || '';
    const prenom    = d.prenom     || '';
    const telephone = d.telephone  || '';
    const datenais  = d.datenaissance || '';

    if (!nom && !prenom) {
        container.innerHTML = `<p style="color:#999; text-align:center;">Aucune donnée. Remplissez d'abord vos infos.</p>`;
        return;
    }

    const data = [
        `NOM: ${nom}`,
        `PRENOM: ${prenom}`,
        `TEL: ${telephone}`,
        `NAISSANCE: ${datenais}`
    ].join('\n');

    // Vider le container
    container.innerHTML = `<div id="qr-canvas" style="display:flex; justify-content:center;"></div>
        <p style="text-align:center; margin-top:12px; font-size:14px; color:#555;">
            <strong>${prenom} ${nom}</strong><br>
            <span style="color:#999; font-size:12px;">${telephone}</span>
        </p>`;

    // Générer le QR avec la lib locale (100% hors ligne)
    new QRCode(document.getElementById('qr-canvas'), {
        text: data,
        width: 220,
        height: 220,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
}

// Fonction de secours qui dessine un QR stylisé si le réseau est bloqué
function generateInternalQR(img, name, email) {
    const parent = img.parentElement;
    parent.innerHTML = `
        <div style="width:200px; height:200px; background:#f0f0f0; border:2px solid #333; position:relative; display:flex; align-items:center; justify-content:center;">
            <!-- Petit dessin simulant un QR Code -->
            <div style="position:absolute; top:5px; left:5px; width:40px; height:40px; border:4px solid #333;"></div>
            <div style="position:absolute; top:5px; right:5px; width:40px; height:40px; border:4px solid #333;"></div>
            <div style="position:absolute; bottom:5px; left:5px; width:40px; height:40px; border:4px solid #333;"></div>
            <div style="text-align:center; font-size:12px; font-weight:bold; color:#333; padding:10px;">
                DÉTAILS<br>AFFICHÉS<br>CI-DESSOUS
            </div>
        </div>
        <div style="margin-top:15px; text-align:left; font-size:14px; border-top:1px solid #eee; padding-top:10px;">
            <strong>${name}</strong><br>
            <span style="color:#666; font-size:12px;">${email}</span>
        </div>`;
}

function showOfflineQR(img, name, email) {
    // Si l'image externe échoue encore, on affiche un QR Code de secours
    // ou un message stylisé très clair.
    img.parentElement.innerHTML = `
        <div style="width:200px; height:200px; background:white; border:2px solid #007bff; display:flex; align-items:center; justify-content:center; padding:10px; box-sizing:border-box;">
            <div style="text-align:center;">
                <div style="font-size:40px;">⚠️</div>
                <p style="font-size:12px; margin:5px 0; color:#333;"><strong>Mode Hors-ligne</strong></p>
                <p style="font-size:10px; color:#666;">Connectez-vous une fois pour générer l'image.</p>
            </div>
        </div>
        <div style="margin-top:15px; font-size:14px; text-align:left; background:#eee; padding:10px; border-radius:5px;">
            <strong>Données stockées :</strong><br>
            ${name}<br>${email}
        </div>`;
}

function showManualQR(img, name, email) {
    // Si l'image est bloquée, on affiche les données clairement en texte
    img.parentElement.innerHTML = `
        <div style="border:2px dashed #ccc; padding:20px; background:#fff;">
            <p style="color:red; font-weight:bold;">QR Code non disponible hors-ligne</p>
            <hr>
            <p><strong>Données :</strong></p>
            <p>${name}</p>
            <p>${email}</p>
        </div>`;
}

// --- FORMULAIRE ---
document.getElementById('userForm').onsubmit = (e) => {
    e.preventDefault();
    const n = document.getElementById('username').value;
    const em = document.getElementById('useremail').value;
    localStorage.setItem('pwa_user_name', n);
    localStorage.setItem('pwa_user_email', em);
    document.getElementById('welcomeUser').innerText = `Ravi de vous revoir, ${n}`;
    document.getElementById('statusMsg').innerText = "✓ Enregistré !";
    setTimeout(() => document.getElementById('statusMsg').innerText = "", 3000);
};

// --- INITIALISATION ---
window.onload = () => {
    const n = localStorage.getItem('pwa_user_name');
    const em = localStorage.getItem('pwa_user_email');
    if (n) {
        document.getElementById('username').value = n;
        document.getElementById('welcomeUser').innerText = `Ravi de vous revoir, ${n}`;
    }
    if (em) document.getElementById('useremail').value = em;
};

if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js'); }

const QRMaker = (text) => {
    const size = 256;
    // ✅ URL correcte
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
};

// ----------- with Claude ----

// ============================================================
// GESTION FAMILLE (conjoints + enfants)
// ============================================================
let famille = []; // tableau de conjoints: { id, nom, prenom, dateNaissance, enfants: [{id,prenom,dateNaissance}] }
let conjointCounter = 0;
let enfantCounter = 0;

function renderFamille() {
    const zone = document.getElementById('famille-zone');
    const btn = document.getElementById('btnAddConjoint');
    zone.innerHTML = '';

    famille.forEach((conjoint) => {
        const hasEnfants = conjoint.enfants.length > 0;

        const cDiv = document.createElement('fieldset');
        cDiv.innerHTML = `
            <legend>
                Conjoint
                ${!hasEnfants ? `<button type="button" class="btn-trash" onclick="removeConjoint('${conjoint.id}')" title="Supprimer le conjoint">🗑</button>` : ''}
            </legend>
            <input type="text" placeholder="Nom" value="${conjoint.nom}" oninput="updateConjoint('${conjoint.id}','nom',this.value)">
            <input type="text" placeholder="Prénom" value="${conjoint.prenom}" oninput="updateConjoint('${conjoint.id}','prenom',this.value)">
            <label>Date de naissance</label>
            <input type="date" value="${conjoint.dateNaissance}" oninput="updateConjoint('${conjoint.id}','dateNaissance',this.value)">
        `;

        // Enfants du conjoint
        conjoint.enfants.forEach((enfant) => {
            const eDiv = document.createElement('div');
            eDiv.className = 'enfant-row';
            eDiv.innerHTML = `
                <button type="button" class="btn-trash" onclick="removeEnfant('${conjoint.id}','${enfant.id}')" title="Supprimer l'enfant">🗑</button>
                <div class="enfant-fields">
                    <input type="text" placeholder="Prénom de l'enfant" value="${enfant.prenom}" oninput="updateEnfant('${conjoint.id}','${enfant.id}','prenom',this.value)">
                    <input type="date" value="${enfant.dateNaissance}" oninput="updateEnfant('${conjoint.id}','${enfant.id}','dateNaissance',this.value)">
                </div>
            `;
            cDiv.appendChild(eDiv);
        });

        // Bouton ajouter enfant
        const btnEnfant = document.createElement('button');
        btnEnfant.type = 'button';
        btnEnfant.className = 'action-btn-sm';
        btnEnfant.textContent = '+ Ajouter un enfant';
        btnEnfant.onclick = () => addEnfant(conjoint.id);
        cDiv.appendChild(btnEnfant);

        zone.appendChild(cDiv);
    });

    // Le bouton "Ajouter conjoint" reste TOUJOURS à la fin
    zone.parentElement.insertBefore(btn, zone.nextSibling);
}

function addConjoint() {
    famille.push({ id: 'c' + (++conjointCounter), nom: '', prenom: '', dateNaissance: '', enfants: [] });
    renderFamille();
}

function removeConjoint(id) {
    famille = famille.filter(c => c.id !== id);
    renderFamille();
}

function updateConjoint(id, field, val) {
    const c = famille.find(c => c.id === id);
    if (c) c[field] = val;
}

function addEnfant(conjointId) {
    const c = famille.find(c => c.id === conjointId);
    if (c) {
        c.enfants.push({ id: 'e' + (++enfantCounter), prenom: '', dateNaissance: '' });
        renderFamille();
    }
}

function removeEnfant(conjointId, enfantId) {
    const c = famille.find(c => c.id === conjointId);
    if (c) {
        c.enfants = c.enfants.filter(e => e.id !== enfantId);
        renderFamille();
    }
}

function updateEnfant(conjointId, enfantId, field, val) {
    const c = famille.find(c => c.id === conjointId);
    if (c) { const e = c.enfants.find(e => e.id === enfantId); if (e) e[field] = val; }
}

// ============================================================
// FORMULAIRE — SAVE / LOAD
// ============================================================
document.getElementById('userForm').onsubmit = (e) => {
    e.preventDefault();
    const data = {
        nom:               document.getElementById('f_nom').value,
        prenom:            document.getElementById('f_prenom').value,
        pere:              document.getElementById('f_pere').value,
        grandpere:         document.getElementById('f_grandpere').value,
        mereNom:           document.getElementById('f_mereNom').value,
        merePrenom:        document.getElementById('f_merePrenom').value,
        datenaissance:     document.getElementById('f_datenaissance').value,
        groupesanguin:     document.getElementById('f_groupesanguin').value,
        telephone:         document.getElementById('f_telephone').value,
        familleAlger:      document.getElementById('f_familleAlger').value,
        niveauInstruction: document.getElementById('f_niveauInstruction').value,
        profession:        document.getElementById('f_profession').value,
        adresseResidence:  document.getElementById('f_adresseResidence').value,
        adresseActivite:   document.getElementById('f_adresseActivite').value,
        mokataa:           document.getElementById('f_mokataa').value,
        maitrise:          document.getElementById('f_maitrise').value,
        offres:            document.getElementById('f_offres').value,
        famille:           famille
    };
    localStorage.setItem('pwa_profile', JSON.stringify(data));
    document.getElementById('welcomeUser').innerText = `Ravi de vous revoir, ${data.prenom} ${data.nom}`;
    document.getElementById('statusMsg').innerText = "✓ Enregistré !";
    setTimeout(() => document.getElementById('statusMsg').innerText = "", 3000);
};

window.onload = async () => {
    await openIDB();
    await syncPublications();
    await loadFeed();
    const raw = localStorage.getItem('pwa_profile');
    if (!raw) return;
    const d = JSON.parse(raw);
    const fields = ['nom','prenom','pere','grandpere','mereNom','merePrenom',
                    'datenaissance','groupesanguin','telephone','familleAlger',
                    'niveauInstruction','profession','adresseResidence',
                    'adresseActivite','mokataa','maitrise','offres'];
    fields.forEach(f => {
        const el = document.getElementById('f_' + f);
        if (el && d[f]) el.value = d[f];
    });
    if (d.nom) document.getElementById('welcomeUser').innerText = `Ravi de vous revoir, ${d.prenom} ${d.nom}`;
    if (d.famille) { famille = d.famille; renderFamille(); }
};

// ============================================================
// DISPLAY FEED
// ============================================================
async function loadFeed() {
    const container = document.getElementById('feed-container');
    if (!container) return;

    const tx = idb.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('date');
    const publications = await new Promise(res => {
        const req = index.getAll();
        req.onsuccess = () => res(req.result);
    });

    if (publications.length === 0) {
        container.innerHTML = `<p style="color:#999; text-align:center;">Aucune publication.</p>`;
        return;
    }

    const readIds = JSON.parse(localStorage.getItem('adlil_read') || '[]');
    let firstUnreadIndex = -1;
    let html = '';

    publications.forEach((pub, i) => {
        const isRead = readIds.includes(pub.id);
        if (!isRead && firstUnreadIndex === -1) firstUnreadIndex = i;
        const dateStr = new Date(pub.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
        html += `
            <div class="pub-bubble ${isRead ? 'pub-read' : 'pub-unread'}" id="pub-${pub.id}" onclick="markRead('${pub.id}')">
                <div class="pub-type">${pub.type}</div>
                <div class="pub-contenu">${pub.contenu}</div>
                <div class="pub-meta">${pub.auteur} · ${dateStr}</div>
            </div>`;
    });

    container.innerHTML = html;

    // Mark all as read & scroll to first unread
    const allIds = publications.map(p => p.id);
    localStorage.setItem('adlil_read', JSON.stringify(allIds));

    if (firstUnreadIndex !== -1) {
        const el = document.getElementById('pub-' + publications[firstUnreadIndex].id);
        if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
}

function markRead(id) {
    const readIds = JSON.parse(localStorage.getItem('adlil_read') || '[]');
    if (!readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem('adlil_read', JSON.stringify(readIds));
    }
}
