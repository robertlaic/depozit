# Instrucțiuni: Tipărire Etichete Primare

## Cuprins
1. [Prezentare Generală](#prezentare-generală)
2. [Configurare Google Apps Script](#configurare-google-apps-script)
3. [Utilizare Aplicație](#utilizare-aplicație)
4. [Testare Funcționalitate](#testare-funcționalitate)
5. [Depanare Probleme](#depanare-probleme)

---

## Prezentare Generală

Funcționalitatea **Tipărire Etichete Primare** permite generarea și tipărirea de etichete numerotate pentru stive, cu următoarele caracteristici:

- **Format**: A4 Landscape (297mm × 210mm)
- **Conținut**:
  - Rând 1: "STIVA NR. :"
  - Rând 2: Număr (autoincrement)
- **Font**: Verdana, bold, negru
- **Dimensiune**: ~85% din foaia A4
- **Sincronizare**: Numărul curent este salvat în Google Sheets și sincronizat între toate device-urile din rețea

---

## Configurare Google Apps Script

### Pasul 1: Accesare Google Apps Script

1. Accesați: https://script.google.com/
2. Căutați proiectul existent care gestionează aplicația de depozit
   - URL-ul scriptului: `https://script.google.com/macros/s/AKfycbz7jLGhBtrJ0xn1OQ5smMEppY-zwqew1GSO6UWSJw9nWlvnMV1Y4lGTgtELtlDcW3g/exec`
3. Deschideți proiectul pentru editare

### Pasul 2: Modificare Cod Google Apps Script

**IMPORTANT**: Codul nou trebuie ADĂUGAT la codul existent, NU înlocuit!

#### 2.1 Modificare funcția `doGet()`

Găsiți funcția `doGet(e)` existentă și adăugați următorul cod la **ÎNCEPUTUL** funcției:

```javascript
function doGet(e) {
  // === NOU COD PENTRU PRIMARY LABELS - ÎNCEPE ===
  if (e && e.parameter && e.parameter.action === 'getLastPrimaryNumber') {
    try {
      const SPREADSHEET_ID = '10TegZTOq45WtGol7KftrJm080PbB7pwDEv92fnq9BXw';
      const SHEET_NAME = 'PrimaryLabelsCounter';

      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      let sheet = ss.getSheetByName(SHEET_NAME);

      // Creează sheet dacă nu există
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        sheet.getRange('A1').setValue('lastNumber');
        sheet.getRange('B1').setValue('timestamp');
        sheet.getRange('A2').setValue(1);
        sheet.getRange('B2').setValue(new Date().toISOString());
      }

      // Citește ultimul număr din celula A2
      const lastNumber = sheet.getRange('A2').getValue();
      const lastNumberInt = parseInt(lastNumber) || 1;

      Logger.log('GET Primary Number: ' + lastNumberInt);

      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          lastNumber: lastNumberInt
        }))
        .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
      Logger.log('ERROR in getLastPrimaryNumber: ' + error.toString());
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: error.toString(),
          lastNumber: 1
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  // === NOU COD PENTRU PRIMARY LABELS - SFÂRȘIT ===

  // ... restul codului doGet() existent rămâne neschimbat
}
```

#### 2.2 Modificare funcția `doPost()`

Găsiți funcția `doPost(e)` existentă și adăugați următorul cod la **ÎNCEPUTUL** funcției (după `const data = JSON.parse(e.postData.contents);`):

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // === NOU COD PENTRU PRIMARY LABELS - ÎNCEPE ===
    if (data.action === 'updateLastPrimaryNumber') {
      try {
        const spreadsheetId = data.spreadsheetId || '10TegZTOq45WtGol7KftrJm080PbB7pwDEv92fnq9BXw';
        const sheetName = data.sheetName || 'PrimaryLabelsCounter';
        const lastNumber = parseInt(data.lastNumber) || 1;
        const timestamp = data.timestamp || new Date().toISOString();

        const ss = SpreadsheetApp.openById(spreadsheetId);
        let sheet = ss.getSheetByName(sheetName);

        // Creează sheet dacă nu există
        if (!sheet) {
          sheet = ss.insertSheet(sheetName);
          sheet.getRange('A1').setValue('lastNumber');
          sheet.getRange('B1').setValue('timestamp');
        }

        // Salvează numărul în celula A2 și timestamp în B2
        sheet.getRange('A2').setValue(lastNumber);
        sheet.getRange('B2').setValue(timestamp);

        Logger.log('UPDATE Primary Number: ' + lastNumber + ' at ' + timestamp);

        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            lastNumber: lastNumber,
            timestamp: timestamp
          }))
          .setMimeType(ContentService.MimeType.JSON);

      } catch (error) {
        Logger.log('ERROR in updateLastPrimaryNumber: ' + error.toString());
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    // === NOU COD PENTRU PRIMARY LABELS - SFÂRȘIT ===

    // ... restul codului doPost() existent rămâne neschimbat (pentru appendRows etc.)

  } catch (error) {
    Logger.log('ERROR in doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Pasul 3: Salvare și Deployment

1. **Salvați** scriptul: `File` → `Save` sau `Ctrl+S`
2. **Deploy nou**:
   - Click pe `Deploy` → `New deployment`
   - Tip: `Web app`
   - Execute as: `Me`
   - Who has access: `Anyone`
   - Click `Deploy`
3. **Notați URL-ul** de deployment (dacă este diferit de cel vechi)
4. **Autorizați** aplicația dacă este solicitat

### Pasul 4: Testare Script (Opțional)

Puteți testa scriptul direct în Google Apps Script:

1. Creați o funcție de test:
```javascript
function testPrimaryLabelsCounter() {
  const SPREADSHEET_ID = '10TegZTOq45WtGol7KftrJm080PbB7pwDEv92fnq9BXw';
  const SHEET_NAME = 'PrimaryLabelsCounter';

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange('A1').setValue('lastNumber');
    sheet.getRange('B1').setValue('timestamp');
    sheet.getRange('A2').setValue(1);
    sheet.getRange('B2').setValue(new Date().toISOString());
    Logger.log('Sheet "PrimaryLabelsCounter" creat cu succes!');
  } else {
    Logger.log('Sheet "PrimaryLabelsCounter" există deja.');
  }

  const currentValue = sheet.getRange('A2').getValue();
  Logger.log('Valoare curentă: ' + currentValue);
}
```

2. Rulați funcția: `Run` → `testPrimaryLabelsCounter`
3. Verificați log-urile: `View` → `Logs`

---

## Utilizare Aplicație

### Pasul 1: Accesare Aplicație

1. Deschideți aplicația în browser:
   - Local: `http://localhost:8000/` sau `file:///D:/depozit/index.html`
   - Rețea: `http://IP_DEVICE/depozit/`
   - GitHub Pages: `https://username.github.io/depozit/`

2. Veți vedea **3 butoane** pe pagina principală:
   - 🖨️ **Tipărire Etichete** (albastru)
   - 📦 **Tipărire Etichete Primare** (portocaliu) - NOU
   - 📊 **Scanare Etichete** (verde)

### Pasul 2: Generare Etichete Primare

1. **Click** pe butonul **"TIPĂRIRE ETICHETE PRIMARE"** (portocaliu)

2. Pe noua pagină, veți vedea:
   - **Ultimul număr folosit**: X (citit din Google Sheets)
   - **Input**: "Câte etichete doriți să tipăriți?"

3. **Introduceți** numărul de etichete dorite (1-100)
   - Exemplu: dacă ultimul număr este 5 și introduceți 3, veți genera etichetele 6, 7, 8

4. **Click** pe butonul **"Generează Preview"** (albastru cu icon 👁️)
   - Veți vedea previzualizarea tuturor etichetelor generate
   - Fiecare etichetă va avea:
     - Rând 1: "STIVA NR. :"
     - Rând 2: Numărul (ex: 6, 7, 8)

5. **Click** pe butonul **"Tipărește"** (verde cu icon 🖨️)
   - Se va deschide dialog-ul de tipărire
   - **Setări recomandate pentru imprimantă**:
     - Orientare: **Landscape (Peisaj)**
     - Format hârtie: **A4**
     - Margini: **0mm** (fără margini)
     - Scale: **100%** (fără scalare)
   - Selectați imprimanta și click **Print**

6. După tipărire:
   - Aplicația salvează automat noul număr în Google Sheets
   - Veți vedea notificare: "X etichete tipărite! Următorul număr: Y"
   - La următoarea accesare, numărul va porni de la Y

### Pasul 3: Verificare Sincronizare

Pentru a verifica că sincronizarea funcționează:

1. **Device A**: Tipăriți 3 etichete (ex: 1, 2, 3)
2. **Device B**: Deschideți aplicația → Veți vedea "Ultimul număr folosit: 4"
3. **Device B**: Tipăriți 2 etichete (4, 5)
4. **Device A**: Refresh pagina → Veți vedea "Ultimul număr folosit: 6"

---

## Testare Funcționalitate

### Test 1: Verificare Google Sheets

1. Accesați spreadsheet-ul:
   ```
   https://docs.google.com/spreadsheets/d/10TegZTOq45WtGol7KftrJm080PbB7pwDEv92fnq9BXw
   ```

2. Căutați sheet-ul **"PrimaryLabelsCounter"**
   - Dacă nu există, va fi creat automat la prima accesare a aplicației

3. Verificați structura:
   ```
   | A (lastNumber) | B (timestamp)                |
   |----------------|------------------------------|
   | lastNumber     | timestamp                    |
   | 1              | 2026-01-15T10:30:00.000Z     |
   ```

### Test 2: Test API Google Apps Script

#### Test GET (citire număr):
Deschideți în browser:
```
https://script.google.com/macros/s/AKfycbz7jLGhBtrJ0xn1OQ5smMEppY-zwqew1GSO6UWSJw9nWlvnMV1Y4lGTgtELtlDcW3g/exec?action=getLastPrimaryNumber
```

Răspuns așteptat:
```json
{
  "success": true,
  "lastNumber": 1
}
```

#### Test POST (salvare număr):
Folosiți Postman, curl sau alt client HTTP:

```bash
curl -X POST "https://script.google.com/macros/s/AKfycbz7jLGhBtrJ0xn1OQ5smMEppY-zwqew1GSO6UWSJw9nWlvnMV1Y4lGTgtELtlDcW3g/exec" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "updateLastPrimaryNumber",
    "spreadsheetId": "10TegZTOq45WtGol7KftrJm080PbB7pwDEv92fnq9BXw",
    "sheetName": "PrimaryLabelsCounter",
    "lastNumber": 50,
    "timestamp": "2026-01-15T10:30:00.000Z"
  }'
```

Răspuns așteptat:
```json
{
  "success": true,
  "lastNumber": 50,
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

### Test 3: Test Print Preview

1. Generați o etichetă de test
2. Verificați în preview:
   - Textul ocupă ~85% din înălțimea paginii
   - Font: Verdana, bold, negru
   - Textul este centrat
   - "STIVA NR. :" pe primul rând
   - Numărul pe al doilea rând

### Test 4: Test Print Real

1. Tipăriți o etichetă de test pe hârtie A4
2. Măsurați cu rigla:
   - Textul ocupă aproximativ 178mm din 210mm înălțime (85%)
   - Verificați dacă textul este lizibil de la distanță

---

## Depanare Probleme

### Problemă: "Eroare la citirea numărului din cloud"

**Cauze posibile:**
1. Google Apps Script nu este configurat corect
2. URL-ul scriptului este greșit
3. Scriptul nu este deploiat public

**Soluții:**
1. Verificați că ați adăugat codul în Google Apps Script
2. Verificați că URL-ul din `js/primary-labels.js` este corect
3. Verificați deployment-ul: `Deploy` → `Manage deployments` → verificați că "Who has access" este "Anyone"
4. Testați manual API-ul GET (vezi secțiunea Test 2)

### Problemă: "Numărul nu a fost salvat în cloud"

**Cauze posibile:**
1. Lipsa conexiunii la internet
2. Eroare în funcția `doPost()` din Google Apps Script
3. CORS issues

**Soluții:**
1. Verificați conexiunea la internet
2. Verificați log-urile în Google Apps Script: `Executions` → căutați erori
3. Testați manual API-ul POST (vezi secțiunea Test 2)
4. Verificați că scriptul returnează JSON corect

### Problemă: Numărul nu se sincronizează între device-uri

**Cauze posibile:**
1. Cache-ul browser-ului
2. Service Worker cu cache vechi

**Soluții:**
1. Force refresh: `Ctrl+F5` (Windows) sau `Cmd+Shift+R` (Mac)
2. Clear cache și cookies pentru site
3. Verificați în Google Sheets dacă numărul se actualizează manual
4. Testați în modul incognito

### Problemă: Textul nu se tipărește la dimensiunea corectă

**Cauze posibile:**
1. Setări imprimantă greșite
2. Browser scaling

**Soluții:**
1. Verificați setările imprimantă:
   - Orientare: Landscape
   - Format: A4
   - Margini: 0mm
   - Scale: 100%
2. Verificați setările de print în browser:
   - Chrome: `More settings` → `Scale` → 100%
   - Firefox: `More settings` → `Scale` → 100%

### Problemă: Butonul "Tipărește" nu se activează

**Cauze posibile:**
1. Nu s-a generat preview-ul
2. Eroare JavaScript

**Soluții:**
1. Click pe "Generează Preview" mai întâi
2. Deschideți Console (F12) și verificați erorile
3. Verificați că input-ul are o valoare validă (1-100)

---

## Fișiere Modificate/Create

### Fișiere noi:
1. `D:\depozit\print-primary-labels.html` - Interfața pentru tipărire etichete primare
2. `D:\depozit\js\primary-labels.js` - Logica JavaScript
3. `D:\depozit\google-apps-script-primary-labels.js` - Cod pentru Google Apps Script (referință)
4. `D:\depozit\INSTRUCTIUNI-ETICHETE-PRIMARE.md` - Acest fișier

### Fișiere modificate:
1. `D:\depozit\index.html` - Adăugat buton portocaliu
2. `D:\depozit\styles.css` - Adăugate stiluri noi (~350 linii)
3. `D:\depozit\service-worker.js` - Adăugate fișiere noi în cache

---

## Resurse Utile

- **Google Apps Script Documentation**: https://developers.google.com/apps-script
- **Google Sheets API**: https://developers.google.com/sheets/api
- **Print CSS**: https://developer.mozilla.org/en-US/docs/Web/CSS/@page
- **Service Workers**: https://developers.google.com/web/fundamentals/primers/service-workers

---

## Contact și Suport

Pentru probleme sau întrebări, verificați:
1. Console-ul browser-ului (F12)
2. Log-urile Google Apps Script
3. Network tab în DevTools pentru request-uri failed

---

**Versiune**: 1.0
**Data**: 2026-01-15
**Autor**: Claude Code
