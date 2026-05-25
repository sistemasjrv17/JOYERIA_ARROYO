# Conexión Google Sheets — Joyería Arroyo

## Estructura del documento

Crea un Google Sheet con **dos hojas**:

### Hoja `Pedidos` (encabezados fila 1)

| nombre | articulo | cantidad | precio unitario | iva | precio final |
|--------|----------|----------|-----------------|-----|--------------|

### Hoja `Inventario`

| id | nombre | descripcion | categoria | precio | stock | imagen | activo |
|----|--------|-------------|-----------|--------|-------|--------|--------|

- **categoria**: `anillos`, `collares`, `aretes`, `pulseras`, `dijes`, `relojes`
- **activo**: `TRUE` / `FALSE`
- **imagen**: URL pública de la foto (opcional)

## Tu hoja

- **ID:** `1aJFenBF-KxTq04bL75EbkNUOkMKXBZ1h_72vNSPpFQI`
- **Enlace:** https://docs.google.com/spreadsheets/d/1aJFenBF-KxTq04bL75EbkNUOkMKXBZ1h_72vNSPpFQI/edit

## Activar la conexión

1. Abre tu Sheet → **Extensiones** → **Apps Script**.
2. Copia el código de `google-apps-script/Code.gs` (el ID ya está configurado).
3. **Implementar** → **Nueva implementación** → **Aplicación web**
   - Ejecutar como: **Yo**
   - Acceso: **Cualquier persona**
4. En `js/config.js`:

```javascript
sheets: {
  enabled: true,
  webAppUrl: 'https://script.google.com/macros/s/XXXX/exec',
  // ...
}
```

5. Sube la web a un hosting con HTTPS (GitHub Pages, Netlify, etc.) para que `fetch` funcione sin bloqueos.

## Comportamiento sin Sheets

- El catálogo usa `js/products.js` (datos de ejemplo).
- Los pedidos se guardan en `localStorage` hasta activar Sheets (`joyeria_arroyo_pending_orders`).

## WhatsApp

Número configurado: **+52 1 81 1902 3533** (`5218119023533` en enlaces `wa.me`).
