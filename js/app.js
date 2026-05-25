const CATEGORY_LABELS = {
  anillos: 'Anillos',
  collares: 'Collares',
  aretes: 'Aretes',
  pulseras: 'Pulseras',
  dijes: 'Dijes',
  relojes: 'Relojes',
  otros: 'Otros',
};

let activeCategory = 'todos';

document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  if (JOYERIA_CONFIG.sheets.enabled) {
    await syncPendingOrders();
  }
  bindNavigation();
  bindCartPanel();
  bindCheckout();
  bindFilters();
  renderCatalog();
  renderCart();
  updateCartBadge();
  initRevealAnimations();
});

function bindNavigation() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav-links');
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
  });

  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => nav.classList.remove('is-open'));
  });

  document.getElementById('btn-open-cart')?.addEventListener('click', openCartPanel);
  document.getElementById('cart-overlay')?.addEventListener('click', closeCartPanel);
  document.getElementById('btn-close-cart')?.addEventListener('click', closeCartPanel);
}

function bindCartPanel() {
  document.getElementById('btn-clear-cart')?.addEventListener('click', () => {
    if (cart.length && confirm('¿Vaciar el carrito?')) {
      clearCart();
      renderCart();
    }
  });
}

function bindCheckout() {
  const form = document.getElementById('checkout-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('customer-name');
    const name = nameInput?.value.trim();
    if (!name) return;

    if (!cart.length) {
      showToast('Tu carrito está vacío', 'warn');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Procesando…';

    const rows = buildOrderRows(name);
    const sheetResult = await submitOrderToSheets(rows);

    if (!sheetResult.ok) {
      savePendingOrders(rows);
    }

    cart.forEach((item) => updateLocalStock(item.id, item.cantidad));

    const waMessage = buildWhatsAppOrderMessage(name);
    openWhatsApp(waMessage);

    clearCart();
    renderCart();
    renderCatalog();
    closeCartPanel();
    form.reset();

    if (sheetResult.ok) {
      showToast('Pedido registrado. Te abrimos WhatsApp para confirmar.', 'success');
    } else {
      showToast('Pedido guardado localmente. Conecta Google Sheets para sincronizar.', 'info');
    }

    btn.disabled = false;
    btn.textContent = 'Confirmar pedido por WhatsApp';
  });

  document.getElementById('btn-whatsapp-general')?.addEventListener('click', () => {
    openWhatsApp(JOYERIA_CONFIG.whatsapp.defaultMessage);
  });

  document.getElementById('fab-whatsapp')?.addEventListener('click', () => {
    const msg = cart.length
      ? buildWhatsAppOrderMessage('Cliente web')
      : JOYERIA_CONFIG.whatsapp.defaultMessage;
    openWhatsApp(msg);
  });
}

function bindFilters() {
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      renderCatalog();
    });
  });
}

function openCartPanel() {
  document.getElementById('cart-panel')?.classList.add('is-open');
  document.getElementById('cart-overlay')?.classList.add('is-visible');
  document.body.classList.add('no-scroll');
  renderCart();
}

function closeCartPanel() {
  document.getElementById('cart-panel')?.classList.remove('is-open');
  document.getElementById('cart-overlay')?.classList.remove('is-visible');
  document.body.classList.remove('no-scroll');
}

function renderCatalog() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  let items = getActiveProducts();
  if (activeCategory !== 'todos') {
    items = items.filter((p) => p.categoria === activeCategory);
  }

  if (!items.length) {
    grid.innerHTML = `<p class="empty-state">No hay piezas disponibles en esta categoría.</p>`;
    return;
  }

  grid.innerHTML = items.map(renderProductCard).join('');

  grid.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.add;
      const result = addToCart(id, 1);
      if (result.ok) {
        showToast('Añadido al carrito', 'success');
        renderCart();
      } else {
        showToast(result.message, 'warn');
      }
    });
  });
}

function renderProductCard(product) {
  const category = CATEGORY_LABELS[product.categoria] || product.categoria;
  const lowStock = product.stock <= 3;
  const visual = product.imagen
    ? `<img src="${product.imagen}" alt="${product.nombre}" loading="lazy" />`
    : `<div class="product-placeholder" aria-hidden="true"><span class="diamond-icon"></span></div>`;

  return `
    <article class="product-card reveal" data-id="${product.id}">
      <div class="product-media">${visual}</div>
      <div class="product-body">
        <span class="product-category">${category}</span>
        <h3 class="product-name">${product.nombre}</h3>
        <p class="product-desc">${product.descripcion}</p>
        <div class="product-footer">
          <div>
            <p class="product-price">${formatMoney(product.precio)}</p>
            <p class="product-stock ${lowStock ? 'low' : ''}">${product.stock} disponible${product.stock !== 1 ? 's' : ''}</p>
          </div>
          <button type="button" class="btn btn-gold" data-add="${product.id}">Añadir</button>
        </div>
      </div>
    </article>
  `;
}

function renderCart() {
  const list = document.getElementById('cart-items');
  const empty = document.getElementById('cart-empty');
  const summary = document.getElementById('cart-summary');
  const form = document.getElementById('checkout-form');

  if (!list) return;

  if (!cart.length) {
    list.innerHTML = '';
    empty?.removeAttribute('hidden');
    summary?.setAttribute('hidden', '');
    form?.setAttribute('hidden', '');
    return;
  }

  empty?.setAttribute('hidden', '');
  summary?.removeAttribute('hidden');
  form?.removeAttribute('hidden');

  list.innerHTML = cart
    .map((item) => {
      const { precioFinal } = calcLineTotals(item.precio, item.cantidad);
      return `
        <li class="cart-item">
          <div class="cart-item-info">
            <strong>${item.nombre}</strong>
            <span>${formatMoney(item.precio)} c/u</span>
          </div>
          <div class="cart-item-actions">
            <div class="qty-control">
              <button type="button" data-qty-minus="${item.id}" aria-label="Menos">−</button>
              <span>${item.cantidad}</span>
              <button type="button" data-qty-plus="${item.id}" aria-label="Más">+</button>
            </div>
            <span class="cart-line-total">${formatMoney(precioFinal)}</span>
            <button type="button" class="cart-remove" data-remove="${item.id}" aria-label="Eliminar">×</button>
          </div>
        </li>
      `;
    })
    .join('');

  const totals = getCartTotals();
  document.getElementById('cart-subtotal').textContent = formatMoney(totals.subtotal);
  document.getElementById('cart-iva').textContent = formatMoney(totals.iva);
  document.getElementById('cart-total').textContent = formatMoney(totals.total);

  list.querySelectorAll('[data-qty-minus]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.qtyMinus;
      const item = cart.find((i) => i.id === id);
      if (item) updateCartQuantity(id, item.cantidad - 1);
      renderCart();
    });
  });

  list.querySelectorAll('[data-qty-plus]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.qtyPlus;
      const item = cart.find((i) => i.id === id);
      if (!item) return;
      const product = getProductById(id);
      if (item.cantidad >= (product?.stock ?? 1)) {
        showToast('Stock máximo alcanzado', 'warn');
        return;
      }
      updateCartQuantity(id, item.cantidad + 1);
      renderCart();
    });
  });

  list.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.remove);
      renderCart();
    });
  });
}

function showToast(message, type = 'info') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

function initRevealAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  const observe = () => {
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  };

  observe();

  const grid = document.getElementById('products-grid');
  if (grid) {
    const mo = new MutationObserver(observe);
    mo.observe(grid, { childList: true });
  }
}
