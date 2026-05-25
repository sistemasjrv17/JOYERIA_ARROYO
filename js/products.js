/**
 * Catálogo local — replica la hoja "Inventario" de Google Sheets.
 * Al conectar Sheets, loadProducts() sustituirá este arreglo.
 */
const CATALOG_FALLBACK = [
  {
    id: 'AR-001',
    nombre: 'Anillo Solitario Oro 14k',
    descripcion: 'Diamante central 0.25 ct, montura en oro amarillo 14 quilates.',
    categoria: 'anillos',
    precio: 12800,
    stock: 3,
    imagen: '',
    activo: true,
  },
  {
    id: 'AR-002',
    nombre: 'Collar Perlas Cultivadas',
    descripcion: 'Cadena en oro laminado con perlas cultivadas de agua dulce.',
    categoria: 'collares',
    precio: 4650,
    stock: 8,
    imagen: '',
    activo: true,
  },
  {
    id: 'AR-003',
    nombre: 'Aretes Gota Esmeralda',
    descripcion: 'Piedras sintéticas esmeralda en engaste de plata .925.',
    categoria: 'aretes',
    precio: 2890,
    stock: 12,
    imagen: '',
    activo: true,
  },
  {
    id: 'AR-004',
    nombre: 'Pulsera Tennis Zirconias',
    descripcion: 'Pulsera rígida con zirconias cúbicas engastadas al bisel.',
    categoria: 'pulseras',
    precio: 3420,
    stock: 5,
    imagen: '',
    activo: true,
  },
  {
    id: 'AR-005',
    nombre: 'Dije Inicial Personalizado',
    descripcion: 'Placa en oro laminado con inicial grabada a láser.',
    categoria: 'dijes',
    precio: 1750,
    stock: 15,
    imagen: '',
    activo: true,
  },
  {
    id: 'AR-006',
    nombre: 'Reloj Pulsera Dama',
    descripcion: 'Correa acero inoxidable, cristal mineral, resistente al agua.',
    categoria: 'relojes',
    precio: 5890,
    stock: 2,
    imagen: '',
    activo: true,
  },
];

let productsCache = [...CATALOG_FALLBACK];

function getActiveProducts() {
  return productsCache.filter((p) => p.activo !== false && (p.stock ?? 0) > 0);
}

function getProductById(id) {
  return productsCache.find((p) => p.id === id) ?? null;
}

function updateLocalStock(productId, quantitySold) {
  const product = productsCache.find((p) => p.id === productId);
  if (product) {
    product.stock = Math.max(0, (product.stock ?? 0) - quantitySold);
  }
}

async function loadProducts() {
  if (typeof fetchInventoryFromSheets === 'function') {
    const remote = await fetchInventoryFromSheets();
    if (remote && remote.length > 0) {
      productsCache = remote;
      return productsCache;
    }
  }
  productsCache = [...CATALOG_FALLBACK];
  return productsCache;
}
