document.addEventListener('DOMContentLoaded', () => {
    checkAdmin();
    loadProducts();
    setupModal();
});

const API_BASE = 'https://json-backend-29ka.onrender.com';

function checkAdmin() {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        alert('Access Denied: You must be an Admin to view this page.');
        window.location.href = 'index.html';
    }
}

async function loadProducts() {
    const tbody = document.querySelector('#products-table tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading Products...</td></tr>';

    try {
        const response = await fetch(`${API_BASE}/products`);
        if (!response.ok) throw new Error('Network response was not ok');
        const products = await response.json();

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No products found in database.</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.id}</td>
                <td><img src="${p.image.startsWith('http') ? p.image : 'assets/' + p.image}" style="width: 50px; height: 50px; object-fit: cover;"></td>
                <td>${p.name}</td>
                <td>$${p.price}</td>
                <td>${p.category}</td>
               <td>
    <button class="btn btn-secondary" onclick="window.editProduct('${p.id}')" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">Edit</button>
    <button class="btn btn-primary" onclick="window.deleteProduct('${p.id}')" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; background: red; border: 1px solid red;">Delete</button>
</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Connection Error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="color: #ff5555; text-align: center; padding: 2rem;">
                    <h3>connection Error</h3>
                    <p>Could not retrieve data from the server.</p>
                    <p>Please make sure <strong>json-server</strong> is running on port 4000.</p>
                    <pre>npx json-server db.json --port 4000</pre>
                </td>
            </tr>
        `;
    }
}

// Modal Logic
const modal = document.getElementById('product-modal');
const span = document.getElementsByClassName('close')[0];
const form = document.getElementById('product-form');

function setupModal() {
    document.getElementById('add-product-btn').onclick = () => {
        openModal();
    };
    span.onclick = () => modal.style.display = "none";
    window.onclick = (e) => {
        if (e.target == modal) modal.style.display = "none";
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        await saveProduct();
    };
}

function openModal(product = null) {
    modal.style.display = "block";
    if (product) {
        document.getElementById('modal-title').textContent = "Edit Product";
        document.getElementById('product-id').value = product.id;
        document.getElementById('p-name').value = product.name;
        document.getElementById('p-price').value = product.price;
        document.getElementById('p-category').value = product.category;
        document.getElementById('p-image').value = product.image;
        document.getElementById('p-desc').value = product.description;
    } else {
        document.getElementById('modal-title').textContent = "Add Product";
        form.reset();
        document.getElementById('product-id').value = "";
    }
}

// Global scope binding for HTML onclick handlers
window.editProduct = async function (id) {
    console.log("Edit requested for:", id);
    try {
        const response = await fetch(`${API_BASE}/products/${id}`);
        const product = await response.json();
        openModal(product);
    } catch (e) {
        console.error(e);
        alert("Error fetching product details.");
    }
}

window.deleteProduct = async function (id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        loadProducts();
        notifyProductsChanged();
    } catch (e) {
        console.error(e);
        alert("Error deleting product.");
    }
}

async function saveProduct() {
    const id = document.getElementById('product-id').value;
    const product = {
        name: document.getElementById('p-name').value,
        price: parseFloat(document.getElementById('p-price').value),
        category: document.getElementById('p-category').value,
        image: document.getElementById('p-image').value,
        description: document.getElementById('p-desc').value
    };

    try {
        if (id) {
            // Update
            await fetch(`${API_BASE}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
        } else {
            // Create
            await fetch(`${API_BASE}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
        }
            // Notify other pages/tabs that products changed
            try {
                // If using API_BASE constant, ensure PUT/POST used that too
                // (the existing fetch calls above used absolute URL; keep them as-is)
            } catch (e) { /* ignore */ }

            modal.style.display = "none";
            loadProducts();
            notifyProductsChanged();
    } catch (e) {
        alert("Error saving product. Is the server running?");
    }
}

    function notifyProductsChanged() {
        try {
            if (window.BroadcastChannel) {
                const bc = new BroadcastChannel('products_channel');
                bc.postMessage({ type: 'updated', time: Date.now() });
                bc.close();
            } else {
                localStorage.setItem('products_updated', Date.now());
            }
        } catch (err) {
            console.warn('notifyProductsChanged error', err);
        }
    }

