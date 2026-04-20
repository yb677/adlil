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
    const dataString = `NOM: ${name}\nEMAIL: ${email}`;

    // On crée l'URL de l'image
    const qrUrl = QRMaker(dataString);

    // On insère l'image avec un ID pour la surveiller
    container.innerHTML = `<img id="qrImage" src="${qrUrl}" alt="QR Code" style="display:none; border: 10px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">`;

    // On ne l'affiche que lorsqu'elle est vraiment chargée
    const img = document.getElementById('qrImage');
    img.onload = () => { img.style.display = 'block'; };
    
    // Si l'image échoue, on affiche un texte d'erreur
    img.onerror = () => { container.innerHTML = "<p style='color:red;'>Erreur de chargement du QR. Vérifiez votre connexion.</p>"; };
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

// Générateur QR ultra-léger intégré
const QRMaker = (text) => {
    const size = 256;
    return `https://qrserver.com{size}x${size}&data=${encodeURIComponent(text)}`;
};
