// ── Navbar scroll effect
const navbar   = document.getElementById('navbar');
const menuBtn  = document.getElementById('mobile-menu');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

menuBtn.addEventListener('click', () => {
  menuBtn.classList.toggle('active');
  navLinks.classList.toggle('active');
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    menuBtn.classList.remove('active');
    navLinks.classList.remove('active');
  });
});

// ── Scroll reveal
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Parallax hero image
const heroImg = document.querySelector('.parallax');
if (heroImg) {
  window.addEventListener('scroll', () => {
    heroImg.style.transform = `translateY(${window.scrollY * +heroImg.dataset.speed}px)`;
  }, { passive: true });
}

// ═══════════════════════════════════════════════
//   CART SYSTEM
// ═══════════════════════════════════════════════

// Cart state — persisted in localStorage
let cart = JSON.parse(localStorage.getItem('neonSurgeCart')) || [];

// DOM refs
const cartToggleBtn = document.getElementById('cartToggle');
const cartBadge     = document.getElementById('cartBadge');
const cartOverlay   = document.getElementById('cartOverlay');
const cartDrawer    = document.getElementById('cartDrawer');
const cartCloseBtn  = document.getElementById('cartClose');
const cartBody      = document.getElementById('cartBody');
const cartEmpty     = document.getElementById('cartEmpty');
const cartItemsList = document.getElementById('cartItems');
const cartFooter    = document.getElementById('cartFooter');
const cartTotalEl   = document.getElementById('cartTotal');
const checkoutBtn   = document.getElementById('checkoutBtn');
const clearCartBtn  = document.getElementById('clearCartBtn');
const cartShopLink  = document.getElementById('cartShopLink');
const toast         = document.getElementById('toast');

// ── Save cart to localStorage
function saveCart() {
  localStorage.setItem('neonSurgeCart', JSON.stringify(cart));
}

// ── Update the badge count in navbar
function updateBadge() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  cartBadge.textContent = totalQty;
  if (totalQty === 0) {
    cartBadge.classList.add('hidden');
  } else {
    cartBadge.classList.remove('hidden');
    // pop animation
    cartBadge.classList.remove('pop');
    void cartBadge.offsetWidth; // reflow to retrigger
    cartBadge.classList.add('pop');
  }
}

// ── Render the cart drawer contents
function renderCart() {
  if (cart.length === 0) {
    cartEmpty.style.display = 'flex';
    cartItemsList.style.display = 'none';
    cartFooter.style.display = 'none';
  } else {
    cartEmpty.style.display = 'none';
    cartItemsList.style.display = 'flex';
    cartFooter.style.display = 'flex';

    cartItemsList.innerHTML = cart.map((item, index) => `
      <li class="cart-item" data-index="${index}">
        <div class="cart-item-top">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
        </div>
        <div class="cart-item-bottom">
          <div class="cart-qty-controls">
            <button class="cart-qty-btn" data-action="dec" data-index="${index}" aria-label="Decrease quantity">−</button>
            <span class="cart-qty-value">${item.qty}</span>
            <button class="cart-qty-btn" data-action="inc" data-index="${index}" aria-label="Increase quantity">+</button>
          </div>
          <button class="cart-item-remove" data-index="${index}">Remove</button>
        </div>
      </li>
    `).join('');

    // Update total
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    cartTotalEl.textContent = `$${total.toFixed(2)}`;
  }
  updateBadge();
}

// ── Add item to cart
function addToCart(id, name, price) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price: parseFloat(price), qty: 1 });
  }
  saveCart();
  renderCart();
  showToast(`${name} added to cart!`);
}

// ── Show toast notification
function showToast(message) {
  toast.textContent = message + ' 🛒';
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Open / Close cart drawer
function openCartDrawer() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  renderCart();
}

