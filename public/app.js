document.addEventListener("DOMContentLoaded", () => {
    fetch("/api/products")
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('products-container');
            data.forEach(product => {
                const div = document.createElement('div');
                div.innerHTML = `<h3>${product.name}</h3><p>${product.description}</p><p>Price: ₹${product.price}</p>`;
                container.appendChild(div);
            });
        });
});