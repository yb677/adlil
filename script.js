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

    const name = localStorage.getItem('pwa_user_name') || "Non renseigné";
    const email = localStorage.getItem('pwa_user_email') || "Non renseigné";
    const data = `NOM: ${name}\nEMAIL: ${email}`;

    // ✅ URL correcte
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;

    container.innerHTML = `
        <div id="qr-box" style="text-align:center; background:white; padding:15px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.1); width:200px; margin:auto;">
            <img src="${qrUrl}" 
                 style="width:200px; height:200px; display:block;"
                 onerror="generateInternalQR(this, '${name}', '${email}')">
        </div>`;
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

//if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js'); }

const QRMaker = (text) => {
    const size = 256;
    // ✅ URL correcte
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
};
