const WHATSAPP_NUMBER = "5511999999999";
const PUBLIC_API_URL = "https://lumiere-api-swart.vercel.app";
const cart = new Map();
const favorites = new Map();
let selectedCategory = "todos";
let searchTerm = "";
const CART_STORAGE_KEY = "lumiere_cart";
const FAVORITES_STORAGE_KEY = "lumiere_favorites";

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    cart.clear();
    parsed.forEach((item) => {
      if (item?.name) cart.set(item.name, item);
    });
  } catch (_error) {
    // ignore storage errors
  }
}

function loadFavoritesFromStorage() {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    favorites.clear();
    parsed.forEach((item) => {
      if (item?.name) favorites.set(item.name, item);
    });
  } catch (_error) {
    // ignore storage errors
  }
}

function saveCartToStorage() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(Array.from(cart.values())));
  } catch (_error) {
    // ignore storage errors
  }
}

function saveFavoritesToStorage() {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favorites.values())));
  } catch (_error) {
    // ignore storage errors
  }
}

function upsertCartItem(name, price, quantity, image, category = "maquiagem") {
  const existing = cart.get(name);
  if (existing) {
    existing.quantity += quantity;
    existing.price = price;
    existing.image = image;
    existing.category = category;
  } else {
    cart.set(name, { name, price, quantity, image, category });
  }
  saveCartToStorage();
}

function upsertFavoriteItem(name, price, image, category) {
  favorites.set(name, { name, price, image, category });
  saveFavoritesToStorage();
}

function setupFilters() {
  const chips = Array.from(document.querySelectorAll(".chip"));
  if (!chips.length) return;

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      activateCategory(chip.dataset.category || "todos");
    });
  });
}

function setupSearch() {
  const input = document.getElementById("search-products");
  if (!input) return;

  input.addEventListener("input", () => {
    searchTerm = input.value.trim().toLowerCase();
    updateProductVisibility();
  });
}

function updateProductVisibility() {
  const cards = Array.from(document.querySelectorAll(".product-card"));
  cards.forEach((card) => {
    const category = card.dataset.category || "";
    const name = (card.dataset.product || "").toLowerCase();
    const categoryMatch = selectedCategory === "todos" || category === selectedCategory;
    const searchMatch = !searchTerm || name.includes(searchTerm);
    card.style.display = categoryMatch && searchMatch ? "flex" : "none";
  });
}

function activateCategory(category) {
  selectedCategory = category;
  const chips = Array.from(document.querySelectorAll(".chip"));
  chips.forEach((chip) => {
    const isActive = chip.dataset.category === category;
    chip.classList.toggle("active", isActive);
  });
  updateProductVisibility();
}

