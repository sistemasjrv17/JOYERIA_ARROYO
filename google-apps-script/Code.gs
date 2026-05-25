/**
 * Google Apps Script — Joyería Arroyo
 *
 * 1. Crea un Google Sheet con dos hojas:
 *    - "Pedidos": nombre | articulo | cantidad | precio unitario | iva | precio final
 *    - "Inventario": id | nombre | descripcion | categoria | precio | stock | imagen | activo
 *
 * 2. Extensiones > Apps Script > pega este código
 * 3. Cambia SPREADSHEET_ID por el ID de tu hoja
 * 4. Implementar > Nueva implementación > Aplicación web
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier persona
 * 5. Copia la URL en js/config.js → sheets.webAppUrl y sheets.enabled = true
 */

const SPREADSHEET_ID = '1aJFenBF-KxTq04bL75EbkNUOkMKXBZ1h_72vNSPpFQI';

function doGet(e) {
  const action = (e.parameter.action || '').toLowerCase();

  if (action === 'inventario') {
    return jsonResponse(readInventory_());
  }

  return jsonResponse({ ok: true, message: 'Joyería Arroyo API' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = (body.action || '').toLowerCase();

    if (action === 'pedido') {
      const rows = body.rows || [];
      appendOrders_(rows);
      return jsonResponse({ ok: true, inserted: rows.length });
    }

    return jsonResponse({ ok: false, error: 'Acción no válida' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function readInventory_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Inventario');
  if (!sheet) throw new Error('Hoja Inventario no encontrada');

  const data = sheet.getDataRange().getValues();
  const headers = data.shift().map((h) => String(h).toLowerCase().trim());

  return data
    .filter((row) => row.some((cell) => cell !== ''))
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i];
      });
      return obj;
    });
}

function appendOrders_(rows) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Pedidos');
  if (!sheet) throw new Error('Hoja Pedidos no encontrada');

  rows.forEach((r) => {
    sheet.appendRow([
      r.nombre || '',
      r.articulo || '',
      r.cantidad || 0,
      r.precioUnitario || 0,
      r.iva || 0,
      r.precioFinal || 0,
    ]);
  });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
