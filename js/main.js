// Event listeners pentru aplicație

// Ascultător pentru tasta Escape pentru a închide modalele
document.addEventListener('keydown', function(e) {
    // Doar ESC pentru închiderea modalelor - fără alte shortcut-uri
    if (e.key === 'Escape') {
        if (typeof stopCameraScanner === 'function') {
            stopCameraScanner();
        }
        if (typeof stopGryphonScanner === 'function') {
            stopGryphonScanner();
        }
    }
});

// Inițializare la încărcarea documentului
document.addEventListener('DOMContentLoaded', function() {
    // Verifică dacă funcțiile există înainte de a le apela
    if (typeof showNotification === 'function') {
        showNotification('Aplicația s-a încărcat cu succes! 🚀');
    }
    
    const tipSelect = document.getElementById('tip');
    if (tipSelect && typeof updateNumeOptions === 'function') {
        tipSelect.addEventListener('change', updateNumeOptions);
    }
    
    // Test scannerul
    setTimeout(() => {
        if (typeof showNotification === 'function') {
            showNotification('Scanner Gryphon gata de utilizare!', 'warning');
        }
    }, 1000);
});

// Verifică și expune funcțiile pentru onClick events în window doar dacă există
if (typeof updateNumeOptions !== 'undefined') {
    window.updateNumeOptions = updateNumeOptions;
}
if (typeof generatePreview !== 'undefined') {
    window.generatePreview = generatePreview;
}
if (typeof startGryphonScanner !== 'undefined') {
    window.startGryphonScanner = startGryphonScanner;
}
if (typeof startCameraScanner !== 'undefined') {
    window.startCameraScanner = startCameraScanner;
}
if (typeof addDimension !== 'undefined') {
    window.addDimension = addDimension;
}
if (typeof removeDimension !== 'undefined') {
    window.removeDimension = removeDimension;
}
if (typeof updateDimension !== 'undefined') {
    window.updateDimension = updateDimension;
}
if (typeof clearForm !== 'undefined') {
    window.clearForm = clearForm;
}
if (typeof stopGryphonScanner !== 'undefined') {
    window.stopGryphonScanner = stopGryphonScanner;
}
if (typeof stopCameraScanner !== 'undefined') {
    window.stopCameraScanner = stopCameraScanner;
}
if (typeof switchCamera !== 'undefined') {
    window.switchCamera = switchCamera;
}
if (typeof simulateQRScan !== 'undefined') {
    window.simulateQRScan = simulateQRScan;
}
if (typeof simulateComplexQRScan !== 'undefined') {
    window.simulateComplexQRScan = simulateComplexQRScan;
}
if (typeof printLabel !== 'undefined') {
    window.printLabel = printLabel;
}