function setupLiveCategoryShortcuts() {
  const shortcuts = Array.from(document.querySelectorAll("[data-category-shortcut]"));
  if (!shortcuts.length) return;

  shortcuts.forEach((shortcut) => {
    shortcut.addEventListener("click", (event) => {
      event.preventDefault();
      const category = shortcut.getAttribute("data-category-shortcut") || "todos";
      activateCategory(category);
      document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function setupModernShowcaseCarousel() {
  const track = document.getElementById("modern-carousel");
  const prev = document.getElementById("modern-prev");
  const next = document.getElementById("modern-next");
  const progress = document.getElementById("modern-progress-bar");
  if (!track || !prev || !next || !progress) return;

  const updateProgress = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) {
      progress.style.width = "100%";
      return;
    }
    const ratio = track.scrollLeft / maxScroll;
    const width = 18 + ratio * 82;
    progress.style.width = `${width}%`;
  };

  prev.addEventListener("click", () => track.scrollBy({ left: -300, behavior: "smooth" }));
  next.addEventListener("click", () => track.scrollBy({ left: 300, behavior: "smooth" }));
  track.addEventListener("scroll", updateProgress);
  updateProgress();

  setInterval(() => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    const nextPosition = track.scrollLeft + 300;
    if (nextPosition >= maxScroll - 10) {
      track.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      track.scrollBy({ left: 300, behavior: "smooth" });
    }
  }, 4200);
}

function formatPriceLabel(value) {
  return `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
}

function normalizeCategorySlug(raw) {
  const value = String(raw || "")
    .trim()
    .toLowerCase();
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function detectCategoryByPage() {
  const page = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const map = {
    "pele.html": "pele",
    "olhos.html": "olhos",
    "labios.html": "labios",
    "skincare.html": "skincare",
    "kits.html": "kits",
  };
  return map[page] || "";
}

function buildProductCard(product) {
  const categorySlug = normalizeCategorySlug(product.category?.slug || product.category?.name || "maquiagem");
  const categoryLabel = product.category?.name || "Maquiagem";
  const image =
    product.images?.[0]?.url ||
    "https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=1200";
  const encodedName = encodeURIComponent(product.name);
  const encodedCategory = encodeURIComponent(categorySlug);
  const encodedImage = encodeURIComponent(image);
  const price = Number(product.price || 0);
  const detailHref = `produto.html?produto=${encodedName}&preco=${price}&categoria=${encodedCategory}&imagem=${encodedImage}`;

  return `
    <article class="product-card" data-category="${categorySlug}" data-product="${product.name}" data-price="${price}" data-image="${image}">
      <a class="product-link" href="${detailHref}">
        <img class="product-media" src="${image}" alt="${product.name}" />
      </a>
      <p class="product-category">${categoryLabel}</p>
      <h3><a class="product-link-text" href="${detailHref}">${product.name}</a></h3>
      <p class="product-price">${formatPriceLabel(price)}</p>
      <div class="quantity-box">
        <button class="qty-btn minus" type="button">-</button>
        <input class="qty-input" type="number" min="1" value="1" />
        <button class="qty-btn plus" type="button">+</button>
      </div>
      <button class="button button-buy add-to-cart" type="button">Comprar agora</button>
    </article>
  `;
}

function resolveProductImage(product) {
  return (
    product?.images?.[0]?.url ||
    "https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=1200"
  );
}

function buildHomeFeaturedItem(product) {
  const name = product?.name || "Produto";
  const price = Number(product?.price || 0);
  const categorySlug = normalizeCategorySlug(product?.category?.slug || product?.category?.name || "maquiagem");
  const image = resolveProductImage(product);
  return `
    <article class="featured-item" data-detail-card="true" data-product="${name}" data-price="${price}" data-category="${categorySlug}">
      <img src="${image}" alt="${name}" />
      <div>
        <h3>${name}</h3>
        <p class="featured-price">${formatPriceLabel(price)}</p>
        <button class="button button-buy featured-buy-btn" type="button">Comprar agora</button>
      </div>
    </article>
  `;
}

async function hydrateHomeFeaturedSections() {
  const launchTrack = document.getElementById("launch-carousel");
  const highlightsTrack = document.getElementById("highlights-carousel");
  if (!launchTrack && !highlightsTrack) return;

  try {
    const response = await fetch(`${PUBLIC_API_URL}/public/home`);
    if (!response.ok) return;
    const homeData = await response.json();

    const launches = Array.isArray(homeData?.lancamentos) ? homeData.lancamentos : [];
    const highlights = Array.isArray(homeData?.destaques) ? homeData.destaques : [];

    if (launchTrack && launches.length) {
      launchTrack.innerHTML = launches.map(buildHomeFeaturedItem).join("");
    }
    if (highlightsTrack && highlights.length) {
      highlightsTrack.innerHTML = highlights.map(buildHomeFeaturedItem).join("");
    }
  } catch (_error) {
    // fallback: keep static HTML content when API is unavailable
  }
}

function renderProductsSkeleton(grid, count = 6) {
  grid.innerHTML = Array.from({ length: count })
    .map(
      () => `
    <article class="product-card product-skeleton" aria-hidden="true">
      <div class="skeleton-img"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line mid"></div>
    </article>
  `,
    )
    .join("");
}

function renderProductsError(grid, onRetry) {
  grid.innerHTML = `
    <div class="products-error" style="grid-column:1/-1;text-align:center;padding:2.5rem 1rem;">
      <p style="font-size:1.1rem;color:#c0392b;margin-bottom:1rem;">
        ⚠️ Não foi possível carregar os produtos. Verifique sua conexão e tente novamente.
      </p>
      <button id="retry-load-products" style="background:#d4a7c9;color:#fff;border:none;padding:.7rem 2rem;border-radius:8px;font-size:1rem;cursor:pointer;">
        Tentar novamente
      </button>
    </div>
  `;
  document.getElementById("retry-load-products")?.addEventListener("click", onRetry);
}

async function hydrateProductsFromApi() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  renderProductsSkeleton(grid);

  const fixedCategory = detectCategoryByPage();
  const query = new URLSearchParams();
  if (fixedCategory) query.set("category", fixedCategory);
  const url = `${PUBLIC_API_URL}/public/products${query.toString() ? `?${query.toString()}` : ""}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const attempt = async () => {
    renderProductsSkeleton(grid);
    const abortCtrl = new AbortController();
    const t = setTimeout(() => abortCtrl.abort(), 15000);
    try {
      const response = await fetch(url, { signal: abortCtrl.signal });
      clearTimeout(t);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const products = await response.json();
      if (!Array.isArray(products) || !products.length) {
        grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:2rem;color:#888;">Nenhum produto encontrado.</p>`;
        return;
      }
      grid.innerHTML = products.map(buildProductCard).join("");
      setupQuantityControls();
      setupCartActions();
      setupProductCardNavigation();
      setupFilters();
      activateCategory(selectedCategory);
    } catch (_error) {
      clearTimeout(t);
      renderProductsError(grid, attempt);
    }
  };

  clearTimeout(timeout);
  await attempt();
}


function setupQuantityControls() {
  const productCards = Array.from(document.querySelectorAll(".product-card"));
  if (!productCards.length) return;

  productCards.forEach((card) => {
    const minus = card.querySelector(".minus");
    const plus = card.querySelector(".plus");
    const input = card.querySelector(".qty-input");
    if (!minus || !plus || !input) return;

    minus.addEventListener("click", (event) => {
      event.stopPropagation();
      const next = Math.max(1, Number(input.value) - 1);
      input.value = String(next);
    });

    plus.addEventListener("click", (event) => {
      event.stopPropagation();
      input.value = String(Number(input.value) + 1);
    });
  });
}

function setupProductCardNavigation() {
  const cards = Array.from(document.querySelectorAll(".product-card"));
  if (!cards.length) return;

  cards.forEach((card) => {
    const product = card.dataset.product;
    if (!product) return;
    const price = Number(card.dataset.price || 0);
    const category = card.dataset.category || "maquiagem";
    const image = card.dataset.image || "";
    const detailHref = `produto.html?produto=${encodeURIComponent(product)}&preco=${price}&categoria=${encodeURIComponent(category)}&imagem=${encodeURIComponent(image)}`;

    card.addEventListener("click", (event) => {
      const interactive = event.target.closest("a, button, input, textarea, select, label");
      if (interactive) return;
      window.location.href = detailHref;
    });
  });
}

function setupHomeFeaturedNavigation() {
  const cards = Array.from(document.querySelectorAll("[data-detail-card='true']"));
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener("click", (event) => {
      const interactive = event.target.closest("a, button, input, textarea, select, label");
      if (interactive) return;

      const name = card.dataset.product || "";
      const price = Number(card.dataset.price || 0);
      const category = card.dataset.category || "maquiagem";
      const image = card.querySelector("img")?.getAttribute("src") || "";
      if (!name) return;

      const href = `produto.html?produto=${encodeURIComponent(name)}&preco=${price}&categoria=${encodeURIComponent(category)}&imagem=${encodeURIComponent(image)}`;
      window.location.href = href;
    });
  });
}

