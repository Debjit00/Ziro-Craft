document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/cart/1')
        .then(res => res.json())
        .then(cartItems => {
            const container = document.getElementById('cart-container');
            cartItems.forEach(item => {
                const cartItemDiv = document.createElement('div');
                cartItemDiv.innerHTML = `<h2>${item.name}</h2><p>Price: ₹${item.price}</p><p>Quantity: ${item.quantity}</p>`;
                container.appendChild(cartItemDiv);
            });
        });
});