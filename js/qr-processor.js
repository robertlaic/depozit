// Funcție pentru popularea formularului din datele QR

function populateFormFromQR(qrData) {
    console.log('QR Data primit:', qrData);
    
    // Curăță datele - înlocuiește diverse separatoare cu |
    let cleanedData = qrData
        .replace(/Â/g, '|')
        .replace(/\s+\|\s+/g, '|')
        .replace(/\s+\|\s*/g, '|')
        .replace(/\s*\|\s+/g, '|')
        .trim();
    
    console.log('Date curățate:', cleanedData);
    
    // Împarte în linii și filtrează liniile goale
    const lines = cleanedData.split('\n').filter(line => line.trim() !== '');
    console.log('Linii filtrate:', lines);
    
    // Verifică dacă funcția clearForm există înainte de a o apela
    if (typeof clearForm === 'function') {
        clearForm();
    }
    
    if (lines.length === 0) {
        throw new Error('Date QR goale după curățare');
    }
    
    // Procesăm linia principală - presupunem că toate datele sunt pe o singură linie
    const mainLine = lines[0];
    
    // ===== DETECTARE VECHI FORMAT =====
    // Verificăm dacă este formatul vechi (pentru compatibilitate)
    const isOldFormat = !mainLine.match(/^[A-Z]_.*\|\d+x.*\d+\|[\d.]+/);
    
    if (isOldFormat) { 
        return processOldFormatQR(qrData); 
    }
    
    // ===== PROCESARE FORMAT NOU =====
    console.log('Procesare format nou standardizat:', mainLine);
    
    // Împărțim linia pe separatorul |
    const parts = mainLine.split('|');
    console.log('Părți separate:', parts);
    
    if (parts.length < 3) {
        throw new Error('Format QR invalid: sunt necesare minim cod produs, dimensiune și bucăți');
    }
    
    // Extragem informațiile de bază
    const productCode = parts[0].trim();      // Cod produs (R_DIM_C24_PL)
    const mainDimension = parts[1].trim();    // Dimensiune principală (50000x600x80 sau 9000xx43)
    const mainQuantity = parts[2].trim();     // Bucăți pentru dimensiunea principală sau volum pentru DIV
    
    console.log('Cod produs:', productCode);
    console.log('Dimensiune principală:', mainDimension);
    console.log('Bucăți/volum principale:', mainQuantity);
    
    // Parsăm codul produsului
    const productParts = productCode.split('_').filter(p => p.length > 0);
    if (productParts.length < 3) {
        throw new Error(`Format cod produs insuficient: găsite ${productParts.length} părți, trebuie minim 3`);
    }
    
    // Extragem componentele produsului
    const specia = productParts[0];
    const tip = productParts[1];
    const calitate = productParts[productParts.length - 1];
    const numeParts = productParts.slice(2, -1);
    const nume = numeParts.length > 0 ? numeParts.join('_') : productParts[2];
    
    console.log('Componente produs:', { specia, tip, nume, calitate });

    // Pentru DIV, al treilea parametru este volumul, nu bucățile
    if (tip === 'DIV') {
        // Ascundem câmpul bucăți și afișăm câmpul volum
        const bucatiContainer = document.getElementById('bucati')?.parentElement;
        const volumDivContainer = document.getElementById('volum-div-container');
        
        if (bucatiContainer) bucatiContainer.style.display = 'none';
        if (volumDivContainer) volumDivContainer.style.display = 'block';
        
        // Setăm volumul în câmpul dedicat
        const volumDiv = document.getElementById('volum-div');
        if (volumDiv) {
            // Convertim punct în virgulă pentru afișare
            volumDiv.value = mainQuantity.replace('.', ',');
        }
        
        // Golim câmpul bucăți
        const bucatiElement = document.getElementById('bucati');
        if (bucatiElement) bucatiElement.value = '';
    } else {
        // Pentru non-DIV, procesare normală
        const bucatiContainer = document.getElementById('bucati')?.parentElement;
        const volumDivContainer = document.getElementById('volum-div-container');
        
        if (bucatiContainer) bucatiContainer.style.display = 'block';
        if (volumDivContainer) volumDivContainer.style.display = 'none';
        
        const bucatiElement = document.getElementById('bucati');
        if (bucatiElement && mainQuantity && !isNaN(mainQuantity)) {
            bucatiElement.value = mainQuantity;
        }
    }
    
    // Salvăm dimensiunea originală pentru DIV (va fi folosită în cod)
    let originalDimension = mainDimension;
    
    // Parsăm dimensiunea principală
    let dimensionMatch;
    if (tip === 'DIV') {
        // Verificăm formatul pentru DIV (LxxG)
        dimensionMatch = mainDimension.match(/^(\d+)xx(\d+)$/);
        if (dimensionMatch) {
            // Reformatăm array-ul pentru a fi consistent [full_match, lungime, latime, grosime]
            dimensionMatch = [dimensionMatch[0], dimensionMatch[1], '', dimensionMatch[2]];
            console.log('Format DIV detectat cu succes (LxxG)');
        } else {
            // Încercăm și alte formate posibile pentru DIV
            const parts = mainDimension.split('x');
            if (parts.length >= 2) {
                const lungime = parts[0];
                const grosime = parts[parts.length - 1];
                if (!isNaN(lungime) && !isNaN(grosime)) {
                    dimensionMatch = [mainDimension, lungime, '', grosime];
                    console.log('Format DIV detectat manual:', lungime, 'x0x', grosime);
                    // Reformatăm dimensiunea originală pentru a fi siguri că are formatul LxxG
                    originalDimension = `${lungime}xx${grosime}`;
                }
            }
        }
    } else {
        // Pentru alte tipuri, formatul standard LxlxG
        dimensionMatch = mainDimension.match(/^(\d+)x(\d+)x(\d+)$/);
    }
    
    if (!dimensionMatch) {
        console.error('Format dimensiune invalid:', mainDimension, 'Tip:', tip);
        throw new Error(`Format dimensiune invalid: ${mainDimension}. Trebuie să fie în formatul LxlxG sau LxxG pentru DIV`);
    }
    
    const [, lungime, latime, grosime] = dimensionMatch;
    console.log('Dimensiuni extrase:', { lungime, latime, grosime });
    
    // Extragem dimensiunile adiționale
    const additionalDims = [];
    
    // Parcurgem părțile rămase pentru a extrage dimensiunile adiționale și locația
    // Începem de la index 3 (după cod produs, dimensiune principală și bucăți)
    let locationFound = false;
    let perete = '', coloana = '', rand = '';
    let locatieExterna = false;
    let textLocatieExterna = '';
    
    for (let i = 3; i < parts.length; i++) {
        const currentPart = parts[i].trim();
        
        // Verificăm dacă este o locație externă
        if (currentPart.startsWith('EXT:')) {
            locatieExterna = true;
            textLocatieExterna = currentPart.substring(4); // Extrage textul după "EXT:"
            console.log('Locație externă detectată:', textLocatieExterna);
            break;
        }
        
        // Verificăm dacă am ajuns la ultima parte și dacă pare a fi o locație din depozit
        if (i === parts.length - 1) {
            const locationMatch = currentPart.match(/^([A-H])-(\d+)-(\d+)$/);
            if (locationMatch) {
                [, perete, coloana, rand] = locationMatch;
                locationFound = true;
                console.log('Locație din depozit găsită:', { perete, coloana, rand });
                break;
            }
        }
        
        // Verificăm dacă avem atât dimensiunea cât și bucățile (pentru non-DIV)
        if (i + 1 < parts.length && tip !== 'DIV') {
            const dimPart = currentPart;
            const qtyPart = parts[i + 1].trim();
            
            // Verificăm dacă dimensiunea este validă
            const addDimMatch = dimPart.match(/^(\d+)x(\d*)x(\d+)$/);
            if (addDimMatch && !isNaN(qtyPart)) {
                const [, L, l, G] = addDimMatch;
                additionalDims.push({
                    id: Date.now() + i,
                    L: L,
                    l: l,
                    G: G,
                    bucati: qtyPart
                });
                
                console.log(`Dimensiune adițională ${additionalDims.length} detectată:`, { 
                    L, l, G, bucati: qtyPart 
                });
                
                // Trecem peste partea cu bucăți
                i++;
            }
        }
    }
    
    console.log('Dimensiuni adiționale detectate:', additionalDims);
    console.log('Locație finală detectată:', 
                locatieExterna ? { externa: textLocatieExterna } : 
                locationFound ? { perete, coloana, rand } : 'Nicio locație detectată');
    
    // ===== POPULARE FORMULAR =====
    // Completăm formularul cu datele extrase
    const speciaElement = document.getElementById('specia');
    const tipElement = document.getElementById('tip');
    const calitateElement = document.getElementById('calitate');
    const lungimeElement = document.getElementById('lungime');
    const latimeElement = document.getElementById('latime');
    const grosimeElement = document.getElementById('grosime');
    const bucatiElement = document.getElementById('bucati');
    
    if (speciaElement) speciaElement.value = specia;
    if (tipElement) {
        tipElement.value = tip;
        // Apelează updateNumeOptions pentru a actualiza formularul și a dezactiva/activa butonul 
        // pentru dimensiuni adiționale în funcție de tip
        if (typeof updateNumeOptions === 'function') {
            updateNumeOptions();
        }
    }
    if (calitateElement) calitateElement.value = calitate;
    if (lungimeElement) lungimeElement.value = lungime;
    if (latimeElement) latimeElement.value = latime;
    if (grosimeElement) grosimeElement.value = grosime;
    
    // Actualizează opțiunile pentru nume
    setTimeout(() => {
        const numeSelect = document.getElementById('nume');
        if (numeSelect) {
            const numeOption = numeSelect.querySelector(`option[value="${nume}"]`);
            if (numeOption) {
                numeSelect.value = nume;
            } else if (nume) {
                // Adaugă opțiunea dacă nu există
                const newOption = document.createElement('option');
                newOption.value = nume;
                newOption.textContent = nume;
                numeSelect.appendChild(newOption);
                numeSelect.value = nume;
            }
        }
    }, 50);
    
    // Setăm dimensiunile adiționale doar dacă nu este DIV
    if (typeof additionalDimensions !== 'undefined' && tip !== 'DIV') {
        additionalDimensions = additionalDims;
        if (typeof renderDimensionsList === 'function') {
            renderDimensionsList();
        }
    }
    
    // Setează locația în formular
    if (locatieExterna) {
        console.log('Setăm locația externă în formular:', textLocatieExterna);
        
        setTimeout(() => {
            try {
                const locatieExternaCheckbox = document.getElementById('locatie-externa');
                const locatieExternaInput = document.getElementById('locatie-externa-input');
                
                if (locatieExternaCheckbox && locatieExternaInput) {
                    locatieExternaCheckbox.checked = true;
                    
                    // Declanșează evenimentul de schimbare pentru a activa/dezactiva câmpurile corespunzătoare
                    if (typeof toggleLocatieExterna === 'function') {
                        toggleLocatieExterna();
                    }
                    
                    // Setează valoarea locației externe
                    locatieExternaInput.value = textLocatieExterna;
                    
                    console.log('Locație externă setată cu succes');
                }
            } catch (err) {
                console.error('Eroare la setarea locației externe:', err);
            }
        }, 100);
    } else if (locationFound && perete && coloana && rand) {
        console.log('Setăm locația în depozit în formular:', { perete, coloana, rand });
        
        setTimeout(() => {
            try {
                const pereteSelect = document.getElementById('perete');
                const coloanaSelect = document.getElementById('coloana');
                const randSelect = document.getElementById('rand');
                
                if (pereteSelect) {
                    const pereteExists = Array.from(pereteSelect.options).some(opt => opt.value === perete);
                    if (pereteExists) {
                        pereteSelect.value = perete;
                    } else {
                        const newOption = document.createElement('option');
                        newOption.value = perete;
                        newOption.textContent = perete;
                        pereteSelect.appendChild(newOption);
                        pereteSelect.value = perete;
                    }
                }
                
                if (coloanaSelect) {
                    const coloanaExists = Array.from(coloanaSelect.options).some(opt => opt.value === coloana);
                    if (coloanaExists) {
                        coloanaSelect.value = coloana;
                    } else {
                        const newOption = document.createElement('option');
                        newOption.value = coloana;
                        newOption.textContent = coloana;
                        coloanaSelect.appendChild(newOption);
                        coloanaSelect.value = coloana;
                    }
                }
                
                if (randSelect) {
                    const randExists = Array.from(randSelect.options).some(opt => opt.value === rand);
                    if (randExists) {
                        randSelect.value = rand;
                    } else {
                        const newOption = document.createElement('option');
                        newOption.value = rand;
                        newOption.textContent = rand;
                        randSelect.appendChild(newOption);
                        randSelect.value = rand;
                    }
                }
                
                console.log('Locație din depozit setată cu succes');
            } catch (err) {
                console.error('Eroare la setarea locației din depozit:', err);
            }
        }, 100);
    }
    
    // Generăm previzualizarea
    setTimeout(() => {
        if (typeof generatePreview === 'function') {
            generatePreview();
        }
    }, 300);
}

