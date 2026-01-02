// cart.js — simple cart stored in localStorage and helper to add items by id
const CART_KEY = 'cart_items_v1';
const CART_CHANNEL = 'cart_channel';
const API_BASE = 'https://json-backend-29ka.onrender.com';

function getCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

function setCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    notifyCartChanged();
    try { updateCartCount(); } catch (e) {}
}

function getCartCount() {
    const cart = getCart();
    return cart.reduce((s, it) => s + (Number(it.qty || 0)), 0);
}

function updateCartCount() {
    const count = getCartCount();
    try {
        const el = document.getElementById('cart-count');
        if (el) el.textContent = count;
        // also update any elements with class 'cart-count' if present
        document.querySelectorAll('.cart-count').forEach(node => node.textContent = count);
    } catch (e) { /* ignore */ }
}

function notifyCartChanged() {
    try {
        if (window.BroadcastChannel) {
            const bc = new BroadcastChannel(CART_CHANNEL);
            bc.postMessage({ type: 'updated', time: Date.now() });
            bc.close();
        } else {
            localStorage.setItem('cart_updated', Date.now());
        }
    } catch (e) { console.warn('notifyCartChanged', e); }
}

async function addToCartById(id, qty = 1) {
    try {
        const res = await fetch(`${API_BASE}/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const product = await res.json();
        addItem({ id: product.id, name: product.name, price: product.price, image: product.image }, qty);
        return true;
    } catch (e) {
        console.error('addToCartById', e);
        return false;
    }
}

function addItem(item, qty = 1) {
    const cart = getCart();
    const existing = cart.find(i => String(i.id) === String(item.id));
    if (existing) {
        existing.qty = (existing.qty || 0) + qty;
    } else {
        cart.push({ ...item, qty });
    }
    setCart(cart);
}

function updateQuantity(id, qty) {
    const cart = getCart();
    const idx = cart.findIndex(i => String(i.id) === String(id));
    if (idx === -1) return;
    if (qty <= 0) cart.splice(idx, 1);
    else cart[idx].qty = qty;
    setCart(cart);
}

function removeItem(id) {
    const cart = getCart().filter(i => String(i.id) !== String(id));
    setCart(cart);
}

function clearCart() {
    setCart([]);
}

// expose API
window.Cart = {
    getCart,
    setCart,
    addItem,
    addToCartById,
    updateQuantity,
    removeItem,
    clearCart,
};

// global addToCart used by buttons
window.addToCart = async function (id) {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) {
        alert('Please login to purchase items!');
        window.location.href = 'login.html';
        return;
    }
    const ok = await addToCartById(id, 1);
    if (ok) alert('Added to cart');
    else alert('Failed to add to cart');
};

// update count on load and when storage/BroadcastChannel notifies
document.addEventListener('DOMContentLoaded', updateCartCount);
try {
    if (window.BroadcastChannel) {
        const bc = new BroadcastChannel(CART_CHANNEL);
        bc.onmessage = (msg) => { updateCartCount(); };
    }
} catch (e) { /* ignore */ }

window.addEventListener('storage', (e) => { if (e.key === 'cart_updated') updateCartCount(); });
// cart.js removed — no-op placeholder kept to avoid 404 if referenced
// If you want to fully remove this file, delete it from the project.
console.warn('cart.js is disabled — cart functionality removed per request.');