function setupHomeFeaturedBuyButtons() {
  const buttons = Array.from(document.querySelectorAll(".featured-buy-btn"));
  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const card = button.closest("[data-detail-card='true']");
      if (!card) return;

      const name = card.dataset.product || "";
      const price = Number(card.dataset.price || 0);
      const category = card.dataset.category || "maquiagem";
      const image = card.querySelector("img")?.getAttribute("src") || "";
      if (!name) return;

      upsertCartItem(name, price, 1, image, category);
      renderCart();
      openCart();
    });
  });
}

function renderCart() {
  const cartItemsNode = document.getElementById("cart-items");
  const cartCountNode = document.getElementById("cart-count");
  const cartSubtotalNode = document.getElementById("cart-subtotal");
  const cartTotalNode = document.getElementById("cart-total");
  const checkoutNode = document.getElementById("checkout-whatsapp");
  if (!cartItemsNode || !cartCountNode || !cartSubtotalNode || !cartTotalNode || !checkoutNode) return;

  const items = Array.from(cart.values());
  if (!items.length) {
    cartItemsNode.innerHTML = "<p class='cart-empty'>Seu carrinho esta vazio.</p>";
    cartCountNode.textContent = "0";
    cartSubtotalNode.textContent = "R$ 0,00";
    cartTotalNode.textContent = "R$ 0,00";
    checkoutNode.href = "#";
    return;
  }

  const html = items
    .map(
      (item) => `
      <div class="cart-item">
        <a class="cart-item-link" href="produto.html?produto=${encodeURIComponent(item.name)}&preco=${item.price}&categoria=${encodeURIComponent(item.category || "maquiagem")}&imagem=${encodeURIComponent(item.image)}">
          <img src="${item.image}" alt="${item.name}">
        </a>
        <a class="cart-item-link cart-item-content" href="produto.html?produto=${encodeURIComponent(item.name)}&preco=${item.price}&categoria=${encodeURIComponent(item.category || "maquiagem")}&imagem=${encodeURIComponent(item.image)}">
          <p><strong>${item.name}</strong></p>
          <p class="cart-item-meta">Qtd: <span class="cart-qty-pill">${item.quantity}</span> • ${formatBRL(item.price)} cada</p>
          <p class="cart-item-total">Subtotal: ${formatBRL(item.price * item.quantity)}</p>
        </a>
        <button class="remove-item" data-remove="${item.name}" type="button" aria-label="Remover item">🗑</button>
      </div>
    `,
    )
    .join("");
  cartItemsNode.innerHTML = html;

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const totalValue = subtotal;

  cartCountNode.textContent = String(totalQuantity);
  cartSubtotalNode.textContent = formatBRL(subtotal);
  cartTotalNode.textContent = formatBRL(totalValue);

  const checkoutUrl = getWhatsAppCheckoutUrl(items);
  checkoutNode.href = checkoutUrl;

  Array.from(document.querySelectorAll(".remove-item")).forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.getAttribute("data-remove");
      if (!name) return;
      cart.delete(name);
      saveCartToStorage();
      renderCart();
    });
  });
}

