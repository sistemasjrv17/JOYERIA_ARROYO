/**
 * Configuración global — Joyería Arroyo
 * Google Sheets: conectado vía Apps Script Web App
 */
const JOYERIA_CONFIG = {
  brand: {
    name: 'Joyería Arroyo',
    tagline: 'Elegancia que perdura',
  },
  whatsapp: {
    /** Número internacional sin espacios ni símbolos */
    phoneE164: '5218119023533',
    display: '+52 1 81 1902 3533',
    defaultMessage: 'Hola, me interesa conocer más sobre sus piezas de joyería.',
  },
  /** IVA México (16%) */
  ivaRate: 0.16,
  sheets: {
    enabled: true,
    spreadsheetId: '1aJFenBF-KxTq04bL75EbkNUOkMKXBZ1h_72vNSPpFQI',
    spreadsheetUrl:
      'https://docs.google.com/spreadsheets/d/1aJFenBF-KxTq04bL75EbkNUOkMKXBZ1h_72vNSPpFQI/edit',
    webAppUrl:
      'https://script.google.com/macros/s/AKfycbxZUQE3678YGcK9M8YrupmHBhMMtMQEtf0JtCT2IoGy1XY4VLwVZVJS3PiWGSnJ3S2i0g/exec',
    sheets: {
      pedidos: 'Pedidos',
      inventario: 'Inventario',
    },
    columns: {
      pedidos: ['nombre', 'articulo', 'cantidad', 'precio unitario', 'iva', 'precio final'],
      inventario: ['id', 'nombre', 'descripcion', 'categoria', 'precio', 'stock', 'imagen', 'activo'],
    },
  },
  currency: {
    locale: 'es-MX',
    code: 'MXN',
  },
};