// Funcție pentru procesarea formatului vechi (compatibilitate)
function processOldFormatQR(qrData) {
    // Curăță datele - înlocuiește diverse separatoare cu |
    let cleanedData = qrData
        .replace(/Â/g, '|')
        .replace(/\s+\|\s+/g, '|')
        .replace(/\s+\|\s*/g, '|')
        .replace(/\s*\|\s+/g, '|')
        .trim();
    
    // Împarte în linii
    const lines = cleanedData.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
        throw new Error('Date QR goale după curățare');
    }
    
    // ===== PROCESARE LOCAȚIE =====
    // Verifică mai întâi dacă există o linie de locație separată sau externă
    let perete = '', coloana = '', rand = '';
    let locationFound = false;
    let locatieExterna = false;
    let textLocatieExterna = '';
    
    // Caută locația în ultimele caractere ale ultimei linii
    const lastLine = lines[lines.length - 1];
    
    // Verifică dacă este o locație externă
    if (lastLine.includes('EXT:')) {
        const extMatch = lastLine.match(/EXT:(.+)$/);
        if (extMatch) {
            textLocatieExterna = extMatch[1].trim();
            locatieExterna = true;
            console.log('Locație externă găsită:', textLocatieExterna);
            
            // Curăță ultima linie de pattern-ul locației externe
            lines[lines.length - 1] = lastLine.replace(/EXT:.+$/, '').trim();
            
            // Dacă ultima linie este goală după îndepărtarea locației, o eliminăm
            if (lines[lines.length - 1] === '') {
                lines.pop();
            }
        }
    } else {
        // Verifică locația din depozit
        const locationPattern = /([A-H])-(\d+)-(\d+)$/;
        const locationMatch = lastLine.match(locationPattern);
        
        if (locationMatch) {
            [, perete, coloana, rand] = locationMatch;
            locationFound = true;
            console.log('Locație din depozit găsită la sfârșitul ultimei linii:', { perete, coloana, rand });
            
            // Curăță ultima linie de pattern-ul locației
            lines[lines.length - 1] = lastLine.replace(locationPattern, '').trim();
            
            // Dacă ultima linie este goală după îndepărtarea locației, o eliminăm
            if (lines[lines.length - 1] === '') {
                lines.pop();
            }
        }
    }
    
    // Verificăm dacă există linii separate pentru locație sau locație externă
    for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i].trim();
        
        // Verifică locație externă
        if (currentLine.startsWith('EXT:')) {
            textLocatieExterna = currentLine.substring(4).trim();
            locatieExterna = true;
            lines.splice(i, 1); // Elimină linia de locație externă
            console.log('Locație externă găsită pe linie separată:', textLocatieExterna);
            break;
        }
        
        // Verifică locație din depozit
        const separateLocationPattern = /^([A-H])-(\d+)-(\d+)$/;
        const separateLocationMatch = currentLine.match(separateLocationPattern);
        
        if (separateLocationMatch) {
            [, perete, coloana, rand] = separateLocationMatch;
            lines.splice(i, 1); // Elimină linia de locație
            locationFound = true;
            console.log('Locație din depozit găsită pe linie separată:', { perete, coloana, rand });
            break;
        }
    }
    
    // Verificăm dacă avem o linie complexă cu multiple dimensiuni și produse
    const mainLine = lines[0];
    console.log('Linia principală pentru procesare:', mainLine);
    
    // Împărțim linia principală pe pipe (|) pentru a extrage fiecare pereche produs-bucăți
    const productParts = mainLine.split('|');
    console.log('Părți separate pe pipe:', productParts);
    
    if (productParts.length === 0) {
        throw new Error('Nu s-au găsit părți valide în codul QR');
    }
    
    // Procesăm prima parte pentru dimensiunea principală
    let firstPart = productParts[0].trim();
    let bucatiPart = '';
    
    // Verifică dacă există un număr la sfârșitul primei părți (de ex: "...PL_10000x250x150 444")
    const firstBucatiMatch = firstPart.match(/\s+(\d+)$/);
    if (firstBucatiMatch) {
        bucatiPart = firstBucatiMatch[1];
        firstPart = firstPart.substring(0, firstPart.length - bucatiPart.length).trim();
    } 
    // Dacă nu găsim numărul la sfârșitul primei părți, verificăm dacă este în a doua parte
    else if (productParts.length > 1) {
        const secondPart = productParts[1].trim();
        const secondBucatiMatch = secondPart.match(/^(\d+)/);
        if (secondBucatiMatch && !secondPart.includes('x')) {
            bucatiPart = secondBucatiMatch[1];
            console.log('Bucăți găsite în a doua parte:', bucatiPart);
            
            // Dacă a doua parte conține doar numărul de bucăți, o eliminăm din listă
            if (secondPart === bucatiPart) {
                productParts.splice(1, 1);
            }
        }
    }
    
    console.log('Prima parte:', firstPart);
    console.log('Bucăți pentru prima parte:', bucatiPart);
    
    // Verifică dacă în firstPart există o etichetă și dimensiune
    const productMatchWithDim = firstPart.match(/^(.+)_(\d+x\d*x\d+)$/);
    
    // Dacă nu găsim formatul standard, încercăm formatul DIV cu xx
    const productMatchWithDimDIV = !productMatchWithDim ? firstPart.match(/^(.+)_(\d+xx\d+)$/) : null;
    
    // Pregătim variabilele pentru dimensiuni
    let productWithoutDim = '';
    let dimensiune = '';
    
    if (productMatchWithDim) {
        productWithoutDim = productMatchWithDim[1];
        dimensiune = productMatchWithDim[2];
    } else if (productMatchWithDimDIV) {
        productWithoutDim = productMatchWithDimDIV[1];
        dimensiune = productMatchWithDimDIV[2];
    } else {
        // Extragem dimensiunea din prima parte - verificăm mai multe pattern-uri
        const dimMatch = firstPart.match(/(\d+)x(\d+)x(\d+)$/);
        const dimMatchDIV = !dimMatch ? firstPart.match(/(\d+)xx(\d+)$/) : null;
        
        if (dimMatch) {
            dimensiune = dimMatch[0];
            productWithoutDim = firstPart.replace('_' + dimensiune, '');
        } else if (dimMatchDIV) {
            dimensiune = dimMatchDIV[0];
            productWithoutDim = firstPart.replace('_' + dimensiune, '');
        } else {
            throw new Error('Nu s-au găsit dimensiuni în format valid (LxlxG sau LxxG) în prima parte');
        }
    }
    
    console.log('Produs fără dimensiuni:', productWithoutDim);
    console.log('Dimensiune extrasă:', dimensiune);
    
    // Verificăm dacă dimensiunea este în format DIV (LxxG)
    const isDIVFormat = dimensiune.includes('xx');
    
    // Parsăm dimensiunea în funcție de format
    let lungime = '', latime = '', grosime = '';
    if (isDIVFormat) {
        const dimPartsDIV = dimensiune.split('xx');
        if (dimPartsDIV.length === 2) {
            lungime = dimPartsDIV[0];
            latime = ''; // Lățimea este goală pentru DIV
            grosime = dimPartsDIV[1];
        } else {
            throw new Error('Format dimensiune DIV invalid');
        }
    } else {
        const dimParts = dimensiune.split('x');
        if (dimParts.length === 3) {
            lungime = dimParts[0];
            latime = dimParts[1];
            grosime = dimParts[2];
        } else {
            throw new Error('Format dimensiune standard invalid');
        }
    }
    
    console.log('Dimensiuni principale:', { lungime, latime, grosime });
    
    // Împarte produsul pe underscore pentru a extrage componentele etichetei
    const parts = productWithoutDim.split('_').filter(p => p.length > 0);
    console.log('Componente etichetă:', parts);
    
    if (parts.length < 3) {
        throw new Error(`Format insuficient: găsite ${parts.length} părți, trebuie minim 3`);
    }
    
    // Identifică componentele
    const specia = parts[0];
    const tip = parts[1];
    const calitate = parts[parts.length - 1];
    const numeParts = parts.slice(2, -1);
    const nume = numeParts.length > 0 ? numeParts.join('_') : parts[2];
    
    console.log('Componente finale ale etichetei:', { specia, tip, nume, calitate });
    
    // Validează componentele
    if (!specia || !tip || !calitate) {
        throw new Error(`Componente lipsă: ${JSON.stringify({ specia, tip, calitate })}`);
    }
    
    // Extragem dimensiunile adiționale din celelalte părți
    const additionalDims = [];
    
    // Începem de la index 1 deoarece am procesat deja prima parte
    for (let i = 1; i < productParts.length; i++) {
        const part = productParts[i].trim();
        if (!part) continue;
        
        // Extrage bucățile de la început (de ex: "444R_SF_...")
        let partBucati = '';
        let partProduct = part;
        
        const bucatiMatch = part.match(/^(\d+)/);
        if (bucatiMatch) {
            partBucati = bucatiMatch[1];
            partProduct = part.substring(partBucati.length).trim();
        }
        
        // Verifică dacă este într-adevăr un produs cu dimensiuni
        const partDimMatch = partProduct.match(/^(\d+)x(\d*)x(\d+)$/);
        const partDimMatchDIV = !partDimMatch ? partProduct.match(/^(\d+)xx(\d+)$/) : null;
        
        if (partDimMatch) {
            const [, partL, partl, partG] = partDimMatch;
            
            // Verifică dacă locația nu este atașată la sfârșit
            if (!locationFound && !locatieExterna && i === productParts.length - 1) {
                const lastPartLocationMatch = partProduct.match(/([A-H])-(\d+)-(\d+)$/);
                if (lastPartLocationMatch) {
                    [, perete, coloana, rand] = lastPartLocationMatch;
                    locationFound = true;
                    console.log('Locație din depozit găsită la sfârșitul ultimei părți:', { perete, coloana, rand });
                    
                    // Nu adăugăm această parte ca dimensiune adițională
                    continue;
                }
            }
            
            // Adaugă la lista de dimensiuni adiționale
            additionalDims.push({
                id: Date.now() + i, // Generăm un ID unic
                L: partL,
                l: partl,
                G: partG,
                bucati: partBucati
            });
            
            console.log(`Dimensiune adițională ${i} detectată:`, { L: partL, l: partl, G: partG, bucati: partBucati });
        } else if (partDimMatchDIV) {
            const [, partL, partG] = partDimMatchDIV;
            
            // Pentru DIV nu adăugăm dimensiuni adiționale
            console.log(`Dimensiune adițională DIV ${i} detectată dar ignorată:`, { L: partL, G: partG });
        } else if (i === productParts.length - 1 && !locationFound && !locatieExterna) {
            // Ultima parte ar putea conține doar locația
            const lastPartLocationMatch = part.match(/([A-H])-(\d+)-(\d+)$/);
            if (lastPartLocationMatch) {
                [, perete, coloana, rand] = lastPartLocationMatch;
                locationFound = true;
                console.log('Locație din depozit găsită în ultima parte:', { perete, coloana, rand });
            }
            
            // Verifică și locația externă
            const lastPartExternalMatch = part.match(/EXT:(.+)$/);
            if (lastPartExternalMatch) {
                textLocatieExterna = lastPartExternalMatch[1].trim();
                locatieExterna = true;
                console.log('Locație externă găsită în ultima parte:', textLocatieExterna);
            }
        }
    }
    
    console.log('Dimensiuni adiționale detectate:', additionalDims);
    console.log('Locație finală detectată:', 
                locatieExterna ? { externa: textLocatieExterna } : 
                locationFound ? { perete, coloana, rand } : 'Nicio locație detectată');
    
    // Acum completăm formularul cu datele extrase
    // Setăm informațiile principale
    const speciaElement = document.getElementById('specia');
    const tipElement = document.getElementById('tip');
    const calitateElement = document.getElementById('calitate');
    const lungimeElement = document.getElementById('lungime');
    const latimeElement = document.getElementById('latime');
    const grosimeElement = document.getElementById('grosime');
    const bucatiElement = document.getElementById('bucati');
    
    if (speciaElement) speciaElement.value = specia;
    if (tipElement) {
        tipElement.value = tip;
        // Apelează updateNumeOptions pentru a actualiza formularul și a dezactiva/activa butonul 
        // pentru dimensiuni adiționale în funcție de tip
        if (typeof updateNumeOptions === 'function') {
            updateNumeOptions();
        }
    }
    if (calitateElement) calitateElement.value = calitate;
    if (lungimeElement) lungimeElement.value = lungime;
    if (latimeElement) latimeElement.value = latime;
    if (grosimeElement) grosimeElement.value = grosime;
    
    // Setăm volumul pentru DIV sau bucățile pentru celelalte tipuri
    if (tip === 'DIV') {
        // Pentru DIV, verificăm dacă avem o valoare de volum în QR
        // Volumul poate fi în bucatiPart sau într-o altă parte
        const volumDiv = document.getElementById('volum-div');
        if (volumDiv) {
            // Încercăm să extragem volumul (verificăm dacă bucatiPart conține un număr cu punct sau virgulă)
            let volumValue = bucatiPart;
            
            // Dacă nu avem volum în bucatiPart, căutăm în alte părți
            if (!volumValue || !/^[\d,.]+$/.test(volumValue)) {
                for (let i = 1; i < productParts.length; i++) {
                    const part = productParts[i].trim();
                    if (/^[\d,.]+$/.test(part)) {
                        volumValue = part;
                        break;
                    }
                }
            }
            
            // Formatăm volumul pentru afișare
            if (volumValue && /^[\d,.]+$/.test(volumValue)) {
                volumDiv.value = volumValue.replace('.', ',');
                console.log('Volum setat pentru DIV:', volumValue);
            } else {
                // Valoare implicită dacă nu găsim un volum valid
                volumDiv.value = '0,0000';
                console.log('Nu s-a găsit volum valid pentru DIV, se folosește valoarea implicită');
            }
        }
    } else if (bucatiElement && bucatiPart && !isNaN(bucatiPart)) {
        bucatiElement.value = bucatiPart;
    }
    
    // Actualizează opțiunile pentru nume
    setTimeout(() => {
        const numeSelect = document.getElementById('nume');
        if (numeSelect) {
            const numeOption = numeSelect.querySelector(`option[value="${nume}"]`);
            if (numeOption) {
                numeSelect.value = nume;
            } else if (nume) {
                // Adaugă opțiunea dacă nu există
                const newOption = document.createElement('option');
                newOption.value = nume;
                newOption.textContent = nume;
                numeSelect.appendChild(newOption);
                numeSelect.value = nume;
            }
        }
    }, 50);
    
    // Setăm dimensiunile adiționale doar dacă nu este DIV
    if (typeof additionalDimensions !== 'undefined' && tip !== 'DIV') {
        additionalDimensions = additionalDims;
        if (typeof renderDimensionsList === 'function') {
            renderDimensionsList();
        }
    }
    
    // Setează locația în formular
    if (locatieExterna) {
        console.log('Setăm locația externă în formular:', textLocatieExterna);
        
        setTimeout(() => {
            try {
                const locatieExternaCheckbox = document.getElementById('locatie-externa');
                const locatieExternaInput = document.getElementById('locatie-externa-input');
                
                if (locatieExternaCheckbox && locatieExternaInput) {
                    locatieExternaCheckbox.checked = true;
                    
                    // Declanșează evenimentul de schimbare pentru a activa/dezactiva câmpurile corespunzătoare
                    if (typeof toggleLocatieExterna === 'function') {
                        toggleLocatieExterna();
                    }
                    
                    // Setează valoarea locației externe
                    locatieExternaInput.value = textLocatieExterna;
                    
                    console.log('Locație externă setată cu succes');
                }
            } catch (err) {
                console.error('Eroare la setarea locației externe:', err);
            }
        }, 100);
    } else if (locationFound && perete && coloana && rand) {
        console.log('Setăm locația în depozit în formular:', { perete, coloana, rand });
        
        setTimeout(() => {
            try {
                const pereteSelect = document.getElementById('perete');
                const coloanaSelect = document.getElementById('coloana');
                const randSelect = document.getElementById('rand');
                
                if (pereteSelect) {
                    const pereteExists = Array.from(pereteSelect.options).some(opt => opt.value === perete);
                    if (pereteExists) {
                        pereteSelect.value = perete;
                    } else {
                        const newOption = document.createElement('option');
                        newOption.value = perete;
                        newOption.textContent = perete;
                        pereteSelect.appendChild(newOption);
                        pereteSelect.value = perete;
                    }
                }
                
                if (coloanaSelect) {
                    const coloanaExists = Array.from(coloanaSelect.options).some(opt => opt.value === coloana);
                    if (coloanaExists) {
                        coloanaSelect.value = coloana;
                    } else {
                        const newOption = document.createElement('option');
                        newOption.value = coloana;
                        newOption.textContent = coloana;
                        coloanaSelect.appendChild(newOption);
                        coloanaSelect.value = coloana;
                    }
                }
                
                if (randSelect) {
                    const randExists = Array.from(randSelect.options).some(opt => opt.value === rand);
                    if (randExists) {
                        randSelect.value = rand;
                    } else {
                        const newOption = document.createElement('option');
                        newOption.value = rand;
                        newOption.textContent = rand;
                        randSelect.appendChild(newOption);
                        randSelect.value = rand;
                    }
                }
                
                console.log('Locație din depozit setată cu succes din format vechi');
            } catch (err) {
                console.error('Eroare la setarea locației:', err);
            }
        }, 100);
    }
    
    // Generăm previzualizarea după un mic delay pentru a permite actualizarea UI-ului
    setTimeout(() => {
        if (typeof generatePreview === 'function') {
            generatePreview();
        }
    }, 300);
}

// Expune funcția la nivel global
window.populateFormFromQR = populateFormFromQR;