function closeCartDrawer() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ── Event: Toggle cart drawer
cartToggleBtn.addEventListener('click', () => {
  cartDrawer.classList.contains('open') ? closeCartDrawer() : openCartDrawer();
});
cartCloseBtn.addEventListener('click', closeCartDrawer);
cartOverlay.addEventListener('click', closeCartDrawer);

// Close cart on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && cartDrawer.classList.contains('open')) closeCartDrawer();
});

// ── Event: "Browse Products" link inside empty cart
cartShopLink.addEventListener('click', () => {
  closeCartDrawer();
});

// ── Event: Add to Cart buttons in shop section
document.querySelectorAll('.buy-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    const card = btn.closest('.pricing-card');
    const id   = card.dataset.productId;
    const name = card.dataset.productName;
    const price = card.dataset.productPrice;
    addToCart(id, name, price);

    // Button feedback animation
    const origText = btn.textContent;
    btn.textContent = '✓ Added!';
    btn.style.pointerEvents = 'none';
    setTimeout(() => {
      btn.textContent = origText;
      btn.style.pointerEvents = '';
    }, 1200);
  });
});

// ── Event: Quantity controls & Remove inside cart drawer
cartItemsList.addEventListener('click', e => {
  const btn = e.target;

  if (btn.dataset.action === 'inc') {
    const idx = parseInt(btn.dataset.index);
    cart[idx].qty += 1;
    saveCart();
    renderCart();
  }

  if (btn.dataset.action === 'dec') {
    const idx = parseInt(btn.dataset.index);
    cart[idx].qty -= 1;
    if (cart[idx].qty <= 0) {
      cart.splice(idx, 1);
    }
    saveCart();
    renderCart();
  }

  if (btn.classList.contains('cart-item-remove')) {
    const idx = parseInt(btn.dataset.index);
    cart.splice(idx, 1);
    saveCart();
    renderCart();
  }
});

// ── Event: Clear Cart
clearCartBtn.addEventListener('click', () => {
  cart = [];
  saveCart();
  renderCart();
});

// ── Event: Checkout
checkoutBtn.addEventListener('click', () => {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  closeCartDrawer();
  showToast(`Checkout: ${itemCount} item(s) — $${total.toFixed(2)}`);
  // In a real app you'd redirect to a payment page here
});

// ── Initialize cart badge on page load
renderCart();


// ═══════════════════════════════════════════════
//   CONTACT FORM
// ═══════════════════════════════════════════════
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const orig = btn.innerText;
    btn.innerText = 'Sending...';
    setTimeout(() => {
      btn.innerText = 'Message Sent! ⚡';
      btn.style.background = 'var(--color-neon-green)';
      btn.style.color = '#000';
      contactForm.reset();
      setTimeout(() => {
        btn.innerText = orig;
        btn.style.background = '';
        btn.style.color = '';
      }, 4000);
    }, 1500);
  });
}

// ═══════════════════════════════════════════════
//   CHATBASE FLOATING WIDGET
// ═══════════════════════════════════════════════
const chatFab   = document.getElementById('chatFab');
const chatPanel = document.getElementById('chatPanel');
const chatClose = document.getElementById('chatClose');
const iframe    = document.getElementById('chatbaseIframe');
let iframeLoaded = false;

function openChat() {
  if (!iframeLoaded) {
    iframe.src = iframe.dataset.src;
    iframeLoaded = true;
  }
  chatPanel.classList.add('open');
  chatPanel.setAttribute('aria-hidden', 'false');
  chatFab.setAttribute('aria-label', 'Close Support Chat');
}

function closeChat() {
  chatPanel.classList.remove('open');
  chatPanel.setAttribute('aria-hidden', 'true');
  chatFab.setAttribute('aria-label', 'Open Support Chat');
}

chatFab.addEventListener('click', () => {
  chatPanel.classList.contains('open') ? closeChat() : openChat();
});

chatClose.addEventListener('click', closeChat);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && chatPanel.classList.contains('open')) closeChat();
});