function getWhatsAppCheckoutUrl(items) {
  if (!items.length) return "#";
  const totalValue = items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const lines = items.map((item) => `- ${item.name} | Qtd: ${item.quantity} | ${formatBRL(item.price)}`);
  const message =
    "Oi! Vim pelo site Lumiere Beauty e quero finalizar este pedido:%0A" +
    lines.join("%0A") +
    `%0A%0ATotal estimado: ${encodeURIComponent(formatBRL(totalValue))}`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}

function renderFavorites() {
  const listNode = document.getElementById("favorites-items");
  const countNode = document.getElementById("favorite-count");
  if (!listNode) return;

  const items = Array.from(favorites.values());
  if (countNode) countNode.textContent = String(items.length);

  if (!items.length) {
    listNode.innerHTML = "<p class='cart-empty'>Nenhum favorito ainda.</p>";
    return;
  }

  listNode.innerHTML = items
    .map(
      (item) => `
      <div class="favorite-item">
        <a class="favorite-item-link" href="produto.html?produto=${encodeURIComponent(item.name)}&preco=${item.price}&categoria=${encodeURIComponent(item.category || "maquiagem")}&imagem=${encodeURIComponent(item.image)}">
          <img src="${item.image}" alt="${item.name}" />
        </a>
        <div class="favorite-item-content">
          <a class="favorite-item-link" href="produto.html?produto=${encodeURIComponent(item.name)}&preco=${item.price}&categoria=${encodeURIComponent(item.category || "maquiagem")}&imagem=${encodeURIComponent(item.image)}">
          <h4>${item.name}</h4>
          <p>${formatBRL(item.price)}</p>
          </a>
          <div class="favorite-actions">
            <button class="mini-action js-buy-favorite" data-name="${item.name}" type="button">Comprar</button>
            <button class="mini-action js-remove-favorite" data-name="${item.name}" type="button">Remover</button>
          </div>
        </div>
      </div>
    `,
    )
    .join("");

  Array.from(document.querySelectorAll(".js-buy-favorite")).forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.getAttribute("data-name");
      if (!name) return;
      const item = favorites.get(name);
      if (!item) return;
      
      // Gera a URL do WhatsApp APENAS para este item dos favoritos
      const url = getWhatsAppCheckoutUrl([{ ...item, quantity: 1 }]);
      
      // Redireciona imediatamente
      window.open(url, "_blank");
    });
  });

  Array.from(document.querySelectorAll(".js-remove-favorite")).forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.getAttribute("data-name");
      if (!name) return;
      favorites.delete(name);
      saveFavoritesToStorage();
      renderFavorites();
    });
  });
}

