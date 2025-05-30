// Variabile globale pentru scanner camera
let mediaStream = null;
let currentCamera = 'environment';
let scanInterval = null;

// Pornește scannerul cu camera
async function startCameraScanner() {
    const scannerContainer = document.getElementById('scanner-container');
    const videoElement = document.getElementById('scanner-video');
    
    if (!scannerContainer || !videoElement) {
        console.error('Elementele scanner-ului cameră nu sunt găsite');
        return;
    }
    
    scannerContainer.style.display = 'block';
    videoElement.innerHTML = '<div class="loading-spinner"></div><div class="status-message">Se încarcă camera...</div>';
    
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: currentCamera,
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 },
                frameRate: { ideal: 30 }
            }
        });
        
        const video = document.createElement('video');
        video.srcObject = mediaStream;
        video.setAttribute('playsinline', true);
        video.play();
        
        videoElement.innerHTML = '';
        videoElement.appendChild(video);
        
        const overlay = document.createElement('div');
        overlay.className = 'scanner-overlay';
        videoElement.appendChild(overlay);
        
        const scannerStatus = document.getElementById('scanner-status');
        if (scannerStatus) {
            scannerStatus.textContent = 'Poziționează QR-ul în pătratul roșu';
        }
        
        video.addEventListener('loadedmetadata', () => {
            startQRDetection(video);
        });
        
    } catch (error) {
        console.error('Eroare camera:', error);
        let errorMessage = 'Nu s-a putut accesa camera!';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Acces la cameră refuzat! Te rog să permiți accesul și să reîncerci.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'Nu s-a găsit nicio cameră pe dispozitiv!';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Camera nu este suportată de browser!';
        }
        
        videoElement.innerHTML = `<div class="status-message">${errorMessage}</div>`;
        if (typeof showNotification === 'function') {
            showNotification(errorMessage, 'error');
        }
    }
}

// Începe detecția QR
function startQRDetection(video) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let isScanning = true;
    
    function scanFrame() {
        if (!isScanning || !video.videoWidth || !video.videoHeight) {
            if (isScanning) {
                requestAnimationFrame(scanFrame);
            }
            return;
        }
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Verifică dacă jsQR este disponibil
        if (typeof jsQR !== 'undefined') {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert"
            });
            
            if (code) {
                isScanning = false;
                
                const overlay = document.querySelector('.scanner-overlay');
                if (overlay) {
                    overlay.style.borderColor = '#4CAF50';
                    overlay.style.boxShadow = '0 0 0 9999px rgba(76, 175, 80, 0.3)';
                }
                
                try {
                    if (typeof populateFormFromQR === 'function') {
                        populateFormFromQR(code.data);
                        stopCameraScanner();
                        if (typeof showNotification === 'function') {
                            showNotification('QR scanat cu succes cu camera! 🎉');
                        }
                    } else {
                        throw new Error('Funcția populateFormFromQR nu este disponibilă');
                    }
                } catch (e) {
                    console.error('Eroare parsare QR:', e);
                    if (typeof showNotification === 'function') {
                        showNotification('Datele QR nu pot fi procesate. Format nerecunoscut.', 'error');
                    }
                    isScanning = true;
                    requestAnimationFrame(scanFrame);
                }
            } else {
                requestAnimationFrame(scanFrame);
            }
        } else {
            console.error('jsQR nu este disponibil');
            if (typeof showNotification === 'function') {
                showNotification('Biblioteca jsQR nu este încărcată!', 'error');
            }
            isScanning = false;
        }
    }
    
    scanFrame();
    scanInterval = () => { isScanning = false; };
}

// Oprește scannerul cu camera
function stopCameraScanner() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    
    if (scanInterval) {
        if (typeof scanInterval === 'function') {
            scanInterval();
        } else {
            clearInterval(scanInterval);
        }
        scanInterval = null;
    }
    
    const scannerContainer = document.getElementById('scanner-container');
    if (scannerContainer) {
        scannerContainer.style.display = 'none';
    }
}

// Schimbă camera (față/spate)
async function switchCamera() {
    if (mediaStream) {
        currentCamera = currentCamera === 'environment' ? 'user' : 'environment';
        stopCameraScanner();
        setTimeout(startCameraScanner, 100);
        
        const switchButton = document.getElementById('switch-camera');
        if (switchButton) {
            switchButton.textContent = currentCamera === 'environment' ? 'Camera Față' : 'Camera Spate';
        }
    }
}

// Expune funcțiile la nivel global
window.startCameraScanner = startCameraScanner;
window.stopCameraScanner = stopCameraScanner;
window.switchCamera = switchCamera;