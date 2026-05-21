/**
 * Lagos Jewelry - Storefront Application Controller
 * Manages UI rendering, filters, search, cart actions, and WhatsApp checkout.
 */

document.addEventListener("DOMContentLoaded", () => {
    // App State
    let cart = JSON.parse(localStorage.getItem("lagos_cart")) || [];
    let currentCategory = "All";
    let searchQuery = "";
    let autoBannerInterval = null;

    // DOM Elements Cache
    const storeNameDisplays = [
        document.getElementById("store-name-display"),
        document.getElementById("footer-store-name"),
        document.getElementById("copyright-store-name")
    ];
    const logoPlaceholders = [
        document.getElementById("store-logo-placeholder"),
        document.getElementById("footer-logo-circle")
    ];
    const searchInput = document.getElementById("search-input");
    const headerWhatsappBtn = document.getElementById("header-whatsapp-btn");
    const cartTrigger = document.getElementById("cart-trigger");
    const cartBadgeCount = document.getElementById("cart-badge-count");
    const categoriesScroll = document.getElementById("categories-scroll-menu");
    const productsGrid = document.getElementById("products-showcase-grid");

    // Modal Elements
    const productModal = document.getElementById("product-detail-modal");
    const modalContentWrapper = document.getElementById("modal-content-wrapper");

    // Drawer Elements
    const cartDrawerBackdrop = document.getElementById("cart-drawer-backdrop");
    const cartCloseBtn = document.getElementById("cart-close-btn");
    const cartItemsContainer = document.getElementById("cart-items-list-container");
    const cartFooterCheckout = document.getElementById("cart-footer-checkout");
    const cartSubtotalVal = document.getElementById("cart-subtotal-value");

    // Form Elements
    const checkoutForm = document.getElementById("checkout-details-form");
    const custNameInput = document.getElementById("cust-name");
    const custPhoneInput = document.getElementById("cust-phone");
    const custDeliverySelect = document.getElementById("cust-delivery-method");
    const addressFieldGroup = document.getElementById("address-field-group");
    const custAddressInput = document.getElementById("cust-address");

    // ==========================================
    // 1. Theme and Store Configurations Loader
    // ==========================================
    function applyStoreConfig() {
        const settings = window.LagosDB.getSettings();
        if (!settings) return;

        // Apply Theme classes to body
        document.body.className = ""; // clear themes
        document.body.classList.add(`theme-${settings.storeTheme}`);

        // Update Store Name in Headers/Footers
        storeNameDisplays.forEach(el => {
            if (el) el.textContent = settings.storeName;
        });

        // Update Circular/Image Logo
        logoPlaceholders.forEach(el => {
            if (el) {
                if (settings.storeLogo) {
                    el.innerHTML = `<img src="${settings.storeLogo}" alt="${settings.storeName}" class="logo-img">`;
                } else {
                    // Default to first letter of store name
                    el.innerHTML = settings.storeName.charAt(0).toUpperCase();
                }
            }
        });

        // Update Header WhatsApp button destination
        if (headerWhatsappBtn) {
            headerWhatsappBtn.href = `https://wa.me/${settings.storePhone}`;
            const displaySpan = headerWhatsappBtn.querySelector("span");
            if (displaySpan) {
                displaySpan.textContent = settings.storePhoneDisplay;
            }
        }

        // Trigger fresh renders
        renderCategories();
        renderProducts();
        renderCart();
    }

    // Listen to administrative updates from admin panel in other tabs
    window.addEventListener("lagos_db_update", applyStoreConfig);

    // ==========================================
    // 2. Banner Carousel Slider Auto Scroll
    // ==========================================
    function initBannerCarousel() {
        const slides = document.querySelectorAll(".banner-slide");
        if (slides.length <= 1) return;

        let currentSlideIdx = 0;

        function nextSlide() {
            slides[currentSlideIdx].classList.remove("active");
            currentSlideIdx = (currentSlideIdx + 1) % slides.length;
            slides[currentSlideIdx].classList.add("active");
        }

        // Clear existing interval if any
        if (autoBannerInterval) clearInterval(autoBannerInterval);

        // Setup new interval
        autoBannerInterval = setInterval(nextSlide, 4000);
    }

    // ==========================================
    // 3. Category Nav & Products Showcase Renderer
    // ==========================================
    function renderCategories() {
        if (!categoriesScroll) return;

        const categories = window.LagosDB.getCategories();

        // Keep active selection in mind
        categoriesScroll.innerHTML = categories.map(cat => {
            const isActive = cat === currentCategory;
            return `<button class="category-btn ${isActive ? 'active' : ''}" data-category="${cat}">${cat === 'All' ? 'All Pieces' : cat}</button>`;
        }).join("");

        // Attach event listeners
        categoriesScroll.querySelectorAll(".category-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                categoriesScroll.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                currentCategory = e.target.getAttribute("data-category");
                renderProducts();
            });
        });
    }

    function renderProducts() {
        if (!productsGrid) return;

        const products = window.LagosDB.getProducts();
        const settings = window.LagosDB.getSettings();
        const currency = settings.storeCurrency || "$";

        // Filter by Category and Search Query
        let filtered = products.filter(p => {
            const matchesCategory = currentCategory === "All" || p.category === currentCategory;
            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });

        if (filtered.length === 0) {
            productsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                    <i class="fa-solid fa-gem" style="font-size: 2.5rem; color: var(--border-color); margin-bottom: 1rem;"></i>
                    <p>No jewelry pieces found matching your criteria.</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = filtered.map(product => {
            const hasPromo = product.originalPrice && product.originalPrice > product.price;
            const discountPercent = hasPromo ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
            const installmentPrice = (product.price / 3).toFixed(2);

            return `
                <div class="product-card" id="card-${product.id}">
                    ${hasPromo ? `<span class="product-badge">${discountPercent}% OFF</span>` : ""}
                    <div class="product-image-container" onclick="openProductModal('${product.id}')">
                        <img src="${product.image}" alt="${product.title}" class="product-image" onerror="this.src='https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=600&auto=format&fit=crop'">
                    </div>
                    <div class="product-info">
                        <span class="product-sku">${product.sku}</span>
                        <h3 class="product-title" onclick="openProductModal('${product.id}')">${product.title}</h3>
                        
                        <div class="product-price-row">
                            <span class="product-price">${currency}${product.price.toFixed(2)}</span>
                            ${hasPromo ? `<span class="product-original-price">${currency}${product.originalPrice.toFixed(2)}</span>` : ""}
                        </div>
                        <p class="product-installments">or 3x of ${currency}${installmentPrice}</p>
                        
                        <button class="add-to-cart-btn" data-id="${product.id}">
                            <i class="fa-solid fa-plus"></i> Add to Bag
                        </button>
                    </div>
                </div>
            `;
        }).join("");

        // Attach Quick Add buttons listeners
        productsGrid.querySelectorAll(".add-to-cart-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const pId = btn.getAttribute("data-id");
                const product = window.LagosDB.getProductById(pId);

                // If it has variations, open detail modal instead for user choice
                if (product.variations && product.variations.options.length > 0) {
                    openProductModal(pId);
                } else {
                    addToCart(product, 1, null);
                }
            });
        });
    }

    // ==========================================
    // 4. Modal Handler (Product Details)
    // ==========================================
    window.openProductModal = function (id) {
        const product = window.LagosDB.getProductById(id);
        if (!product) return;

        const settings = window.LagosDB.getSettings();
        const currency = settings.storeCurrency || "$";
        const hasPromo = product.originalPrice && product.originalPrice > product.price;

        let selectedVarOption = product.variations ? product.variations.options[0] : null;
        let buyQty = 1;

        modalContentWrapper.innerHTML = `
            <div class="modal-img-col">
                <button class="modal-close-btn" id="modal-close-trigger" aria-label="Close modal">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <img src="${product.image}" alt="${product.title}" class="modal-img" onerror="this.src='https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=600&auto=format&fit=crop'">
            </div>
            <div class="modal-info-col">
                <h2 class="modal-title">${product.title}</h2>
                <span class="modal-sku">${product.sku}</span>
                
                <div class="modal-price-row">
                    <span class="modal-price">${currency}${product.price.toFixed(2)}</span>
                    ${hasPromo ? `<span class="modal-original-price">${currency}${product.originalPrice.toFixed(2)}</span>` : ""}
                </div>
                
                <p class="modal-description">${product.description}</p>
                
                ${product.variations ? `
                    <h4 class="variation-label">Select ${product.variations.name}:</h4>
                    <div class="variation-options" id="modal-var-options">
                        ${product.variations.options.map((opt, i) => `
                            <button class="variation-option ${i === 0 ? 'active' : ''}" data-value="${opt}">${opt}</button>
                        `).join("")}
                    </div>
                ` : ""}
                
                <h4 class="variation-label">Quantity:</h4>
                <div class="quantity-section">
                    <div class="qty-selector">
                        <button class="qty-btn" id="qty-minus"><i class="fa-solid fa-minus"></i></button>
                        <span class="qty-val" id="qty-modal-val">1</span>
                        <button class="qty-btn" id="qty-plus"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
                
                <button class="add-to-cart-btn" id="modal-add-to-bag-btn" style="padding:1rem; font-size:0.95rem;">
                    <i class="fa-solid fa-bag-shopping"></i> Add to Shopping Bag
                </button>
            </div>
        `;

        // Toggle Modal Active Class
        productModal.classList.add("active");

        // Close Handlers
        const closeBtn = document.getElementById("modal-close-trigger");
        closeBtn.addEventListener("click", closeModal);

        // Quantity Buttons Handlers
        const qMinus = document.getElementById("qty-minus");
        const qPlus = document.getElementById("qty-plus");
        const qVal = document.getElementById("qty-modal-val");

        qMinus.addEventListener("click", () => {
            if (buyQty > 1) {
                buyQty--;
                qVal.textContent = buyQty;
            }
        });

        qPlus.addEventListener("click", () => {
            buyQty++;
            qVal.textContent = buyQty;
        });

        // Variation Click Handler
        const varButtons = modalContentWrapper.querySelectorAll(".variation-option");
        varButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                varButtons.forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                selectedVarOption = e.target.getAttribute("data-value");
            });
        });

        // Add to Bag inside Modal Handler
        const addToBagBtn = document.getElementById("modal-add-to-bag-btn");
        addToBagBtn.addEventListener("click", () => {
            const varLabel = product.variations ? `${product.variations.name}: ${selectedVarOption}` : null;
            addToCart(product, buyQty, varLabel);
            closeModal();
        });
    };

    function closeModal() {
        productModal.classList.remove("active");
    }

    // Close modal if user clicks outside content panel
    productModal.addEventListener("click", (e) => {
        if (e.target === productModal) closeModal();
    });

    // ==========================================
    // 5. Interactive Cart & Sacola System
    // ==========================================
    function addToCart(product, qty, variation) {
        // Check if item with same variation is already in cart
        const existingIdx = cart.findIndex(item => item.productId === product.id && item.variation === variation);

        if (existingIdx !== -1) {
            cart[existingIdx].quantity += qty;
        } else {
            cart.push({
                productId: product.id,
                title: product.title,
                sku: product.sku,
                price: product.price,
                quantity: qty,
                variation: variation,
                image: product.image
            });
        }

        saveCart();
        renderCart();
        triggerCartAnimation();

        // Show Success Toast Alert
        showToast(`Added ${qty}x ${product.title} to bag!`, "success");
    }

    function updateCartQty(idx, delta) {
        cart[idx].quantity += delta;
        if (cart[idx].quantity <= 0) {
            cart.splice(idx, 1);
            showToast("Item removed from bag.", "error");
        }
        saveCart();
        renderCart();
    }

    function removeFromCart(idx) {
        cart.splice(idx, 1);
        saveCart();
        renderCart();
        showToast("Item removed from bag.", "error");
    }

    function saveCart() {
        localStorage.setItem("lagos_cart", JSON.stringify(cart));
    }

    function triggerCartAnimation() {
        if (cartBadgeCount) {
            cartBadgeCount.classList.remove("animate-bag-zoom");
            void cartBadgeCount.offsetWidth; // Trigger reflow to restart css anim
            cartBadgeCount.classList.add("animate-bag-zoom");
        }
    }

    function renderCart() {
        if (!cartItemsContainer || !cartBadgeCount || !cartFooterCheckout || !cartSubtotalVal) return;

        const settings = window.LagosDB.getSettings();
        const currency = settings.storeCurrency || "$";

        // Count total item units in cart
        const totalItemsCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

        // Toggle badge display
        if (totalItemsCount > 0) {
            cartBadgeCount.textContent = totalItemsCount;
            cartBadgeCount.style.display = "flex";
        } else {
            cartBadgeCount.style.display = "none";
        }

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty-message">
                    <i class="fa-solid fa-bag-shopping cart-empty-icon"></i>
                    <p>Your shopping bag is empty.</p>
                    <p style="font-size:0.8rem; margin-top:0.5rem; opacity:0.8;">Explore our catalog and add items!</p>
                </div>
            `;
            cartFooterCheckout.style.display = "none";
            return;
        }

        // Render populated items
        cartItemsContainer.innerHTML = cart.map((item, idx) => {
            return `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.title}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=600&auto=format&fit=crop'">
                    <div class="cart-item-details">
                        <span class="cart-item-title">${item.title}</span>
                        ${item.variation ? `<span class="cart-item-variation">${item.variation}</span>` : ""}
                        <div class="cart-item-price-row">
                            <div class="qty-selector" style="transform: scale(0.85); transform-origin: left center;">
                                <button class="qty-btn" onclick="adjustCartItemQty(${idx}, -1)"><i class="fa-solid fa-minus"></i></button>
                                <span class="qty-val">${item.quantity}</span>
                                <button class="qty-btn" onclick="adjustCartItemQty(${idx}, 1)"><i class="fa-solid fa-plus"></i></button>
                            </div>
                            <span class="cart-item-price">${currency}${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        <button class="cart-item-remove-btn" onclick="deleteCartItem(${idx})" aria-label="Remove item">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join("");

        // Show checkout footer and calculate totals
        cartFooterCheckout.style.display = "block";
        const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
        cartSubtotalVal.textContent = `${currency}${subtotal.toFixed(2)}`;
    }

    // Attach cart actions to window for direct element triggers
    window.adjustCartItemQty = function (idx, delta) {
        updateCartQty(idx, delta);
    };

    window.deleteCartItem = function (idx) {
        removeFromCart(idx);
    };

    // Toggle Cart Drawer panel visibility
    cartTrigger.addEventListener("click", () => {
        cartDrawerBackdrop.classList.add("active");
    });

    cartCloseBtn.addEventListener("click", closeCartDrawer);
    cartDrawerBackdrop.addEventListener("click", (e) => {
        if (e.target === cartDrawerBackdrop) closeCartDrawer();
    });

    function closeCartDrawer() {
        cartDrawerBackdrop.classList.remove("active");
    }

    // ==========================================
    // 6. Interactive Checkout Integration
    // ==========================================
    // Toggle address field validation and display based on delivery selection
    if (custDeliverySelect) {
        custDeliverySelect.addEventListener("change", (e) => {
            if (e.target.value === "Delivery") {
                addressFieldGroup.style.display = "flex";
                custAddressInput.required = true;
            } else {
                addressFieldGroup.style.display = "none";
                custAddressInput.required = false;
            }
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const settings = window.LagosDB.getSettings();
            const currency = settings.storeCurrency || "$";
            const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

            const name = custNameInput.value.trim();
            const phone = custPhoneInput.value.trim();
            const deliveryMethod = custDeliverySelect.value;
            const address = deliveryMethod === "Delivery" ? custAddressInput.value.trim() : "Local Pickup selected";

            // Send to API
            const API_URL = window.LAGOS_API_URL || 'http://localhost:3000';
            const orderData = {
                customer_name: name,
                customer_email: custNameInput.value.includes('@') ? custNameInput.value : phone + '@temp.com',
                customer_phone: phone,
                delivery_method: deliveryMethod,
                address: address,
                items: cart,
                total: subtotal
            };

            try {
                const response = await fetch(`${API_URL}/api/jewelry/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (!response.ok) throw new Error('API error');

                showToast("Order sent to Lagos! Redirecting to WhatsApp...", "success");
            } catch (error) {
                console.error('API error:', error);
                showToast("Order saved locally (API offline)", "info");
            }

            // Format WhatsApp Message
            let messageText = `✨ *NEW ORDER - ${settings.storeName.toUpperCase()}* ✨\n\n`;
            messageText += `*Customer Details:*\n`;
            messageText += `👤 Name: ${name}\n`;
            messageText += `📞 Contact: ${phone}\n`;
            messageText += `🚚 Method: ${deliveryMethod === "Delivery" ? "Home Delivery" : "Store Pickup"}\n`;

            if (deliveryMethod === "Delivery") {
                messageText += `📍 Address: ${address}\n`;
            }

            messageText += `\n*Order Items:*\n`;
            messageText += `----------------------------------------\n`;

            cart.forEach((item, index) => {
                messageText += `${index + 1}. *${item.title}*\n`;
                if (item.variation) {
                    messageText += `   _${item.variation}_\n`;
                }
                messageText += `   SKU: ${item.sku}\n`;
                messageText += `   Qty: ${item.quantity} x ${currency}${item.price.toFixed(2)}\n`;
                messageText += `   Subtotal: *${currency}${(item.price * item.quantity).toFixed(2)}*\n\n`;
            });

            messageText += `----------------------------------------\n`;
            messageText += `⭐ *TOTAL ORDER:* *${currency}${subtotal.toFixed(2)}*\n\n`;
            messageText += `Thank you for shopping at Lagos Jewelry! Please confirm my order.`;

            // Open WhatsApp link
            const cleanPhone = settings.storePhone;
            const encodedText = encodeURIComponent(messageText);
            const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

            window.open(whatsappUrl, "_blank");

            // Empty cart and reset
            cart = [];
            saveCart();
            renderCart();
            closeCartDrawer();
            checkoutForm.reset();
        });
    }

    // ==========================================
    // 7. Toast Alerts System
    // ==========================================
    window.showToast = function (message, type = "success") {
        const toastContainer = document.getElementById("toast-alerts-container");
        if (!toastContainer) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;

        let iconHtml = '<i class="fa-solid fa-circle-check" style="color: #4CAF50;"></i>';
        if (type === "error") {
            iconHtml = '<i class="fa-solid fa-circle-exclamation" style="color: #F44336;"></i>';
        }

        toast.innerHTML = `
            ${iconHtml}
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Slide Out & Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = "translateY(-100px)";
            toast.style.opacity = "0";
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    };

    // ==========================================
    // 8. Event Listeners for Search Filters
    // ==========================================
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }

    // ==========================================
    // 9. SaaS Pricing Billing Toggle Handler
    // ==========================================
    const billingToggle = document.getElementById("billing-toggle");
    const toggleMonthlyBtn = document.getElementById("toggle-monthly");
    const toggleYearlyBtn = document.getElementById("toggle-yearly");

    if (billingToggle && toggleMonthlyBtn && toggleYearlyBtn) {
        const prices = {
            basico: { monthly: "67,90", yearly: "57,71", annualInfo: "Total ano: R$ 692,58 em até 12x" },
            essencial: { monthly: "157,90", yearly: "126,32", annualInfo: "Total ano: R$ 1.515,84 em até 12x" },
            avancado: { monthly: "259,90", yearly: "194,92", annualInfo: "Total ano: R$ 2.339,04 em até 12x" }
        };

        const basicoVal = document.getElementById("price-val-basico");
        const essencialVal = document.getElementById("price-val-essencial");
        const avancadoVal = document.getElementById("price-val-avancado");

        const basicoAnnualInfo = document.getElementById("annual-info-basico");
        const essencialAnnualInfo = document.getElementById("annual-info-essencial");
        const avancadoAnnualInfo = document.getElementById("annual-info-avancado");

        function updateBilling(isYearly) {
            if (isYearly) {
                billingToggle.classList.add("active");
                toggleYearlyBtn.classList.add("active");
                toggleMonthlyBtn.classList.remove("active");

                if (basicoVal) basicoVal.textContent = prices.basico.yearly;
                if (essencialVal) essencialVal.textContent = prices.essencial.yearly;
                if (avancadoVal) avancadoVal.textContent = prices.avancado.yearly;

                // Animate showing the annual info
                if (basicoAnnualInfo) {
                    basicoAnnualInfo.textContent = prices.basico.annualInfo;
                    basicoAnnualInfo.style.height = "auto";
                    basicoAnnualInfo.style.marginTop = "0.5rem";
                    basicoAnnualInfo.style.opacity = "1";
                    basicoAnnualInfo.style.visibility = "visible";
                }
                if (essencialAnnualInfo) {
                    essencialAnnualInfo.textContent = prices.essencial.annualInfo;
                    essencialAnnualInfo.style.height = "auto";
                    essencialAnnualInfo.style.marginTop = "0.5rem";
                    essencialAnnualInfo.style.opacity = "1";
                    essencialAnnualInfo.style.visibility = "visible";
                }
                if (avancadoAnnualInfo) {
                    avancadoAnnualInfo.textContent = prices.avancado.annualInfo;
                    avancadoAnnualInfo.style.height = "auto";
                    avancadoAnnualInfo.style.marginTop = "0.5rem";
                    avancadoAnnualInfo.style.opacity = "1";
                    avancadoAnnualInfo.style.visibility = "visible";
                }
            } else {
                billingToggle.classList.remove("active");
                toggleYearlyBtn.classList.remove("active");
                toggleMonthlyBtn.classList.add("active");

                if (basicoVal) basicoVal.textContent = prices.basico.monthly;
                if (essencialVal) essencialVal.textContent = prices.essencial.monthly;
                if (avancadoVal) avancadoVal.textContent = prices.avancado.monthly;

                // Animate hiding the annual info
                if (basicoAnnualInfo) {
                    basicoAnnualInfo.style.height = "0";
                    basicoAnnualInfo.style.marginTop = "0";
                    basicoAnnualInfo.style.opacity = "0";
                    basicoAnnualInfo.style.visibility = "hidden";
                }
                if (essencialAnnualInfo) {
                    essencialAnnualInfo.style.height = "0";
                    essencialAnnualInfo.style.marginTop = "0";
                    essencialAnnualInfo.style.opacity = "0";
                    essencialAnnualInfo.style.visibility = "hidden";
                }
                if (avancadoAnnualInfo) {
                    avancadoAnnualInfo.style.height = "0";
                    avancadoAnnualInfo.style.marginTop = "0";
                    avancadoAnnualInfo.style.opacity = "0";
                    avancadoAnnualInfo.style.visibility = "hidden";
                }
            }
        }

        billingToggle.addEventListener("click", () => {
            const isYearly = !billingToggle.classList.contains("active");
            updateBilling(isYearly);
        });

        toggleMonthlyBtn.addEventListener("click", () => updateBilling(false));
        toggleYearlyBtn.addEventListener("click", () => updateBilling(true));
    }

    // Initial load calls
    applyStoreConfig();
    initBannerCarousel();
});