function setupCartActions() {
  const addButtons = Array.from(document.querySelectorAll(".add-to-cart"));
  if (!addButtons.length) return;

  addButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const card = button.closest(".product-card");
      if (!card) return;
      const name = card.dataset.product;
      const price = Number(card.dataset.price);
      const image = card.dataset.image || "";
      const category = card.dataset.category || "maquiagem";
      const input = card.querySelector(".qty-input");
      const quantity = Math.max(1, Number(input?.value || 1));
      upsertCartItem(name, price, quantity, image, category);

      renderCart();
      openCart();
    });
  });
}

function openCart() {
  document.getElementById("cart-drawer")?.classList.add("open");
  document.getElementById("cart-overlay")?.classList.add("show");
}

function closeCart() {
  document.getElementById("cart-drawer")?.classList.remove("open");
  document.getElementById("cart-overlay")?.classList.remove("show");
}

function setupCartDrawer() {
  document.getElementById("open-cart")?.addEventListener("click", openCart);
  document.getElementById("close-cart")?.addEventListener("click", closeCart);
  document.getElementById("cart-overlay")?.addEventListener("click", closeCart);

  // Ao clicar em finalizar, limpa o carrinho e fecha o drawer
  document.getElementById("checkout-whatsapp")?.addEventListener("click", () => {
    setTimeout(() => {
      cart.clear();
      saveCartToStorage();
      renderCart();
      closeCart();
    }, 500); // pequeno delay para o navegador processar o link
  });
}

function openFavorites() {
  document.getElementById("favorites-drawer")?.classList.add("open");
  document.getElementById("favorites-overlay")?.classList.add("show");
}

function closeFavorites() {
  document.getElementById("favorites-drawer")?.classList.remove("open");
  document.getElementById("favorites-overlay")?.classList.remove("show");
}

function setupFavoritesDrawer() {
  document.getElementById("open-favorites")?.addEventListener("click", openFavorites);
  document.getElementById("close-favorites")?.addEventListener("click", closeFavorites);
  document.getElementById("favorites-overlay")?.addEventListener("click", closeFavorites);
}

