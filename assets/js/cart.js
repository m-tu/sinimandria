// Sinimandria Shopping Cart
class ShoppingCart {
    constructor() {
        this.cart = [];
        this.cartExpiryHours = 24; // Cart expires after 24 hours
        this.init();
    }

    init() {
        this.loadCartFromStorage();
        this.bindEvents();
        this.updateCartDisplay();
    }

    // Load cart from localStorage with expiry check
    loadCartFromStorage() {
        try {
            const cartData = localStorage.getItem('sinimandria_cart');
            const cartTimestamp = localStorage.getItem('sinimandria_cart_timestamp');
            
            if (cartData && cartTimestamp) {
                const now = new Date().getTime();
                const stored = parseInt(cartTimestamp);
                const hoursElapsed = (now - stored) / (1000 * 60 * 60);
                
                if (hoursElapsed < this.cartExpiryHours) {
                    this.cart = JSON.parse(cartData);
                } else {
                    // Cart expired, clear it
                    this.clearCart();
                }
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            this.cart = [];
        }
    }

    // Save cart to localStorage
    saveCartToStorage() {
        try {
            localStorage.setItem('sinimandria_cart', JSON.stringify(this.cart));
            localStorage.setItem('sinimandria_cart_timestamp', new Date().getTime().toString());
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    }

    // Bind event listeners
    bindEvents() {
        // Cart toggle button
        const cartToggle = document.getElementById('cart-toggle');
        if (cartToggle) {
            cartToggle.addEventListener('click', () => this.toggleCart());
        }

        // Close cart button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('cart-close') || e.target.closest('.cart-close')) {
                this.closeCart();
            }
        });

