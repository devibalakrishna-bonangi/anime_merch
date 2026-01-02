document.addEventListener('DOMContentLoaded', async () => {
    // Determine which page we are on
    if (document.getElementById('featured-products')) {
        loadFeaturedProducts();
    }
});

async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products');
    try {
        const response = await fetch('https://json-backend-29ka.onrender.com/products');
        const products = await response.json();

        // Just show first 3 for featured
        const featured = products.slice(0, 3);

        container.innerHTML = featured.map(product => `
            <div class="product-card">
                <img src="${product.image.startsWith('http') ? product.image : 'assets/' + product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-price">$${product.price}</div>
                    <p>${product.description}</p>
                    <button class="btn btn-primary" onclick="addToCart('${product.id}')">Add to Cart</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching products:', error);
        container.innerHTML = '<p>Failed to load products. Is json-server running?</p>';
    }
}

// Provide a fallback addToCart only if another implementation doesn't exist
if (typeof window.addToCart !== 'function') {
    window.addToCart = function (productId) {
        const user = getCurrentUser();
        if (!user) {
            alert('Please login to purchase items!');
            window.location.href = 'login.html';
            return;
        }
        alert(`Product ${productId} added to cart! (Demo)`);
    };
}

