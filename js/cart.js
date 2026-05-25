const CART_STORAGE_KEY = 'joyeria_arroyo_cart';

let cart = loadCartFromStorage();

function loadCartFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function persistCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function formatMoney(amount) {
  return new Intl.NumberFormat(JOYERIA_CONFIG.currency.locale, {
    style: 'currency',
    currency: JOYERIA_CONFIG.currency.code,
  }).format(amount);
}

function calcLineTotals(unitPrice, quantity) {
  const subtotal = unitPrice * quantity;
  const iva = subtotal * JOYERIA_CONFIG.ivaRate;
  const precioFinal = subtotal + iva;
  return { subtotal, iva, precioFinal };
}

function getCartTotals() {
  return cart.reduce(
    (acc, item) => {
      const { subtotal, iva, precioFinal } = calcLineTotals(item.precio, item.cantidad);
      acc.subtotal += subtotal;
      acc.iva += iva;
      acc.total += precioFinal;
      acc.items += item.cantidad;
      return acc;
    },
    { subtotal: 0, iva: 0, total: 0, items: 0 }
  );
}

function addToCart(productId, quantity = 1) {
  const product = getProductById(productId);
  if (!product) return { ok: false, message: 'Producto no encontrado' };

  const qty = Math.max(1, Math.min(quantity, product.stock ?? 1));
  const existing = cart.find((i) => i.id === productId);

  if (existing) {
    const newQty = existing.cantidad + qty;
    if (newQty > product.stock) {
      return { ok: false, message: `Solo hay ${product.stock} en stock` };
    }
    existing.cantidad = newQty;
  } else {
    cart.push({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      cantidad: qty,
      stock: product.stock,
    });
  }

  persistCart();
  return { ok: true };
}

function updateCartQuantity(productId, quantity) {
  const item = cart.find((i) => i.id === productId);
  const product = getProductById(productId);
  if (!item || !product) return;

  const qty = Math.max(1, Math.min(quantity, product.stock ?? 1));
  item.cantidad = qty;
  persistCart();
}

function removeFromCart(productId) {
  cart = cart.filter((i) => i.id !== productId);
  persistCart();
}

function clearCart() {
  cart = [];
  persistCart();
}

function buildOrderRows(customerName) {
  return cart.map((item) => {
    const { iva, precioFinal } = calcLineTotals(item.precio, item.cantidad);
    return {
      nombre: customerName,
      articulo: item.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.precio,
      iva: Math.round(iva * 100) / 100,
      precioFinal: Math.round(precioFinal * 100) / 100,
    };
  });
}

function buildWhatsAppOrderMessage(customerName) {
  const totals = getCartTotals();
  let text = `*Pedido — Joyería Arroyo*\n`;
  text += `Cliente: ${customerName}\n\n`;

  cart.forEach((item) => {
    const { precioFinal } = calcLineTotals(item.precio, item.cantidad);
    text += `• ${item.nombre}\n`;
    text += `  Cant: ${item.cantidad} × ${formatMoney(item.precio)}\n`;
    text += `  Total c/IVA: ${formatMoney(precioFinal)}\n\n`;
  });

  text += `*Subtotal:* ${formatMoney(totals.subtotal)}\n`;
  text += `*IVA (16%):* ${formatMoney(totals.iva)}\n`;
  text += `*Total:* ${formatMoney(totals.total)}\n`;
  text += `\nConfirmo mi pedido. Gracias.`;

  return text;
}

function getWhatsAppUrl(message) {
  const phone = JOYERIA_CONFIG.whatsapp.phoneE164;
  const encoded = encodeURIComponent(message || JOYERIA_CONFIG.whatsapp.defaultMessage);
  return `https://wa.me/${phone}?text=${encoded}`;
}

function openWhatsApp(message) {
  window.open(getWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  const count = cart.reduce((n, i) => n + i.cantidad, 0);
  badge.textContent = count;
  badge.hidden = count === 0;
}
