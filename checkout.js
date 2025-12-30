// checkout.js disabled — checkout functionality removed per request
(() => {
	const API_BASE = 'http://localhost:4000';

	function formatCurrency(n) {
		return '$' + (Number(n) || 0).toFixed(2);
	}

	function renderCart() {
		const cart = window.Cart.getCart();
		const listEl = document.getElementById('cart-list');
		const summaryEl = document.getElementById('cart-summary');
		const resultEl = document.getElementById('order-result');
		resultEl.innerHTML = '';

		if (!cart.length) {
			listEl.innerHTML = '<p>Your cart is empty.</p>';
			summaryEl.innerHTML = '';
			return;
		}

		listEl.innerHTML = cart.map(item => `
			<div class="cart-row" data-id="${item.id}" style="display:flex;gap:1rem;align-items:center;margin-bottom:0.75rem;">
				<img src="${item.image && item.image.startsWith('http') ? item.image : 'assets/' + (item.image || '')}" style="width:64px;height:64px;object-fit:cover;border-radius:4px;">
				<div style="flex:1;">
					<div style="font-weight:600">${item.name}</div>
					<div style="color:var(--muted);">${formatCurrency(item.price)}</div>
				</div>
				<div style="display:flex;align-items:center;gap:0.5rem;">
					<button class="btn qty-minus" data-id="${item.id}">-</button>
					<input type="number" min="0" value="${item.qty}" data-id="${item.id}" class="qty-input" style="width:56px;padding:0.25rem;text-align:center;">
					<button class="btn qty-plus" data-id="${item.id}">+</button>
					<button class="btn btn-secondary remove-btn" data-id="${item.id}">Remove</button>
				</div>
			</div>
		`).join('');

		const total = cart.reduce((s, it) => s + (Number(it.price || 0) * (it.qty || 0)), 0);
		summaryEl.innerHTML = `<div style="font-size:1.1rem;">Total: <strong>${formatCurrency(total)}</strong></div>`;

		// attach listeners: direct qty change
		document.querySelectorAll('.qty-input').forEach(inp => {
			inp.addEventListener('change', (e) => {
				const id = e.target.dataset.id;
				const qty = parseInt(e.target.value, 10) || 0;
				window.Cart.updateQuantity(id, qty);
				renderCart();
			});
		});
		// +/- buttons
		document.querySelectorAll('.qty-plus').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const id = e.target.dataset.id;
				const cartItem = window.Cart.getCart().find(i => String(i.id) === String(id));
				const qty = (cartItem ? (cartItem.qty || 0) : 0) + 1;
				window.Cart.updateQuantity(id, qty);
				renderCart();
			});
		});
		document.querySelectorAll('.qty-minus').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const id = e.target.dataset.id;
				const cartItem = window.Cart.getCart().find(i => String(i.id) === String(id));
				const qty = (cartItem ? (cartItem.qty || 0) : 0) - 1;
				window.Cart.updateQuantity(id, qty);
				renderCart();
			});
		});
		document.querySelectorAll('.remove-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const id = e.target.dataset.id;
				window.Cart.removeItem(id);
				renderCart();
			});
		});
	}

	async function placeOrder() {
		const cart = window.Cart.getCart();
		if (!cart.length) { alert('Cart is empty'); return; }

		const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
		if (!user) { alert('Please login to place order'); window.location.href = 'login.html'; return; }

		const order = {
			userId: user.id || null,
			userName: user.name || null,
			items: cart,
			total: cart.reduce((s, it) => s + (Number(it.price || 0) * (it.qty || 0)), 0),
			createdAt: new Date().toISOString()
		};

		try {
			const res = await fetch(`${API_BASE}/orders`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(order)
			});
			if (!res.ok) throw new Error('Order failed');
			const data = await res.json();
			// show success message and clear cart
			alert('Your order placed successfully');
			document.getElementById('order-result').innerHTML = `<div style="padding:1rem;background:#e6ffed;border:1px solid #b7f0c6;">Your order placed successfully. Order id: ${data.id || '(saved)'}</div>`;
			window.Cart.clearCart();
			renderCart();
		} catch (err) {
			console.error('placeOrder', err);
			alert('Failed to place order. Is the API running?');
		}
	}

	document.addEventListener('DOMContentLoaded', () => {
		if (typeof updateNav === 'function') updateNav();
		renderCart();
		const clearBtn = document.getElementById('clear-cart');
		if (clearBtn) clearBtn.addEventListener('click', () => { if (confirm('Clear cart?')) { window.Cart.clearCart(); renderCart(); } });
		const checkoutBtn = document.getElementById('checkout-btn');
		if (checkoutBtn) checkoutBtn.addEventListener('click', placeOrder);

		try { if (window.BroadcastChannel) { const bc = new BroadcastChannel('cart_channel'); bc.onmessage = renderCart; } } catch (e) {}
		window.addEventListener('storage', (e) => { if (e.key === 'cart_updated') renderCart(); });
	});
})();
