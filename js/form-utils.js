// Variabile globale pentru dimensiuni adiționale
let additionalDimensions = [];

// Afișează o notificare
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Actualizează opțiunile pentru nume în funcție de tipul selectat
function updateNumeOptions() {
    const tipSelect  = document.getElementById('tip');
    const numeSelect = document.getElementById('nume');
    if (!tipSelect || !numeSelect) return;
    
    const selectedTip     = tipSelect.value;
    const currentSelection = numeSelect.value;
    
    // Resetează opțiunile
    numeSelect.innerHTML = '<option value="">Selectează...</option>';
    
    if (selectedTip === 'DIM' || selectedTip === 'DIV') {
        numeSelect.innerHTML += '<option value="C24">C24</option>';
    } else if (selectedTip === 'SF') {
        const sfOptions = [
            'KVH_C24','DUO_C24','BSH_GL24h','DK','ARC',
            'Lam_NF','Lam_NFA','Lam_NFC','Lam_NFD','Lam_NFP',
            'Lam_NFS','Lam_D','Lam_P','PL','FRIZ_C24','Lam_Duo'
        ];
        sfOptions.forEach(option => {
            numeSelect.innerHTML += `<option value="${option}">${option}</option>`;
        });
    } else {
        const allOptions = [
            'C24','KVH_C24','DUO_C24','BSH_GL24h','DK','ARC',
            'Lam_NF','Lam_NFA','Lam_NFC','Lam_NFD','Lam_NFP',
            'Lam_NFS','Lam_D','Lam_P','PL','FRIZ_C24','Lam_Duo'
        ];
        allOptions.forEach(option => {
            numeSelect.innerHTML += `<option value="${option}">${option}</option>`;
        });
    }
    
    // Păstrează selecția curentă dacă există
    if (currentSelection && numeSelect.querySelector(`option[value="${currentSelection}"]`)) {
        numeSelect.value = currentSelection;
    }
    
    // Gestionează afișarea câmpurilor în funcție de tip
    const dimsIniLabel      = document.getElementById('label-dimensiuni-initiale');
    const latimeInput       = document.getElementById('latime');
    const bucatiContainer   = document.getElementById('bucati')?.parentElement;
    const volumDivContainer = document.getElementById('volum-div-container');
    const divFieldsContainer = document.getElementById('div-fields-container');

    if (selectedTip === 'DIV') {
        // 1) ascund doar câmpul Latime
        if (latimeInput)        latimeInput.style.display    = 'none';
        // 2) schimb label-ul
        if (dimsIniLabel)       dimsIniLabel.textContent    = 'Dimensiuni inițiale (L x G)';
        // 3) ascund bucăți, arăt volum
        if (bucatiContainer)    bucatiContainer.style.display   = 'none';
        if (volumDivContainer)  volumDivContainer.style.display = 'block';
        // 4) arăt câmpurile specifice DIV
        if (divFieldsContainer) divFieldsContainer.style.display = 'block';
        
        // 5) Dezactivez butonul pentru dimensiuni adiționale
        if (typeof toggleAdditionalDimensionsButton === 'function') {
            toggleAdditionalDimensionsButton(false);
        }
        
        // 6) Golesc lista de dimensiuni adiționale dacă există
        if (typeof additionalDimensions !== 'undefined') {
            additionalDimensions = [];
            if (typeof renderDimensionsList === 'function') {
                renderDimensionsList();
            }
        }
    } else {
        // la alte tipuri:
        if (latimeInput)        latimeInput.style.display    = '';
        if (dimsIniLabel)       dimsIniLabel.textContent    = 'Dimensiuni inițiale (L x l x G)';
        if (bucatiContainer)    bucatiContainer.style.display   = '';
        if (volumDivContainer)  volumDivContainer.style.display = 'none';
        if (divFieldsContainer) divFieldsContainer.style.display = 'none';
        
        // Activez butonul pentru dimensiuni adiționale
        if (typeof toggleAdditionalDimensionsButton === 'function') {
            toggleAdditionalDimensionsButton(true);
        }
    }
}

