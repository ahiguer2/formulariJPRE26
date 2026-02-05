# Formulari d’inscripció (XVIII Jornada de Programació i Robòtica Educatives)

## 1) Estructura del full de Google Sheets
Crea un full amb dues pestanyes:

Tallers:
- A: Franja
- B: Taller
- C: PlacesTotals

Inscripcions:
- A: Timestamp
- B: Nom i cognoms
- C: Centre
- D: Localitat
- E: Correu
- F: TallerIds
- G: Tallers (franja + nom)

## 2) Apps Script
- Obre Extensions > Apps Script.
- Crea un script nou i enganxa el contingut de `apps-script.gs`.
- Posa la teva ID a `SHEET_ID`.
- Desa i publica com a Web App:
  - Executa com: tu mateix
  - Accés: Qualsevol amb l’enllaç
- Copia l’URL de la Web App.

## 3) Frontend
- Obre `app.js` i enganxa la URL a `WEB_APP_URL`.
- Afegeix el teu `logo.png` a la carpeta.

## 4) Notes
- La validació @xtec.cat es fa tant al frontend com al backend.
- El sistema permet màxim 2 franges i 1 taller per franja.


