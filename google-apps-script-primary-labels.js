/**
 * INSTRUCȚIUNI PENTRU MODIFICARE GOOGLE APPS SCRIPT
 * ==================================================
 *
 * Acest fișier conține codul care trebuie ADĂUGAT în scriptul Google Apps Script existent.
 *
 * PAȘI:
 * 1. Accesați Google Apps Script: https://script.google.com/
 * 2. Deschideți proiectul cu URL-ul:
 *    https://script.google.com/macros/s/AKfycbz7jLGhBtrJ0xn1OQ5smMEppY-zwqew1GSO6UWSJw9nWlvnMV1Y4lGTgtELtlDcW3g/exec
 * 3. Găsiți funcția doGet() existentă și ADĂUGAȚI noul cod la ÎNCEPUTUL funcției
 * 4. Găsiți funcția doPost() existentă și ADĂUGAȚI noul cod la ÎNCEPUTUL funcției
 * 5. Salvați scriptul
 * 6. Deploy: "Deploy" -> "New deployment" -> "Web app" -> "Deploy"
 * 7. Copiați URL-ul nou de deployment (dacă diferă de cel vechi)
 *
 * IMPORTANT: Aceste modificări NU afectează funcționalitatea existentă de scanare etichete!
 */

// ============================================
// ADĂUGAȚI ACEST COD ÎN FUNCȚIA doGet()
// ============================================

/**
 * Funcția doGet trebuie modificată pentru a gestiona cereri GET pentru numărul curent de etichetă primară.
 * Adăugați acest cod la ÎNCEPUTUL funcției doGet() existente:
 */

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
        sheet.getRange('A2').setValue(1); // Valoare inițială
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
          lastNumber: 1 // Fallback
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  // === NOU COD PENTRU PRIMARY LABELS - SFÂRȘIT ===

  // ... restul codului doGet() existent rămâne neschimbat
}


// ============================================
// ADĂUGAȚI ACEST COD ÎN FUNCȚIA doPost()
// ============================================

/**
 * Funcția doPost trebuie modificată pentru a gestiona salvarea numărului curent.
 * Adăugați acest cod la ÎNCEPUTUL funcției doPost() existente:
 */

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


// ============================================
// TESTARE COD
// ============================================

/**
 * Funcție de test pentru a verifica dacă modificările funcționează corect.
 * Rulați această funcție în Google Apps Script pentru a testa.
 */

function testPrimaryLabelsCounter() {
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
    Logger.log('Sheet "PrimaryLabelsCounter" a fost creat cu succes!');
  } else {
    Logger.log('Sheet "PrimaryLabelsCounter" există deja.');
  }

  // Citește valoarea curentă
  const currentValue = sheet.getRange('A2').getValue();
  Logger.log('Valoare curentă: ' + currentValue);

  // Testează update
  const newValue = parseInt(currentValue) + 10;
  sheet.getRange('A2').setValue(newValue);
  sheet.getRange('B2').setValue(new Date().toISOString());
  Logger.log('Valoare nouă salvată: ' + newValue);

  // Verifică update
  const verifyValue = sheet.getRange('A2').getValue();
  Logger.log('Verificare: ' + verifyValue);

  if (verifyValue === newValue) {
    Logger.log('✅ TEST PASSED - Salvarea funcționează corect!');
  } else {
    Logger.log('❌ TEST FAILED - Eroare la salvare!');
  }
}


// ============================================
// STRUCTURA SHEET-ULUI "PrimaryLabelsCounter"
// ============================================

/**
 * Sheet-ul va avea următoarea structură:
 *
 * | A (lastNumber) | B (timestamp)                |
 * |----------------|------------------------------|
 * | lastNumber     | timestamp                    |
 * | 1              | 2026-01-15T10:30:00.000Z     |
 *
 * - Coloana A conține ultimul număr de etichetă folosit
 * - Coloana B conține timestamp-ul ultimei modificări (pentru audit)
 * - Rândul 2 conține valorile curente (nu header)
 */


// ============================================
// VERIFICARE DEPLOYMENT
// ============================================

/**
 * După ce ați modificat și deploiat scriptul, testați-l cu:
 *
 * 1. Test GET (în browser sau Postman):
 *    https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getLastPrimaryNumber
 *
 *    Răspuns așteptat:
 *    {"success":true,"lastNumber":1}
 *
 * 2. Test POST (în Postman sau curl):
 *    URL: https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
 *    Method: POST
 *    Content-Type: application/json
 *    Body:
 *    {
 *      "action": "updateLastPrimaryNumber",
 *      "spreadsheetId": "10TegZTOq45WtGol7KftrJm080PbB7pwDEv92fnq9BXw",
 *      "sheetName": "PrimaryLabelsCounter",
 *      "lastNumber": 50,
 *      "timestamp": "2026-01-15T10:30:00.000Z"
 *    }
 *
 *    Răspuns așteptat:
 *    {"success":true,"lastNumber":50,"timestamp":"2026-01-15T10:30:00.000Z"}
 *
 * 3. Verificare în Google Sheets:
 *    Accesați spreadsheet-ul:
 *    https://docs.google.com/spreadsheets/d/10TegZTOq45WtGol7KftrJm080PbB7pwDEv92fnq9BXw
 *
 *    Ar trebui să vedeți un sheet nou "PrimaryLabelsCounter" cu valoarea 50 în celula A2.
 */


// ============================================
// NOTIȚE IMPORTANTE
// ============================================

/**
 * 1. NU ștergeți codul existent din Google Apps Script!
 * 2. Doar ADĂUGAȚI acest cod la începutul funcțiilor doGet() și doPost()
 * 3. După modificare, salvați și deploiați cu "New deployment"
 * 4. Dacă URL-ul de deployment se schimbă, actualizați-l în primary-labels.js
 * 5. Sheet-ul "PrimaryLabelsCounter" se va crea automat la prima accesare
 * 6. Testați întotdeauna după deployment pentru a verifica funcționalitatea
 */
