// --- VARIABLES ---
const installScreen = document.getElementById('install-screen');
const successScreen = document.getElementById('success-screen');
const mainApp = document.getElementById('mainApp');
const burgerBtn = document.getElementById('burgerBtn');
const sideMenu = document.getElementById('sideMenu');
let deferredPrompt;

// --- DÉTECTION PC / MOBILE ---
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

if (!isMobile || isStandalone) {
    showMainApp();
} else {
    installScreen.style.display = 'block';
}

function showMainApp() {
    installScreen.style.display = 'none';
    mainApp.style.display = 'block';
    burgerBtn.style.display = 'flex';
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
                installScreen.style.display = 'none';
                successScreen.style.display = 'block';
            }
        });
    }
};

// --- NAVIGATION ---
burgerBtn.onclick = () => sideMenu.classList.toggle('active');

let qrcode = null;

function generateQR() {
    // 1. Récupération des données du formulaire stockées
    const name = localStorage.getItem('pwa_user_name') || "";
    const email = localStorage.getItem('pwa_user_email') || "";
    const dataString = `Nom: ${name}\nEmail: ${email}`;

    const qrContainer = document.getElementById("qrcode");

    // 2. Initialisation ou mise à jour du QR Code
    if (!qrcode) {
        // Premier affichage
        qrcode = new QRCode(qrContainer, {
            text: dataString,
            width: 200,
            height: 200,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    } else {
        // Mise à jour avec les nouvelles données
        qrcode.clear(); 
        qrcode.makeCode(dataString);
    }
}

// Appeler generateQR() quand on affiche la vue QR
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    
    if (viewId === 'qr') {
        generateQR();
    }
}


// --- FORMULAIRE ---
document.getElementById('userForm').onsubmit = (e) => {
    e.preventDefault();
    const n = document.getElementById('username').value;
    const em = document.getElementById('useremail').value;
    localStorage.setItem('pwa_user_name', n);
    localStorage.setItem('pwa_user_email', em);
    document.getElementById('welcomeUser').innerText = `Ravi de vous revoir, ${n}`;
    alert("Données sauvegardées !");
};

// --- CHARGEMENT ---
window.onload = () => {
    const n = localStorage.getItem('pwa_user_name');
    if (n) {
        document.getElementById('username').value = n;
        document.getElementById('welcomeUser').innerText = `Ravi de vous revoir, ${n}`;
    }
};

if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js'); }