// Funcție pentru activarea/dezactivarea butonului de dimensiuni adiționale
function toggleAdditionalDimensionsButton(enable) {
    const addDimensionButton = document.querySelector('.btn-add');
    const dimensionsSection = document.querySelector('.form-group:has(#dimensions-list)');
    
    if (addDimensionButton) {
        if (enable) {
            // Activare buton
            addDimensionButton.disabled = false;
            addDimensionButton.style.opacity = '1';
            addDimensionButton.style.cursor = 'pointer';
            
            // Afișare secțiune dimensiuni adiționale
            if (dimensionsSection) {
                dimensionsSection.style.display = 'block';
            }
        } else {
            // Dezactivare buton
            addDimensionButton.disabled = true;
            addDimensionButton.style.opacity = '0.5';
            addDimensionButton.style.cursor = 'not-allowed';
            
            // Eventual ascundere secțiune dimensiuni adiționale
            if (dimensionsSection) {
                dimensionsSection.style.display = 'none';
            }
        }
    }
}

// Funcție pentru gestionarea checkbox-ului de locație externă
function toggleLocatieExterna() {
    const checkbox = document.getElementById('locatie-externa');
    const input = document.getElementById('locatie-externa-input');
    const locationSelects = document.querySelectorAll('#perete, #coloana, #rand');
    
    if (checkbox && input) {
        if (checkbox.checked) {
            // Afișează input-ul pentru locație externă
            input.style.display = 'block';
            input.required = true;
            
            // Dezactivează și golește select-urile de locație
            locationSelects.forEach(select => {
                select.disabled = true;
                select.value = '';
            });
        } else {
            // Ascunde input-ul pentru locație externă
            input.style.display = 'none';
            input.required = false;
            input.value = '';
            
            // Reactivează select-urile de locație
            locationSelects.forEach(select => {
                select.disabled = false;
            });
        }
    }
}

// Adaugă o dimensiune adițională
function addDimension() {
    if (additionalDimensions.length >= 3) {
        showNotification('Maxim 3 dimensiuni adiționale!', 'error');
        return;
    }
    
    const id = Date.now();
    additionalDimensions.push({
        id: id,
        L: '',
        l: '',
        G: '',
        bucati: ''
    });
    
    renderDimensionsList();
}

// Șterge o dimensiune adițională
function removeDimension(id) {
    additionalDimensions = additionalDimensions.filter(d => d.id !== id);
    renderDimensionsList();
}

// Actualizează o dimensiune adițională
function updateDimension(id, field, value) {
    const dim = additionalDimensions.find(d => d.id === id);
    if (dim) {
        dim[field] = value;
    }
}

// Afișează lista de dimensiuni adiționale
function renderDimensionsList() {
    const container = document.getElementById('dimensions-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    additionalDimensions.forEach(dim => {
        const item = document.createElement('div');
        item.className = 'dimension-item';
        item.innerHTML = `
            <input type="number" placeholder="L" value="${dim.L}" onchange="updateDimension(${dim.id}, 'L', this.value)">
            <span>x</span>
            <input type="number" placeholder="l" value="${dim.l}" onchange="updateDimension(${dim.id}, 'l', this.value)">
            <span>x</span>
            <input type="number" placeholder="G" value="${dim.G}" onchange="updateDimension(${dim.id}, 'G', this.value)">
            <span style="margin: 0 10px;">-</span>
            <input type="number" placeholder="Bucăți" value="${dim.bucati}" onchange="updateDimension(${dim.id}, 'bucati', this.value)" style="width: 100px;">
            <button class="btn-remove" onclick="removeDimension(${dim.id})">Șterge</button>
        `;
        container.appendChild(item);
    });
}

