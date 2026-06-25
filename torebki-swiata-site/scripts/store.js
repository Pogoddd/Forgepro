const PRODUCTS = [
  {
    id: "ts-001",
    name: "Aurelia Shopper",
    category: "codzienne",
    price: 229,
    color: "beż piaskowy",
    material: "skóra ekologiczna",
    size: "duża",
    short: "Pojemna torba na co dzień, do pracy i na zakupy.",
    tags: ["A4", "na ramię", "codzienna"]
  },
  {
    id: "ts-002",
    name: "Mila Listonoszka",
    category: "codzienne",
    price: 169,
    color: "czarna",
    material: "skóra ekologiczna",
    size: "średnia",
    short: "Lekka listonoszka z wygodnym paskiem i zamkiem.",
    tags: ["lekka", "zamek", "miejska"]
  },
  {
    id: "ts-003",
    name: "Sofia Klasyczna",
    category: "eleganckie",
    price: 259,
    color: "camel",
    material: "skóra ekologiczna premium",
    size: "średnia",
    short: "Usztywniony fason do pracy, spotkań i eleganckich stylizacji.",
    tags: ["usztywniona", "złote okucia", "elegancka"]
  },
  {
    id: "ts-004",
    name: "Luna Kopertówka",
    category: "eleganckie",
    price: 139,
    color: "champagne",
    material: "satynowe wykończenie",
    size: "mała",
    short: "Wieczorowy model na wesele, uroczystość lub prezent.",
    tags: ["wieczorowa", "łańcuszek", "okazja"]
  },
  {
    id: "ts-005",
    name: "Bianca Skórzana",
    category: "skorzane",
    price: 349,
    color: "ciemny brąz",
    material: "skóra naturalna",
    size: "średnia",
    short: "Ponadczasowy model ze skóry naturalnej na wiele sezonów.",
    tags: ["skóra naturalna", "trwała", "klasyczna"]
  },
  {
    id: "ts-006",
    name: "Nora Plecak",
    category: "miejskie",
    price: 199,
    color: "taupe",
    material: "miękka eko skóra",
    size: "średnia",
    short: "Plecak miejski dla osób, które lubią wygodę i wolne ręce.",
    tags: ["plecak", "miasto", "wygoda"]
  },
  {
    id: "ts-007",
    name: "Elena Mini",
    category: "eleganckie",
    price: 189,
    color: "kość słoniowa",
    material: "gładkie wykończenie",
    size: "mała",
    short: "Niewielka torebka na rodzinne spotkania i eleganckie wyjścia.",
    tags: ["mała", "subtelna", "na prezent"]
  },
  {
    id: "ts-008",
    name: "Riva Daily",
    category: "codzienne",
    price: 209,
    color: "granat",
    material: "skóra ekologiczna",
    size: "duża",
    short: "Prosta, nowoczesna torba dla klientek ceniących porządek.",
    tags: ["granat", "duża", "do pracy"]
  }
];

const CART_KEY = "torebki-swiata-cart";
const LAST_ORDER_KEY = "torebki-swiata-last-order";

function formatPrice(value) {
  return `${value.toFixed(2).replace(".", ",")} zł`;
}

function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function getProduct(id) {
  return PRODUCTS.find((product) => product.id === id);
}

function cartDetails() {
  return getCart()
    .map((entry) => {
      const product = getProduct(entry.id);
      return product ? { ...product, qty: entry.qty } : null;
    })
    .filter(Boolean);
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function cartTotal() {
  return cartDetails().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateCartCount() {
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = String(cartCount());
  });
}

function addToCart(productId) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: productId, qty: 1 });
  }
  saveCart(cart);
}

function changeQty(productId, delta) {
  const cart = getCart()
    .map((item) => item.id === productId ? { ...item, qty: item.qty + delta } : item)
    .filter((item) => item.qty > 0);
  saveCart(cart);
  renderCartPage();
  renderCheckoutSummary();
}

function removeFromCart(productId) {
  saveCart(getCart().filter((item) => item.id !== productId));
  renderCartPage();
  renderCheckoutSummary();
}

function productCardMarkup(product) {
  return `
    <article class="product-card" data-card data-category="${product.category}" data-search="${[
      product.name,
      product.category,
      product.color,
      product.material,
      product.tags.join(" ")
    ].join(" ").toLowerCase()}">
      <div class="product-media">
        <div class="bag-shape" aria-hidden="true"></div>
      </div>
      <div class="product-body">
        <div class="product-top">
          <div>
            <h3 class="product-name">${product.name}</h3>
            <div class="helper-note">${product.color} · ${product.size}</div>
          </div>
          <span class="price">${formatPrice(product.price)}</span>
        </div>
        <p>${product.short}</p>
        <div class="product-meta">
          ${product.tags.map((tag) => `<span class="chip">${tag}</span>`).join("")}
        </div>
        <div class="action-row">
          <button class="button" type="button" data-add-to-cart="${product.id}">Dodaj do koszyka</button>
        </div>
      </div>
    </article>
  `;
}

function renderFeaturedProducts() {
  const featuredGrid = document.querySelector("[data-featured-grid]");
  if (!featuredGrid) return;
  featuredGrid.innerHTML = PRODUCTS.slice(0, 3).map(productCardMarkup).join("");
  bindAddToCart();
}

function renderProductsPage() {
  const grid = document.querySelector("[data-products-grid]");
  if (!grid) return;
  grid.innerHTML = PRODUCTS.map(productCardMarkup).join("");
  bindAddToCart();
  bindFilters();
}

