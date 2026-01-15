/**
 * TIPĂRIRE ETICHETE PRIMARE - LOGICĂ PRINCIPALĂ
 * ==============================================
 *
 * Acest fișier gestionează funcționalitatea de tipărire a etichetelor primare
 * cu format "STIVA NR. :" + număr.
 *
 * Funcționalități:
 * - Citire ultimul număr folosit din Google Sheets
 * - Generare preview etichete A4 landscape
 * - Tipărire etichete
 * - Salvare număr nou în Google Sheets pentru sincronizare între device-uri
 */

// ============================================
// CONSTANTE ȘI CONFIGURARE
// ============================================

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz7jLGhBtrJ0xn1OQ5smMEppY-zwqew1GSO6UWSJw9nWlvnMV1Y4lGTgtELtlDcW3g/exec';
const SPREADSHEET_ID = '10TegZTOq45WtGol7KftrJm080PbB7pwDEv92fnq9BXw';
const PRIMARY_SHEET_NAME = 'PrimaryLabelsCounter';

let currentNumber = 1; // Valoare implicită, se suprascrie din Google Sheets
let isLoading = false;


// ============================================
// FUNCȚII UTILITARE
// ============================================

/**
 * Afișează notificare în colțul superior drept
 * @param {string} message - Mesajul de afișat
 * @param {string} type - Tipul notificării: 'success', 'error', 'warning', 'info'
 */
function showNotification(message, type = 'info') {
    // Șterge notificări existente
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animație de intrare
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Auto-ascundere după 5 secunde
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

/**
 * Afișează/ascunde loader-ul
 * @param {boolean} show - true pentru afișare, false pentru ascundere
 */
function toggleLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
    isLoading = show;
}

/**
 * Actualizează afișajul ultimului număr
 * @param {number} number - Numărul de afișat
 */
function updateLastNumberDisplay(number) {
    const displayElement = document.getElementById('last-number-display');
    if (displayElement) {
        displayElement.textContent = number;
    }
}


// ============================================
// FUNCȚII GOOGLE SHEETS
// ============================================

/**
 * Citește ultimul număr folosit din Google Sheets
 * Această funcție este apelată la încărcarea paginii
 */
