/**
 * Integración Google Sheets (preparada — activar con JOYERIA_CONFIG.sheets)
 *
 * Hoja "Pedidos": nombre | articulo | cantidad | precio unitario | iva | precio final
 * Hoja "Inventario": id | nombre | descripcion | categoria | precio | stock | imagen | activo
 *
 * Requiere un Google Apps Script desplegado como Web App que reciba POST/GET.
 */

async function fetchInventoryFromSheets() {
  if (!JOYERIA_CONFIG.sheets.enabled || !JOYERIA_CONFIG.sheets.webAppUrl) {
    return null;
  }

  try {
    const url = new URL(JOYERIA_CONFIG.sheets.webAppUrl);
    url.searchParams.set('action', 'inventario');
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Error al cargar inventario');
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeInventoryRow) : null;
  } catch (err) {
    console.warn('[Sheets] Inventario no disponible:', err.message);
    return null;
  }
}

function normalizeInventoryRow(row) {
  return {
    id: String(row.id ?? row.ID ?? ''),
    nombre: row.nombre ?? row.Nombre ?? '',
    descripcion: row.descripcion ?? row.Descripcion ?? '',
    categoria: (row.categoria ?? row.Categoria ?? 'otros').toLowerCase(),
    precio: Number(row.precio ?? row.Precio ?? 0),
    stock: Number(row.stock ?? row.Stock ?? 0),
    imagen: row.imagen ?? row.Imagen ?? '',
    activo: row.activo !== false && row.activo !== 'FALSE' && row.activo !== 'false',
  };
}

/**
 * Envía filas de pedido a la hoja "Pedidos"
 * @param {Array<{nombre:string, articulo:string, cantidad:number, precioUnitario:number, iva:number, precioFinal:number}>} rows
 */
async function submitOrderToSheets(rows) {
  if (!JOYERIA_CONFIG.sheets.enabled || !JOYERIA_CONFIG.sheets.webAppUrl) {
    return { ok: false, offline: true, message: 'Sheets no configurado aún' };
  }

  try {
    // text/plain evita preflight CORS con Google Apps Script
    const res = await fetch(JOYERIA_CONFIG.sheets.webAppUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'pedido',
        sheet: JOYERIA_CONFIG.sheets.sheets.pedidos,
        rows,
      }),
    });

    if (!res.ok) throw new Error('Error al registrar pedido');
    const result = await res.json();
    return { ok: true, ...result };
  } catch (err) {
    console.error('[Sheets] Pedido:', err);
    return { ok: false, message: err.message };
  }
}

/** Pedidos pendientes en localStorage cuando Sheets está desconectado */
const PENDING_ORDERS_KEY = 'joyeria_arroyo_pending_orders';

function savePendingOrders(rows) {
  const existing = JSON.parse(localStorage.getItem(PENDING_ORDERS_KEY) || '[]');
  existing.push({ savedAt: new Date().toISOString(), rows });
  localStorage.setItem(PENDING_ORDERS_KEY, JSON.stringify(existing));
}

function getPendingOrders() {
  return JSON.parse(localStorage.getItem(PENDING_ORDERS_KEY) || '[]');
}

async function syncPendingOrders() {
  const pending = getPendingOrders();
  if (!pending.length || !JOYERIA_CONFIG.sheets.enabled) return;

  const remaining = [];
  for (const batch of pending) {
    const result = await submitOrderToSheets(batch.rows);
    if (!result.ok) remaining.push(batch);
  }
  localStorage.setItem(PENDING_ORDERS_KEY, JSON.stringify(remaining));
}