function setupMobileMenu() {
  const btn = document.getElementById("open-menu");
  const nav = document.getElementById("mobile-nav");
  if (!btn || !nav) return;
  btn.addEventListener("click", () => nav.classList.toggle("open"));
}

function setupCampaignSlider() {
  const slides = Array.from(document.querySelectorAll(".campaign-slide"));
  const dots = Array.from(document.querySelectorAll(".dot"));
  if (!slides.length || !dots.length) return;

  let current = 0;
  const setSlide = (index) => {
    slides.forEach((s, i) => s.classList.toggle("active", i === index));
    dots.forEach((d, i) => d.classList.toggle("active", i === index));
    current = index;
  };

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const index = Number(dot.dataset.slide || 0);
      setSlide(index);
    });
  });

  setInterval(() => setSlide((current + 1) % slides.length), 4500);
}

function setupFeaturedCarousel() {
  const track = document.getElementById("featured-carousel");
  const prev = document.getElementById("featured-prev");
  const next = document.getElementById("featured-next");
  if (!track || !prev || !next) return;
  prev.addEventListener("click", () => track.scrollBy({ left: -260, behavior: "smooth" }));
  next.addEventListener("click", () => track.scrollBy({ left: 260, behavior: "smooth" }));
}

function setupStripCarousel(trackId, prevId, nextId, step = 260, interval = 3800) {
  const track = document.getElementById(trackId);
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  if (!track || !prev || !next) return;

  prev.addEventListener("click", () => track.scrollBy({ left: -step, behavior: "smooth" }));
  next.addEventListener("click", () => track.scrollBy({ left: step, behavior: "smooth" }));

  setInterval(() => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    const nextPosition = track.scrollLeft + step;
    if (nextPosition >= maxScroll - 10) {
      track.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      track.scrollBy({ left: step, behavior: "smooth" });
    }
  }, interval);
}

function setupHeroProductSlider() {
  const slides = Array.from(document.querySelectorAll(".hero-product-slide"));
  const dots = Array.from(document.querySelectorAll(".hero-dot"));
  const prev = document.getElementById("hero-prev");
  const next = document.getElementById("hero-next");
  const progressBar = document.getElementById("hero-progress-bar");
  if (!slides.length || !dots.length || !prev || !next || !progressBar) return;

  let current = 0;
  const updateIndicators = () => {
    dots.forEach((dot, i) => dot.classList.toggle("active", i === current));
    const maxMove = 100 * (1 - 1 / slides.length);
    const ratio = slides.length <= 1 ? 0 : current / (slides.length - 1);
    progressBar.style.transform = `translateX(${ratio * maxMove}%)`;
  };

  const setByIndex = (index) => {
    current = (index + slides.length) % slides.length;
    const prevIndex = (current - 1 + slides.length) % slides.length;
    const nextIndex = (current + 1) % slides.length;

    slides.forEach((slide, i) => {
      slide.classList.remove("is-active", "is-prev", "is-next");
      if (i === current) slide.classList.add("is-active");
      else if (i === prevIndex) slide.classList.add("is-prev");
      else if (i === nextIndex) slide.classList.add("is-next");
    });
    updateIndicators();
  };

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const index = Number(dot.dataset.heroDot || 0);
      setByIndex(index);
    });
  });

  prev.addEventListener("click", () => setByIndex(current - 1));
  next.addEventListener("click", () => setByIndex(current + 1));

  setByIndex(0);
  setInterval(() => setByIndex(current + 1), 3200);
}

