document.addEventListener('DOMContentLoaded', async function () {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product');

    if (!productId) {
        alert("No product selected!");
        window.location.href = "index.html";
        return;
    }

    try {
        const response = await fetch(`/api/product/${productId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.offer) {
            const nameEl = document.getElementById("product-name");
            const priceEl = document.getElementById("product-price-display");
            const descEl = document.getElementById("product-description");
            const imageEl = document.getElementById("product-image");
            
            // Update the summary section price as well
            const summaryPriceEl = document.getElementById("summary-product-price");

            // Update elements with product data
            if (nameEl) nameEl.textContent = data.offer.title;
            if (priceEl) priceEl.textContent = `₹${data.offer.price}`;
            if (summaryPriceEl) summaryPriceEl.textContent = `₹${data.offer.price}`;
            if (descEl) descEl.textContent = data.offer.description;
            
            // Set image src - use the offer's image_url or the separate image_url property
            if (imageEl) {
                // Prefer the offer.image_url if available, otherwise use the separate image_url
                const imageUrl = data.offer.image_url || data.image_url || 'https://example.com/images/placeholder.jpg';
                imageEl.src = imageUrl;
                imageEl.onerror = function() {
                    // If image fails to load, use placeholder
                    this.src = 'https://example.com/images/placeholder.jpg';
                };
            }
            
            // Store product data for later use
            window.productData = data.offer;
        } else {
            alert("Product not found!");
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        alert("Failed to load product details: " + error.message);
        window.location.href = "index.html";
    }

    // Set up the calculate delivery button
    const calculateBtn = document.getElementById("calculate-delivery");
    if (calculateBtn) {
        calculateBtn.addEventListener("click", function() {
            // Simple validation
            const form = document.getElementById("shipping-form");
            if (form.checkValidity()) {
                calculateDelivery();
            } else {
                alert("Please fill out all required fields correctly.");
                form.reportValidity();
            }
        });
    }

    function calculateDelivery() {
        // For this example, we'll just show the summary with some dummy values
        // In a real application, you would calculate based on weight, distance, etc.
        
        const productPrice = window.productData ? parseFloat(window.productData.price) : 0;
        const gstAmount = productPrice * 0.18;
        const deliveryCharge = 100; // Fixed delivery charge for this example
        const totalPrice = productPrice + gstAmount + deliveryCharge;

        // Update summary values
        document.getElementById("summary-product-price").textContent = `₹${productPrice.toFixed(2)}`;
        document.getElementById("gst-amount").textContent = `₹${gstAmount.toFixed(2)}`;
        document.getElementById("delivery-charge").textContent = `₹${deliveryCharge.toFixed(2)}`;
        document.getElementById("total-price").textContent = `₹${totalPrice.toFixed(2)}`;

        // Show the cost summary section
        document.getElementById("cost-summary").style.display = "block";

        // Set up pay button
        const payButton = document.getElementById("pay-now");
        if (payButton) {

            payButton.addEventListener("click", function() {
                window.location.href = `payment.html?transactionId=${(totalPrice^718234192389123412344)}`;
                processPayment(totalPrice);
            });

        }
    }

    function processPayment(amount) {
        // In a real application, you would integrate with Razorpay here
        // For this example, we'll just simulate a successful payment
        alert("Payment processed successfully!");
        
        // Show delivery status
        document.getElementById("delivery-status").style.display = "block";
        
        // Generate a fake tracking ID
        const trackingId = "TRK" + Math.floor(Math.random() * 1000000);
        document.getElementById("tracking-id").textContent = trackingId;
    }
});

// Fetch product details from server
async function fetchProductDetails(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch product details');
        }
        
        const product = await response.json();
        displayProductDetails(product);
    } catch (error) {
        console.error('Error fetching product details:', error);
        alert('Failed to load product details. Please try again later.');
    }
}

// Display product details in the page
function displayProductDetails(product) {
    const productInfoDiv = document.getElementById('product-info');
    
    productInfoDiv.innerHTML = `
        <div class="product-info-item">
            <strong>Product:</strong> ${product.name}
        </div>
        <div class="product-info-item">
            <strong>Price:</strong> ₹${product.price.toFixed(2)}
        </div>
        <div class="product-info-item">
            <strong>Weight:</strong> ${product.weight} kg
        </div>
        <div class="product-info-item">
            <strong>Dimensions:</strong> ${product.dimensions.length}cm × ${product.dimensions.breadth}cm × ${product.dimensions.height}cm
        </div>
        <div class="product-info-item">
            <strong>Seller PIN Code:</strong> ${product.sellerPincode}
        </div>
    `;
    
    // Store product details in global variables
    window.productDetails = product;
    
    // Update product price in summary
    document.getElementById('product-price').textContent = `₹${product.price.toFixed(2)}`;
    
    // Calculate and display GST
    const gstAmount = product.price * 0.18;
    document.getElementById('gst-amount').textContent = `₹${gstAmount.toFixed(2)}`;
}

// Calculate delivery cost using India Post API
async function calculateDelivery() {
    // Validate form
    const form = document.getElementById('shipping-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const buyerPincode = document.getElementById('pincode').value;
    const product = window.productDetails;
    
    if (!product) {
        alert('Product details not loaded. Please refresh the page.');
        return;
    }
    
    // Show loading state
    const calculateButton = document.getElementById('calculate-delivery');
    const originalButtonText = calculateButton.textContent;
    calculateButton.textContent = 'Calculating...';
    calculateButton.disabled = true;
    
    try {
        // Prepare delivery calculation request
        const deliveryData = {
            sourcePin: product.sellerPincode,
            destinationPin: buyerPincode,
            weight: product.weight,
            dimensions: product.dimensions
        };
        
        // Call India Post API for delivery cost calculation
        const response = await fetch('/api/calculate-delivery', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(deliveryData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to calculate delivery cost');
        }
        
        const deliveryInfo = await response.json();
        
        // Display delivery cost and total
        document.getElementById('delivery-charge').textContent = `₹${deliveryInfo.deliveryCost.toFixed(2)}`;
        
        // Calculate total cost
        const productPrice = product.price;
        const gst = productPrice * 0.18;
        const totalCost = productPrice + gst + deliveryInfo.deliveryCost;
        
        document.getElementById('total-price').textContent = `₹${totalCost.toFixed(2)}`;
        
        // Store delivery info for later use
        window.deliveryInfo = deliveryInfo;
        window.totalCost = totalCost;
        
        // Show cost summary
        document.getElementById('cost-summary').style.display = 'block';
        
        // Scroll to cost summary
        document.getElementById('cost-summary').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error calculating delivery:', error);
        alert('Failed to calculate delivery cost. Please try again later.');
    } finally {
        // Restore button state
        calculateButton.textContent = originalButtonText;
        calculateButton.disabled = false;
    }
}

// Initiate payment via Razorpay
function initiatePayment() {
    if (!window.totalCost) {
        alert('Please calculate delivery cost first');
        return;
    }
    
    // Collect all user data
    const userData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: {
            street: document.getElementById('street').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            pincode: document.getElementById('pincode').value
        },
        productId: window.productDetails.id,
        deliveryInfo: window.deliveryInfo,
        totalAmount: window.totalCost
    };
    
    // Create order on the server
    fetch('/api/create-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create order');
        }
        return response.json();
    })
    .then(orderData => {
        // Configure Razorpay options
        const options = {
            key: orderData.razorpayKeyId, // from server
            amount: orderData.amount, // in paise (from server)
            currency: 'INR',
            name: 'Your E-commerce Store',
            description: 'Purchase of ' + window.productDetails.name,
            order_id: orderData.razorpayOrderId, // from server
            handler: function(response) {
                // Handle successful payment
                verifyPayment(response, orderData.orderId);
            },
            prefill: {
                name: userData.name,
                email: userData.email,
                contact: userData.phone
            },
            theme: {
                color: '#3498db'
            }
        };
        
        // Initialize Razorpay
        const razorpay = new Razorpay(options);
        razorpay.open();
        
    })
    .catch(error => {
        console.error('Payment initialization error:', error);
        alert('Failed to initialize payment. Please try again later.');
    });
}

// Verify payment with the server
function verifyPayment(paymentData, orderId) {
    fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            orderId: orderId,
            razorpayPaymentId: paymentData.razorpay_payment_id,
            razorpayOrderId: paymentData.razorpay_order_id,
            razorpaySignature: paymentData.razorpay_signature
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Payment verification failed');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Payment successful, initiate delivery
            initiateDelivery(orderId);
        } else {
            alert('Payment verification failed. Please contact customer support.');
        }
    })
    .catch(error => {
        console.error('Payment verification error:', error);
        alert('Payment verification failed. Please contact customer support.');
    });
}

// Initiate delivery with India Post
function initiateDelivery(orderId) {
    fetch('/api/initiate-delivery', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId: orderId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to initiate delivery');
        }
        return response.json();
    })
    .then(data => {
        // Show delivery status
        document.getElementById('cost-summary').style.display = 'none';
        document.getElementById('delivery-status').style.display = 'block';
        
        // Set tracking ID if available
        if (data.trackingId) {
            document.getElementById('tracking-id').textContent = data.trackingId;
        }
        
        // Store tracking info
        window.trackingInfo = data;
        
        // Scroll to delivery status
        document.getElementById('delivery-status').scrollIntoView({ behavior: 'smooth' });
    })
    .catch(error => {
        console.error('Delivery initiation error:', error);
        alert('Your payment was successful, but there was an issue initiating the delivery. Our team will contact you shortly.');
    });
}

// Track order status
function trackOrder() {
    if (!window.trackingInfo || !window.trackingInfo.trackingId) {
        alert('Tracking information not available yet. Please try again later.');
        return;
    }
    
    // Open India Post tracking in a new window
    window.open(`https://www.indiapost.gov.in/vas/Pages/TrackConsignment.aspx?trackingparam=${window.trackingInfo.trackingId}`, '_blank');
}