function bindAddToCart() {
  document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    button.onclick = () => {
      addToCart(button.dataset.addToCart);
      const label = button.textContent;
      button.textContent = "Dodano";
      setTimeout(() => {
        button.textContent = label;
      }, 1000);
    };
  });
}

function bindFilters() {
  const search = document.querySelector("[data-search]");
  const chips = Array.from(document.querySelectorAll("[data-filter]"));
  const cards = Array.from(document.querySelectorAll("[data-card]"));

  if (!cards.length) return;

  function apply() {
    const active = chips.find((chip) => chip.classList.contains("is-active"))?.dataset.filter || "all";
    const query = (search?.value || "").trim().toLowerCase();

    cards.forEach((card) => {
      const categoryMatch = active === "all" || card.dataset.category === active;
      const searchMatch = !query || (card.dataset.search || "").includes(query);
      card.classList.toggle("hidden", !(categoryMatch && searchMatch));
    });
  }

  chips.forEach((chip) => {
    chip.onclick = () => {
      chips.forEach((item) => item.classList.remove("is-active"));
      chip.classList.add("is-active");
      apply();
    };
  });

  if (search) {
    search.oninput = apply;
  }
}

function renderCartPage() {
  const wrap = document.querySelector("[data-cart-items]");
  const totalNode = document.querySelector("[data-cart-total]");
  const subtitle = document.querySelector("[data-cart-subtitle]");
  if (!wrap) return;

  const items = cartDetails();
  updateCartCount();

  if (!items.length) {
    wrap.innerHTML = `
      <div class="empty-state">
        <h3>Koszyk jest pusty</h3>
        <p>Dodaj wybrane modele z kolekcji, aby przygotować zamówienie.</p>
        <a class="button-secondary" href="kolekcja.html">Przejdź do kolekcji</a>
      </div>
    `;
    if (totalNode) totalNode.textContent = formatPrice(0);
    if (subtitle) subtitle.textContent = "Dodaj pierwszy model, aby rozpocząć zamówienie.";
    return;
  }

  wrap.innerHTML = items.map((item) => `
    <div class="cart-item">
      <div class="cart-thumb"><div class="bag-shape" style="width:58px;height:44px;border-radius:14px 14px 16px 16px;"></div></div>
      <div>
        <strong>${item.name}</strong>
        <p>${item.color} · ${item.material}</p>
        <div class="qty-controls">
          <button class="qty-btn" type="button" data-qty="${item.id}" data-delta="-1">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" type="button" data-qty="${item.id}" data-delta="1">+</button>
        </div>
      </div>
      <div>
        <strong>${formatPrice(item.price * item.qty)}</strong>
        <div style="margin-top:10px;">
          <button class="button-ghost" type="button" data-remove="${item.id}">Usuń</button>
        </div>
      </div>
    </div>
  `).join("");

  if (totalNode) totalNode.textContent = formatPrice(cartTotal());
  if (subtitle) subtitle.textContent = `${cartCount()} produkt(y) gotowe do zamówienia.`;

  document.querySelectorAll("[data-qty]").forEach((button) => {
    button.onclick = () => changeQty(button.dataset.qty, Number(button.dataset.delta));
  });

  document.querySelectorAll("[data-remove]").forEach((button) => {
    button.onclick = () => removeFromCart(button.dataset.remove);
  });
}

function renderCheckoutSummary() {
  const wrap = document.querySelector("[data-summary-items]");
  const totalNode = document.querySelector("[data-summary-total]");
  const form = document.querySelector("[data-checkout-form]");
  if (!wrap || !totalNode) return;

  const items = cartDetails();
  if (!items.length) {
    wrap.innerHTML = `<div class="empty-state"><p>Twój koszyk jest pusty. Wybierz produkty z kolekcji.</p></div>`;
    totalNode.textContent = formatPrice(0);
    if (form) form.classList.add("hidden");
    return;
  }

  if (form) form.classList.remove("hidden");
  wrap.innerHTML = items.map((item) => `
    <div class="summary-row">
      <span>${item.name} x ${item.qty}</span>
      <strong>${formatPrice(item.price * item.qty)}</strong>
    </div>
  `).join("");
  totalNode.textContent = formatPrice(cartTotal());
}

function setupCheckoutForm() {
  const form = document.querySelector("[data-checkout-form]");
  const confirmation = document.querySelector("[data-confirmation]");
  if (!form || !confirmation) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const items = cartDetails();
    if (!items.length) return;

    const formData = new FormData(form);
    const orderNumber = `TS-${Date.now().toString().slice(-6)}`;
    const order = {
      number: orderNumber,
      customer: Object.fromEntries(formData.entries()),
      items,
      total: cartTotal()
    };

    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
    confirmation.innerHTML = `
      <h3>Zamówienie przygotowane</h3>
      <p>Numer zamówienia: <strong>${order.number}</strong></p>
      <p>Dziękujemy. Na tym etapie sklep działa bez płatności online, więc dalsze potwierdzenie odbywa się telefonicznie. Klient może teraz zadzwonić i podać numer zamówienia.</p>
      <div class="summary-items">
        ${items.map((item) => `<div class="summary-row"><span>${item.name} x ${item.qty}</span><strong>${formatPrice(item.price * item.qty)}</strong></div>`).join("")}
        <div class="summary-row"><span>Razem</span><strong>${formatPrice(order.total)}</strong></div>
      </div>
    `;
    confirmation.classList.remove("hidden");
    saveCart([]);
    form.reset();
    renderCheckoutSummary();
  });
}

updateCartCount();
renderFeaturedProducts();
renderProductsPage();
renderCartPage();
renderCheckoutSummary();
setupCheckoutForm();
