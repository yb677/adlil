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

    const name = localStorage.getItem('pwa_user_name') || "Inconnu";
    const email = localStorage.getItem('pwa_user_email') || "Inconnu";
    const data = encodeURIComponent(`NOM: ${name}\nEMAIL: ${email}`);

    // Tentative avec une URL différente (QuickChart est très robuste)
    const qrUrl = `https://quickchart.io{data}&size=200`;

    container.innerHTML = `
        <div style="min-height:200px; display:flex; flex-direction:column; align-items:center;">
            <img src="${qrUrl}" 
                 style="width:200px; height:200px; border:10px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.1);"
                 onload="console.log('QR Chargé')"
                 onerror="showManualQR(this, '${name}', '${email}')">
            <p id="debug-data" style="font-size:10px; color:gray; margin-top:10px;">Version: ${Date.now()}</p>
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

// Générateur QR ultra-léger intégré
const QRMaker = (text) => {
    const size = 256;
    return `https://qrserver.com{size}x${size}&data=${encodeURIComponent(text)}`;
};