// Generează previzualizarea etichetei - VERSIUNE ACTUALIZATĂ pentru DIV
function generatePreview() {
    // 1) declarăm imediat checkbox-ul și input-ul pentru locație externă
    const locatieExternaCheckbox = document.getElementById('locatie-externa');
    const locatieExternaInput    = document.getElementById('locatie-externa-input');

    // 2) colectăm restul valorilor
    const specia   = document.getElementById('specia')?.value;
    const tip      = document.getElementById('tip')?.value;
    const nume     = document.getElementById('nume')?.value;
    const calitate = document.getElementById('calitate')?.value;
    const lungime  = document.getElementById('lungime')?.value;
    const latime   = document.getElementById('latime')?.value;
    const grosime  = document.getElementById('grosime')?.value;
    const bucati   = document.getElementById('bucati')?.value;
    const perete   = document.getElementById('perete')?.value;
    const coloana  = document.getElementById('coloana')?.value;
    const rand     = document.getElementById('rand')?.value;

    // Câmpurile noi pentru DIV
    const numarRanduri = document.getElementById('numar-randuri')?.value;
    const idStiva = document.getElementById('id-stiva')?.value;

    // 3) validare obligatorii
    if (tip === 'DIV') {
        const volumDiv = document.getElementById('volum-div')?.value;
        if (!specia || !tip || !nume || !calitate || !lungime || !grosime || !volumDiv || !numarRanduri || !idStiva) {
            showNotification('Pentru DIV, completați toate câmpurile inclusiv Volum, Număr rânduri și ID stivă!', 'error');
            return;
        }
    } else {
        if (!specia || !tip || !nume || !calitate || !lungime || !latime || !grosime || !bucati) {
            showNotification('Vă rugăm completați toate câmpurile obligatorii!', 'error');
            return;
        }
    }

    // 4) validare locație externă
    if (locatieExternaCheckbox?.checked && !locatieExternaInput?.value.trim()) {
        showNotification('Vă rugăm introduceți locația externă!', 'error');
        return;
    }
    
    const mainLabel = `${specia}_${tip}_${nume}_${calitate}`;
    const effectiveLatime = tip === 'DIV' ? '' : latime;
    const mainDimension = tip === 'DIV' ? `${lungime}xx${grosime}` : `${lungime}x${effectiveLatime}x${grosime}`;

    const labelContent = document.getElementById('label-content');
    if (labelContent) {
        labelContent.textContent = mainLabel;
    }
    
    const dimensionsContent = document.getElementById('label-dimensions');
    if (dimensionsContent) {
        let dimensionsHTML = '';
        
        if (tip === 'DIV') {
            // Pentru DIV: afișează doar L x x G - VOLUM MC (introdus manual)
            const volumDiv = document.getElementById('volum-div')?.value;
            if (volumDiv) {
                // Asigură-te că volumul are 4 zecimale
                let volumFormatted = volumDiv.replace('.', ','); // În caz că utilizatorul a introdus cu punct
                if (!volumFormatted.includes(',')) {
                    volumFormatted += ',0000';
                } else {
                    const parts = volumFormatted.split(',');
                    const decimals = parts[1] || '';
                    volumFormatted = parts[0] + ',' + decimals.padEnd(4, '0');
                }
                
                // Pentru DIV afișăm și câmpurile noi DEASUPRA dimensiunilor cu font mai mare
                const divExtraInfo = `<div style="font-size: 56px; line-height: 1.2; color: #FF9800; font-weight: bold; margin-bottom: 20px;">Număr rânduri: ${numarRanduri}<br>ID stivă: ${idStiva}</div>`;
                dimensionsHTML = divExtraInfo + `${lungime}x x${grosime} - ${volumFormatted} MC`;
            } else {
                const divExtraInfo = `<div style="font-size: 56px; line-height: 1.2; color: #FF9800; font-weight: bold; margin-bottom: 20px;">Număr rânduri: ${numarRanduri}<br>ID stivă: ${idStiva}</div>`;
                dimensionsHTML = divExtraInfo + `${lungime}x x${grosime} - 0,0000 MC`;
            }
        } else {
            // Pentru restul: format normal
            dimensionsHTML = `${mainDimension} - ${bucati} BUC`;
        }
        
        // Adăugăm dimensiunile adiționale pentru non-DIV
        if (tip !== 'DIV') {
            additionalDimensions.forEach(dim => {
                if (dim.L && dim.l && dim.G && dim.bucati) {
                    dimensionsHTML += `<br>${dim.L}x${dim.l}x${dim.G} - ${dim.bucati} BUC`;
                }
            });
        }
        
        dimensionsContent.innerHTML = dimensionsHTML;
    }
    
    const qrContainer = document.getElementById('qr-container');
    if (qrContainer && typeof QRCode !== 'undefined') {
        qrContainer.innerHTML = '';
        
        // Format QR optimizat: COD|DIMENSIUNE|BUCATI/VOLUM|[NUMAR_RANDURI|ID_STIVA]|...|LOCATIE
        let qrParts = [];
        if (tip === 'DIV') {
            const volumDiv = document.getElementById('volum-div')?.value || '0,0000';
            // Convertim volumul la format cu punct pentru QR
            const volumForQR = volumDiv.replace(',', '.');
            
            qrParts = [
                mainLabel,                  // COD
                mainDimension,              // DIMENSIUNE în format LxxG pentru DIV
                volumForQR,                 // VOLUM în loc de bucăți
                numarRanduri,               // NUMĂR RÂNDURI
                idStiva                     // ID STIVĂ
            ];
        } else {
            qrParts = [
                mainLabel,                  // COD
                mainDimension,              // DIMENSIUNE
                bucati                      // BUCATI
            ];
            
            // Adăugăm dimensiunile adiționale pentru non-DIV
            additionalDimensions.forEach(dim => {
                if (dim.L && dim.l && dim.G && dim.bucati) {
                    qrParts.push(`${dim.L}x${dim.l}x${dim.G}`);
                    qrParts.push(dim.bucati);
                }
            });
        }
        
        // MODIFICARE IMPORTANTĂ: Adăugăm locația externă sau din depozit
        if (locatieExternaCheckbox && locatieExternaCheckbox.checked && locatieExternaInput.value.trim()) {
            // Adăugăm locația externă la QR cu un prefix pentru a o distinge
            qrParts.push(`EXT:${locatieExternaInput.value.trim()}`);
        } else if (perete && coloana && rand) {
            // Adăugăm locația din depozit
            qrParts.push(`${perete}-${coloana}-${rand}`);
        }
        
        // Construim codul QR cu separatorul |
        const qrData = qrParts.join('|');
        console.log('Cod QR optimizat generat:', qrData);
        
        try {
            new QRCode(qrContainer, {
                text: qrData,
                width: 150,
                height: 150,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } catch (error) {
            console.error('Eroare generare QR:', error);
        }
    }
    
    // Pentru locație - verifică dacă este externă
    const locationLabel = document.getElementById('location-label');

    if (locationLabel) {
        if (locatieExternaCheckbox && locatieExternaCheckbox.checked && locatieExternaInput.value) {
            locationLabel.textContent = `Locație: ${locatieExternaInput.value}`;
            locationLabel.style.display = 'block';
        } else if (perete && coloana && rand) {
            locationLabel.textContent = `Locație etichetă: ${perete}-${coloana}-${rand}`;
            locationLabel.style.display = 'block';
        } else {
            locationLabel.style.display = 'none';
        }
    }
            
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) {
        previewContainer.style.display = 'block';
    }
            
    showNotification('Previzualizare generată cu succes!');
}

// Resetează toate câmpurile formularului
function clearForm() {
    const fields = [
        'specia', 'tip', 'nume', 'calitate', 
        'lungime', 'latime', 'grosime', 'bucati',
        'perete', 'coloana', 'rand', 'volum-div',
        'numar-randuri', 'id-stiva'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
        }
    });

    // Resetează și checkbox-ul de locație externă
    const locatieExternaCheckbox = document.getElementById('locatie-externa');
    const locatieExternaInput = document.getElementById('locatie-externa-input');
    if (locatieExternaCheckbox) {
        locatieExternaCheckbox.checked = false;
        toggleLocatieExterna();
    }
    if (locatieExternaInput) {
        locatieExternaInput.value = '';
    }
    
    additionalDimensions = [];
    renderDimensionsList();
    
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) {
        previewContainer.style.display = 'none';
    }
    
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
        debugInfo.classList.remove('show');
    }
     // Activează butonul pentru dimensiuni adiționale (deoarece tipul este resetat)
    if (typeof toggleAdditionalDimensionsButton === 'function') {
        toggleAdditionalDimensionsButton(true);
    }
    showNotification('Formularul a fost resetat!');
}

