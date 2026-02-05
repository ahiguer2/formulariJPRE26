/**
 * Apps Script per al full de Google Sheets.
 * 1) Crea un full amb dues pestanyes: "Tallers" i "Inscripcions".
 * 2) Omple "Tallers" amb les columnes:
 *    A: Franja | B: Taller | C: PlacesTotals
 * 3) Desa el full i copia la seva ID.
 * 4) Enganxa la ID a la constant SHEET_ID.
 * 5) Implementa com a Web App (Executa com: tu mateix | Accés: Qualsevol amb l’enllaç).
 */

const SHEET_ID = "10KUk3pRtlypRuOQeWustrGwow1reWi-pbjERv99nv5w";
const TALLERS_SHEET = "Tallers";
const INSCRIPCIONS_SHEET = "Inscripcions";

function doGet(e) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const tallersSheet = ss.getSheetByName(TALLERS_SHEET);
  const data = tallersSheet.getDataRange().getValues();

  data.shift();
  const rows = data.filter((row) => row[0] && row[1]);

  const tallers = rows.map((row) => ({
    franja: String(row[0]).trim(),
    nom: String(row[1]).trim(),
    placesTotals: Number(row[2]) || 0,
  }));

  const ocupacions = getOcupacions();

  const franges = {};
  tallers.forEach((taller) => {
    if (!franges[taller.franja]) {
      franges[taller.franja] = [];
    }
    const id = buildId(taller.franja, taller.nom);
    const ocupades = ocupacions[id] || 0;
    franges[taller.franja].push({
      id,
      nom: taller.nom,
      placesTotals: taller.placesTotals,
      placesDisponibles: Math.max(taller.placesTotals - ocupades, 0),
    });
  });

  const result = {
    franges: Object.keys(franges).map((key) => ({
      nom: key,
      tallers: franges[key],
    })),
  };

  const callback = e && e.parameter && e.parameter.callback;
  if (callback) {
    const jsonp = `${callback}(${JSON.stringify(result)})`;
    return ContentService.createTextOutput(jsonp).setMimeType(
      ContentService.MimeType.JAVASCRIPT
    );
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doPost(e) {
  const raw = (e && e.parameter && e.parameter.payload) || "{}";
  const payload = JSON.parse(raw);
  const email = String(payload.email || "").trim();

  if (!email.endsWith("@xtec.cat")) {
    return json({ ok: false, message: "El correu ha d’acabar en @xtec.cat." });
  }

  const seleccions = payload.seleccions || [];
  const frangesSet = new Set(seleccions.map((s) => s.franja));

  if (seleccions.length === 0 || frangesSet.size !== seleccions.length) {
    return json({ ok: false, message: "Selecciona un taller per franja." });
  }

  if (frangesSet.size > 2) {
    return json({ ok: false, message: "Màxim 2 franges." });
  }

  const ocupacions = getOcupacions();
  const tallersMap = getTallersMap();

  for (var i = 0; i < seleccions.length; i++) {
    var sel = seleccions[i];
    var id = sel.tallerId;
    var taller = tallersMap[id];
    if (!taller) {
      return json({ ok: false, message: "Taller no vàlid." });
    }
    if (taller.franja !== sel.franja) {
      return json({ ok: false, message: "Franja no vàlida." });
    }
    var ocupades = ocupacions[id] || 0;
    if (ocupades >= taller.placesTotals) {
      return json({ ok: false, message: "No queden places en algun taller." });
    }
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(INSCRIPCIONS_SHEET);

  const ids = seleccions.map((s) => s.tallerId).join(" | ");
  const etiquetes = seleccions
    .map((s) => `${s.franja}: ${s.tallerNom || s.tallerId}`)
    .join(" | ");

  sheet.appendRow([
    new Date(),
    payload.nom,
    payload.centre,
    payload.localitat,
    email,
    ids,
    etiquetes,
  ]);

  return json({ ok: true });
}

function getTallersMap() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const tallersSheet = ss.getSheetByName(TALLERS_SHEET);
  const data = tallersSheet.getDataRange().getValues();
  data.shift();

  const map = {};
  data.forEach((row) => {
    if (!row[0] || !row[1]) return;
    const franja = String(row[0]).trim();
    const nom = String(row[1]).trim();
    const id = buildId(franja, nom);
    map[id] = {
      franja,
      nom,
      placesTotals: Number(row[2]) || 0,
    };
  });

  return map;
}

function getOcupacions() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(INSCRIPCIONS_SHEET);
  if (!sheet) return {};

  const rows = sheet.getDataRange().getValues();
  rows.shift();

  const ocupacions = {};
  rows.forEach((row) => {
    const ids = String(row[5] || "").split("|");
    ids.forEach((id) => {
      const clean = id.trim();
      if (!clean) return;
      ocupacions[clean] = (ocupacions[clean] || 0) + 1;
    });
  });

  return ocupacions;
}

function buildId(franja, tallerNom) {
  return `${franja.toLowerCase().replace(/\s+/g, "-")}-${tallerNom
    .toLowerCase()
    .replace(/\s+/g, "-")}`;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