function setupProductDetailsPage() {
  const nameNode = document.getElementById("detail-product-name");
  const priceNode = document.getElementById("detail-product-price");
  const mainImage = document.getElementById("detail-main-image");
  const thumb1 = document.getElementById("thumb-1");
  const thumb2 = document.getElementById("thumb-2");
  const thumb3 = document.getElementById("thumb-3");
  const qtyNode = document.getElementById("detail-qty");
  const minus = document.getElementById("detail-minus");
  const plus = document.getElementById("detail-plus");
  const addCart = document.getElementById("detail-add-cart");
  const favorite = document.getElementById("detail-favorite");
  const descriptionNode = document.getElementById("detail-general-description");
  const whatsapp = document.getElementById("detail-whatsapp");

  if (
    !nameNode ||
    !priceNode ||
    !mainImage ||
    !thumb1 ||
    !thumb2 ||
    !thumb3 ||
    !qtyNode ||
    !minus ||
    !plus ||
    !addCart ||
    !favorite ||
    !whatsapp
  ) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const product = params.get("produto") || "Base Velvet Glow";
  const price = Number(params.get("preco") || "69.9");
  const category = params.get("categoria") || "maquiagem";
  const image = params.get("imagem") || "https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=1200";

  const images = [image, image, image];
  nameNode.textContent = product;
  priceNode.textContent = formatBRL(price);
  if (descriptionNode) {
    descriptionNode.textContent = `${product} (${category}) com acabamento premium, excelente giro em loja e alta percepcao de valor para venda.`;
  }
  mainImage.src = images[0];
  thumb1.src = images[0];
  thumb2.src = images[1];
  thumb3.src = images[2];

  const thumbs = Array.from(document.querySelectorAll(".detail-thumb"));
  thumbs.forEach((button, index) => {
    button.addEventListener("click", () => {
      thumbs.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      mainImage.src = images[index];
    });
  });

  minus.addEventListener("click", () => {
    qtyNode.value = String(Math.max(1, Number(qtyNode.value) - 1));
    updateWhatsappLink();
  });
  plus.addEventListener("click", () => {
    qtyNode.value = String(Math.max(1, Number(qtyNode.value) + 1));
    updateWhatsappLink();
  });
  qtyNode.addEventListener("input", () => {
    qtyNode.value = String(Math.max(1, Number(qtyNode.value) || 1));
    updateWhatsappLink();
  });

  function updateWhatsappLink() {
    const qty = Math.max(1, Number(qtyNode.value) || 1);
    const total = formatBRL(price * qty);
    const message = encodeURIComponent(
      `Oi! Quero este produto:\nProduto: ${product}\nCategoria: ${category}\nQuantidade: ${qty}\nValor unitario: ${formatBRL(price)}\nTotal: ${total}`,
    );
    whatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  }

  addCart.addEventListener("click", () => {
    const qty = Math.max(1, Number(qtyNode.value) || 1);
    upsertCartItem(product, price, qty, image, category);
    renderCart();
    qtyNode.value = "1";
    updateWhatsappLink();
    addCart.textContent = "Adicionado ao carrinho";
    setTimeout(() => {
      addCart.textContent = "Comprar agora";
    }, 1200);
  });

  favorite.addEventListener("click", () => {
    upsertFavoriteItem(product, price, image, category);
    renderFavorites();
    favorite.textContent = "Favoritado";
    setTimeout(() => {
      favorite.textContent = "Adicionar aos favoritos";
    }, 1200);
  });

  updateWhatsappLink();
}

async function initPage() {
  await hydrateProductsFromApi();
  await hydrateHomeFeaturedSections();
  setupFilters();
  setupLiveCategoryShortcuts();
  setupSearch();
  setupQuantityControls();
  setupCartActions();
  setupProductCardNavigation();
  setupCartDrawer();
  setupFavoritesDrawer();
  setupMobileMenu();
  setupCampaignSlider();
  setupFeaturedCarousel();
  setupStripCarousel("launch-carousel", "launch-prev", "launch-next");
  setupStripCarousel("highlights-carousel", "highlights-prev", "highlights-next");
  setupHomeFeaturedNavigation();
  setupHomeFeaturedBuyButtons();
  setupHeroProductSlider();
  setupModernShowcaseCarousel();
  setupProductDetailsPage();
  loadCartFromStorage();
  loadFavoritesFromStorage();
  activateCategory("todos");
  renderCart();
  renderFavorites();
}

initPage();