// Tipărește eticheta
function printLabel() {
    const previewContainer = document.getElementById('preview-container');
    const labelPreview = document.getElementById('label-preview');
    
    if (!labelPreview || !previewContainer || previewContainer.style.display === 'none') {
        showNotification('Vă rugăm să generați mai întâi previzualizarea!', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Etichetă</title>
                <style>
                    @page { size: A4 landscape; margin: 0; }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { width: 297mm; height: 210mm; margin: 0; padding: 0; background: white; font-family: Arial, sans-serif; overflow: hidden; }
                    .print-label { width: 297mm; height: 210mm; padding: 40px; position: relative; background: white; }
                    .label-content { font-family: Arial, sans-serif; font-size: 96px; font-weight: bold; line-height: 1.3; }
                    .label-dimensions { margin-top: 40px; font-size: 68px; line-height: 1.4; }
                    .qr-container { position: absolute; bottom: 100px; right: 40px; border: 2px solid #333; padding: 8px; background: white; }
                    .location-label { position: absolute; bottom: 40px; right: 40px; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: #333; background: white; padding: 10px; border: 2px solid #333; min-width: 200px; }
                </style>
            </head>
            <body>
                <div class="print-label">${labelPreview.innerHTML}</div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 100);
        };
    }
}

// Funcția pentru trimiterea datelor în Google Sheets - VERSIUNE CORECTATĂ
async function sendToGoogleSheets(scannedData) {
    // URL-ul corect pentru Google Apps Script (același cu primary-labels)
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxy2q2NWWvSwttORz_KWXDBpyB64RGsGIjHDO4Eea4jMQY5fKB_2X7oo2QLVueUqZE/exec';

    console.log('DEBUG: Începe trimiterea datelor');
    console.log('Date de trimis:', scannedData);

    if (!scannedData || scannedData.length === 0) {
        throw new Error('Nu există date de trimis');
    }

    try {
        // Formatează datele ca array de arrays pentru Google Sheets
        // Ordinea coloanelor: Cod, TIP, LUNGIME, LATIME, GROSIME, NR.BUC, VOLUM, CALITATE, FURNIZOR, DATA, ID_PROD, SPECIA, NUME, BON CONSUM, LOCATIE
        const formattedValues = scannedData.map(row => [
            row.cod || '',                                          // Cod
            row.tip || '',                                          // TIP
            row.lungime || 0,                                       // LUNGIME
            row.latime || 0,                                        // LATIME
            row.grosime || 0,                                       // GROSIME
            row.nr_buc || 0,                                        // NR.BUC
            row.volum || 0,                                         // VOLUM
            row.calitate || '',                                     // CALITATE
            row.furnizor || '',                                     // FURNIZOR
            row.data || new Date().toLocaleDateString('ro-RO'),     // DATA
            row.id_prod || '',                                      // ID_PROD
            row.specia || '',                                       // SPECIA
            row.nume || '',                                         // NUME
            row.bon_consum || '',                                   // BON CONSUM
            row.locatie || ''                                       // LOCATIE
        ]);

        console.log('Date formatate ca arrays:', formattedValues);

        // Preparare date pentru request - folosim action: 'appendRows' și values
        const requestData = {
            action: 'appendRows',
            values: formattedValues
        };

        console.log('Request data:', JSON.stringify(requestData));

        // Trimitere prin form submission într-un iframe ascuns (evită CORS)
        await new Promise((resolve, reject) => {
            const iframeName = 'hidden_iframe_' + Date.now();
            const iframe = document.createElement('iframe');
            iframe.name = iframeName;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = SCRIPT_URL;
            form.target = iframeName;
            form.style.display = 'none';

            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'data';
            input.value = JSON.stringify(requestData);
            form.appendChild(input);

            document.body.appendChild(form);

            iframe.onload = function() {
                console.log('Form submission - date trimise cu succes');
                setTimeout(() => {
                    document.body.removeChild(form);
                    document.body.removeChild(iframe);
                }, 2000);
                resolve();
            };

            iframe.onerror = function() {
                document.body.removeChild(form);
                document.body.removeChild(iframe);
                reject(new Error('Eroare la trimiterea formularului'));
            };

            form.submit();

            // Timeout de siguranță
            setTimeout(() => { resolve(); }, 5000);
        });

        console.log('Form submission completat');

        return {
            success: true,
            message: 'Date trimise cu succes în Google Sheets',
            rowsAdded: formattedValues.length
        };

    } catch (error) {
        console.error('Eroare la trimiterea în Google Sheets:', error);
        throw new Error(`Eroare: ${error.message}`);
    }
}

// Funcție simplificată pentru testarea conexiunii
async function testGoogleSheetsConnection() {
    console.log('TEST CONEXIUNE GOOGLE SHEETS');

    try {
        const testData = [{
            cod: 'TEST_DIM_C24_PL',
            tip: 'DIM',
            lungime: 1000,
            latime: 100,
            grosime: 10,
            nr_buc: 1,
            volum: 0.001,
            calitate: 'PL',
            furnizor: '',
            data: new Date().toLocaleDateString('ro-RO'),
            id_prod: '',
            specia: 'TEST',
            nume: 'C24',
            bon_consum: '',
            locatie: 'A-1-0'
        }];

        const result = await sendToGoogleSheets(testData);
        console.log('TEST REUȘIT:', result);
        showNotification('Test conexiune Google Sheets REUȘIT!', 'success');
        return result;
    } catch (error) {
        console.error('TEST EȘUAT:', error);
        showNotification('Test eșuat: ' + error.message, 'error');
        throw error;
    }
}

// Funcție pentru testarea URL-ului Google Apps Script
async function testGoogleAppsScriptURL() {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxy2q2NWWvSwttORz_KWXDBpyB64RGsGIjHDO4Eea4jMQY5fKB_2X7oo2QLVueUqZE/exec';

    console.log('Testez URL Google Apps Script:', SCRIPT_URL);

    try {
        const response = await fetch(SCRIPT_URL, { method: 'GET' });
        const text = await response.text();
        console.log('Răspuns:', text);

        if (response.ok) {
            showNotification('Google Apps Script URL este accesibil!', 'success');
        }

        return { accessible: response.ok, status: response.status, response: text };
    } catch (error) {
        console.error('Eroare la testarea URL-ului:', error);
        showNotification('URL inaccesibil: ' + error.message, 'error');
        throw error;
    }
}

// Expune funcțiile la nivel global pentru onClick events
window.updateNumeOptions = updateNumeOptions;
window.addDimension = addDimension;
window.removeDimension = removeDimension;
window.updateDimension = updateDimension;
window.toggleAdditionalDimensionsButton = toggleAdditionalDimensionsButton;
window.toggleLocatieExterna = toggleLocatieExterna;
window.generatePreview = generatePreview;
window.clearForm = clearForm;
window.printLabel = printLabel;
window.showNotification = showNotification;
window.sendToGoogleSheets = sendToGoogleSheets;
window.testGoogleSheetsConnection = testGoogleSheetsConnection;
window.testGoogleAppsScriptURL = testGoogleAppsScriptURL;