async function fetchLastNumber() {
    toggleLoader(true);

    try {
        console.log('Citire ultimul număr din Google Sheets...');

        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getLastPrimaryNumber`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Răspuns de la Google Sheets:', data);

        if (data.success && data.lastNumber) {
            currentNumber = parseInt(data.lastNumber) || 1;
            updateLastNumberDisplay(currentNumber);
            console.log('Ultimul număr încărcat cu succes:', currentNumber);
        } else {
            throw new Error(data.error || 'Eroare la citirea numărului');
        }

    } catch (error) {
        console.error('Eroare la citirea numărului:', error);
        showNotification('Eroare la citirea numărului din cloud. Se folosește valoarea implicită 1.', 'warning');
        currentNumber = 1;
        updateLastNumberDisplay(currentNumber);
    } finally {
        toggleLoader(false);
    }
}

/**
 * Salvează noul număr în Google Sheets
 * @param {number} number - Numărul de salvat
 * @returns {Promise<boolean>} - true dacă salvarea a reușit, false altfel
 */
async function saveLastNumber(number) {
    try {
        console.log('Salvare număr în Google Sheets:', number);

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                action: 'updateLastPrimaryNumber',
                spreadsheetId: SPREADSHEET_ID,
                sheetName: PRIMARY_SHEET_NAME,
                lastNumber: number,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Răspuns salvare:', data);

        if (data.success) {
            console.log('Număr salvat cu succes în Google Sheets:', number);
            return true;
        } else {
            throw new Error(data.error || 'Eroare la salvare');
        }

    } catch (error) {
        console.error('Eroare la salvarea numărului:', error);
        showNotification('Atenție: Numărul nu a fost salvat în cloud! Verificați conexiunea.', 'error');
        return false;
    }
}


// ============================================
// FUNCȚII GENERARE ETICHETE
// ============================================

/**
 * Validează input-ul pentru numărul de etichete
 * @returns {number|null} - Numărul de etichete sau null dacă invalid
 */
function validateLabelCount() {
    const input = document.getElementById('label-count');
    const count = parseInt(input.value);

    if (!count || isNaN(count)) {
        showNotification('Vă rugăm introduceți un număr valid!', 'error');
        input.focus();
        return null;
    }

    if (count < 1) {
        showNotification('Numărul de etichete trebuie să fie cel puțin 1!', 'error');
        input.focus();
        return null;
    }

    if (count > 100) {
        showNotification('Numărul maxim de etichete este 100!', 'error');
        input.focus();
        return null;
    }

    return count;
}

/**
 * Creează un element DOM pentru o etichetă
 * @param {number} number - Numărul etichetei
 * @returns {HTMLElement} - Elementul DOM creat
 */
function createLabelElement(number) {
    const label = document.createElement('div');
    label.className = 'primary-label';

    const line1 = document.createElement('div');
    line1.className = 'label-line1';
    line1.textContent = 'STIVA NR. :';

    const line2 = document.createElement('div');
    line2.className = 'label-line2';
    line2.textContent = number;

    label.appendChild(line1);
    label.appendChild(line2);

    return label;
}

/**
 * Generează preview-ul etichetelor
 * Această funcție creează elementele HTML pentru toate etichetele cerute
 */
function generatePrimaryLabels() {
    if (isLoading) {
        showNotification('Vă rugăm așteptați finalizarea operației curente...', 'warning');
        return;
    }

    const count = validateLabelCount();
    if (count === null) {
        return;
    }

    console.log(`Generare ${count} etichete începând de la numărul ${currentNumber}`);

    const container = document.getElementById('labels-preview-container');
    container.innerHTML = ''; // Curăță preview-uri vechi

    // Generează etichetele
    for (let i = 0; i < count; i++) {
        const labelNumber = currentNumber + i;
        const labelElement = createLabelElement(labelNumber);
        container.appendChild(labelElement);
    }

    // Afișează container-ul
    container.style.display = 'block';

    // Activează butonul de tipărire
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.disabled = false;
    }

    // Scroll la preview
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });

    showNotification(`${count} etichete generate cu succes! (${currentNumber} - ${currentNumber + count - 1})`, 'success');
}


// ============================================
// FUNCȚIE TIPĂRIRE
// ============================================

/**
 * Tipărește etichetele generate și salvează noul număr
 * Această funcție:
 * 1. Deschide dialog-ul de tipărire
 * 2. Salvează noul număr în Google Sheets
 * 3. Actualizează UI-ul
 */
async function printPrimaryLabels() {
    if (isLoading) {
        showNotification('Vă rugăm așteptați finalizarea operației curente...', 'warning');
        return;
    }

    const count = validateLabelCount();
    if (count === null) {
        return;
    }

    // Verifică dacă există preview generat
    const container = document.getElementById('labels-preview-container');
    if (!container || container.children.length === 0) {
        showNotification('Generați mai întâi preview-ul etichetelor!', 'warning');
        return;
    }

    console.log('Inițiere tipărire...');

    // Calculează noul număr
    const newLastNumber = currentNumber + count;

    // Deschide dialog-ul de tipărire
    window.print();

    // Salvează noul număr în Google Sheets (după tipărire)
    toggleLoader(true);
    const saved = await saveLastNumber(newLastNumber);
    toggleLoader(false);

    if (saved) {
        // Actualizează numărul curent local
        currentNumber = newLastNumber;
        updateLastNumberDisplay(currentNumber);

        showNotification(`✓ ${count} etichete tipărite! Următorul număr: ${currentNumber}`, 'success');

        // Curăță preview-ul după 3 secunde
        setTimeout(() => {
            container.innerHTML = '';
            container.style.display = 'none';
            document.getElementById('label-count').value = '';
            document.getElementById('print-btn').disabled = true;
        }, 3000);

    } else {
        showNotification(`Etichete tipărite, dar numărul nu a fost salvat în cloud! Verificați conexiunea.`, 'error');
    }
}


// ============================================
// FUNCȚIE RESETARE FORMULAR
// ============================================

/**
 * Resetează formularul la starea inițială
 */
function clearForm() {
    const input = document.getElementById('label-count');
    if (input) {
        input.value = '';
    }

    const container = document.getElementById('labels-preview-container');
    if (container) {
        container.innerHTML = '';
        container.style.display = 'none';
    }

    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.disabled = true;
    }

    showNotification('Formular resetat', 'info');
}


// ============================================
// INIȚIALIZARE ȘI EVENT LISTENERS
// ============================================

/**
 * Inițializează aplicația la încărcarea paginii
 */
function initializePrimaryLabels() {
    console.log('Inițializare Tipărire Etichete Primare...');

    // Încarcă ultimul număr din Google Sheets
    fetchLastNumber();

    // Event listener pentru butonul "Generează Preview"
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generatePrimaryLabels);
    }

    // Event listener pentru butonul "Tipărește"
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', printPrimaryLabels);
    }

    // Event listener pentru butonul "Șterge Date"
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearForm);
    }

    // Event listener pentru Enter în input
    const input = document.getElementById('label-count');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                generatePrimaryLabels();
            }
        });
    }

    // Event listener pentru Escape (închide preview)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const container = document.getElementById('labels-preview-container');
            if (container && container.style.display === 'block') {
                clearForm();
            }
        }
    });

    console.log('Inițializare completă!');
}

// Pornește aplicația când DOM-ul este încărcat
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePrimaryLabels);
} else {
    // DOM deja încărcat
    initializePrimaryLabels();
}


// ============================================
// EXPORT FUNCȚII (pentru debugging)
// ============================================

// Expune funcții în window pentru debugging în consolă
if (typeof window !== 'undefined') {
    window.primaryLabels = {
        fetchLastNumber,
        saveLastNumber,
        generatePrimaryLabels,
        printPrimaryLabels,
        clearForm,
        getCurrentNumber: () => currentNumber
    };
}