        // Close cart when clicking overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('cart-overlay')) {
                this.closeCart();
            }
        });

        // Add to cart buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn') || e.target.closest('.add-to-cart-btn')) {
                e.preventDefault();
                this.handleAddToCart(e.target);
            }
        });

        // Cart item quantity changes
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('qty-increase')) {
                const productName = e.target.dataset.product;
                this.increaseQuantity(productName);
            } else if (e.target.classList.contains('qty-decrease')) {
                const productName = e.target.dataset.product;
                this.decreaseQuantity(productName);
            } else if (e.target.classList.contains('remove-item')) {
                const productName = e.target.dataset.product;
                this.removeItem(productName);
            }
        });

        // Checkout button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('checkout-btn') || e.target.closest('.checkout-btn')) {
                this.checkout();
            }
        });

        // Escape key to close cart
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCart();
            }
        });
    }

    // Handle add to cart button click
    handleAddToCart(button) {
        const bakeryItem = button.closest('.bakery-item');
        if (!bakeryItem) return;

        const name = bakeryItem.querySelector('h3').textContent.trim();
        const priceText = bakeryItem.querySelector('.bakery-price').textContent.trim();
        const price = parseFloat(priceText.replace('€', '').replace(',', '.'));

        this.addItem(name, price);
        this.showAddedToCartFeedback(button);
    }

    // Add item to cart
    addItem(name, price) {
        const existingItem = this.cart.find(item => item.name === name);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                name: name,
                price: price,
                quantity: 1
            });
        }
        
        this.saveCartToStorage();
        this.updateCartDisplay();
    }

    // Remove item from cart
    removeItem(name) {
        this.cart = this.cart.filter(item => item.name !== name);
        this.saveCartToStorage();
        this.updateCartDisplay();
    }

    // Increase item quantity
    increaseQuantity(name) {
        const item = this.cart.find(item => item.name === name);
        if (item) {
            item.quantity += 1;
            this.saveCartToStorage();
            this.updateCartDisplay();
        }
    }

    // Decrease item quantity
    decreaseQuantity(name) {
        const item = this.cart.find(item => item.name === name);
        if (item && item.quantity > 1) {
            item.quantity -= 1;
            this.saveCartToStorage();
            this.updateCartDisplay();
        } else if (item && item.quantity === 1) {
            this.removeItem(name);
        }
    }

    // Get total price
    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Get total items count
    getTotalItems() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    // Update cart display
    updateCartDisplay() {
        this.updateCartBadge();
        this.updateCartPanel();
    }

    // Update cart badge
    updateCartBadge() {
        const cartBadge = document.querySelector('.cart-badge');
        const totalItems = this.getTotalItems();
        
        if (cartBadge) {
            if (totalItems > 0) {
                cartBadge.textContent = totalItems;
                cartBadge.classList.remove('is-hidden');
            } else {
                cartBadge.classList.add('is-hidden');
            }
        }
    }

    // Update cart panel content
    updateCartPanel() {
        const cartItems = document.querySelector('.cart-items');
        const cartTotal = document.querySelector('.cart-total');
        const checkoutBtn = document.querySelector('.checkout-btn');
        
        if (!cartItems) return;

        if (this.cart.length === 0) {
            cartItems.innerHTML = '<div class="cart-empty">Ostukorv on tühi</div>';
            if (cartTotal) cartTotal.textContent = '0€';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        let itemsHtml = '';
        this.cart.forEach(item => {
            itemsHtml += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${item.price.toFixed(2)}€</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn qty-decrease" data-product="${item.name}">-</button>
                        <span class="cart-item-qty">${item.quantity}</span>
                        <button class="qty-btn qty-increase" data-product="${item.name}">+</button>
                        <button class="remove-item" data-product="${item.name}">×</button>
                    </div>
                </div>
            `;
        });

        cartItems.innerHTML = itemsHtml;
        
        if (cartTotal) {
            cartTotal.textContent = this.getTotal().toFixed(2) + '€';
        }
        
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
        }
    }

    // Toggle cart panel
    toggleCart() {
        const cartPanel = document.querySelector('.cart-panel');
        const cartOverlay = document.querySelector('.cart-overlay');
        
        if (cartPanel && cartOverlay) {
            const isOpen = cartPanel.classList.contains('cart-open');
            
            if (isOpen) {
                this.closeCart();
            } else {
                this.openCart();
            }
        }
    }

    // Open cart panel
    openCart() {
        const cartPanel = document.querySelector('.cart-panel');
        const cartOverlay = document.querySelector('.cart-overlay');
        
        if (cartPanel && cartOverlay) {
            cartPanel.classList.add('cart-open');
            cartOverlay.classList.add('cart-open');
            document.body.style.overflow = 'hidden'; // Prevent body scroll
        }
    }

    // Close cart panel
    closeCart() {
        const cartPanel = document.querySelector('.cart-panel');
        const cartOverlay = document.querySelector('.cart-overlay');
        
        if (cartPanel && cartOverlay) {
            cartPanel.classList.remove('cart-open');
            cartOverlay.classList.remove('cart-open');
            document.body.style.overflow = ''; // Restore body scroll
        }
    }

    // Show feedback when item added to cart
    showAddedToCartFeedback(button) {
        const originalText = button.textContent;
        button.textContent = 'Lisatud!';
        button.style.background = '#4CAF50';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 1000);
    }

    // Clear cart
    clearCart() {
        this.cart = [];
        localStorage.removeItem('sinimandria_cart');
        localStorage.removeItem('sinimandria_cart_timestamp');
        this.updateCartDisplay();
    }

    // Checkout process
    checkout() {
        if (this.cart.length === 0) {
            alert('Ostukorv on tühi!');
            return;
        }

        const total = this.getTotal();
        const totalItems = this.getTotalItems();
        
        // Simple confirmation
        const confirmation = confirm(
            `Kinnitad ostu?\n\nKokku: ${totalItems} toodet\nSumma: ${total.toFixed(2)}€`
        );
        
        if (confirmation) {
            // Clear cart after successful "purchase"
            this.clearCart();
            this.closeCart();
            
            // Show success message
            this.showCheckoutSuccess();
        }
    }

    // Show checkout success message
    showCheckoutSuccess() {
        // Create success message
        const successDiv = document.createElement('div');
        successDiv.className = 'checkout-success';
        successDiv.innerHTML = `
            <div class="success-content">
                <h3>✅ Tellimus edukalt esitatud!</h3>
                <p>Täname tellimuse eest. Võtame teiega peagi ühendust.</p>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        // Remove success message after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sinimandriCart = new ShoppingCart();
});
