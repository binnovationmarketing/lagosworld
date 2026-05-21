/**
 * Lagos Jewelry - Administrative Controller
 * Handles CRUD operations, category management, settings updates, and sync.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Check if LagosDB is loaded
    if (!window.LagosDB) {
        console.error("Database layer (database.js) is required!");
        return;
    }

    // DOM Elements Cache
    const tabButtons = document.querySelectorAll(".admin-nav-btn");
    const sections = document.querySelectorAll(".admin-section");
    
    // Store Settings DOM Elements
    const inputStoreName = document.getElementById("input-store-name");
    const inputStoreLogo = document.getElementById("input-store-logo");
    const inputStorePhone = document.getElementById("input-store-phone");
    const inputStorePhoneDisplay = document.getElementById("input-store-phone-display");
    const inputStoreTheme = document.getElementById("input-store-theme");
    const saveSettingsBtn = document.getElementById("save-settings-btn");
    const storeSettingsForm = document.getElementById("store-settings-form");

    // Dynamic Header Elements
    const storeNameDisplays = [
        document.getElementById("store-name-display"),
    ];
    const logoPlaceholders = [
        document.getElementById("store-logo-placeholder"),
    ];

    // Categories DOM Elements
    const addCategoryForm = document.getElementById("add-category-form");
    const inputNewCategory = document.getElementById("input-new-category");
    const categoriesTableBody = document.getElementById("admin-categories-table-body");

    // Products CRUD DOM Elements
    const productsTableBody = document.getElementById("admin-products-table-body");
    const addProductBtn = document.getElementById("add-product-modal-trigger");
    const crudModal = document.getElementById("admin-product-modal");
    const crudModalClose = document.getElementById("admin-product-modal-close");
    const crudCancelBtn = document.getElementById("crud-cancel-btn");
    const crudForm = document.getElementById("product-crud-form");
    const crudModalTitle = document.getElementById("admin-modal-title");

    // Form inputs for CRUD
    const crudIdInput = document.getElementById("crud-product-id");
    const crudTitleInput = document.getElementById("crud-title");
    const crudSkuInput = document.getElementById("crud-sku");
    const crudCategorySelect = document.getElementById("crud-category");
    const crudPriceInput = document.getElementById("crud-price");
    const crudOriginalPriceInput = document.getElementById("crud-original-price");
    const crudImageInput = document.getElementById("crud-image");
    const crudDescriptionInput = document.getElementById("crud-description");
    const crudVarNameInput = document.getElementById("crud-var-name");
    const crudVarOptionsInput = document.getElementById("crud-var-options");

    // ==========================================
    // 1. Sidebar Tab Swapping Navigation
    // ==========================================
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            if (!targetTab) return;

            // Remove active states
            tabButtons.forEach(b => b.classList.remove("active"));
            sections.forEach(s => s.classList.remove("active"));

            // Add active states
            btn.classList.add("active");
            const targetSection = document.getElementById(`section-${targetTab}`);
            if (targetSection) targetSection.classList.add("active");
        });
    });

    // ==========================================
    // 2. Settings Management
    // ==========================================
    function loadSettings() {
        const settings = window.LagosDB.getSettings();
        if (!settings) return;

        // Apply settings into input fields
        inputStoreName.value = settings.storeName || "";
        inputStoreLogo.value = settings.storeLogo || "";
        inputStorePhone.value = settings.storePhone || "";
        inputStorePhoneDisplay.value = settings.storePhoneDisplay || "";
        inputStoreTheme.value = settings.storeTheme || "gold";

        // Update Theme styling dynamically on admin body
        document.body.className = "";
        document.body.classList.add(`theme-${settings.storeTheme}`);

        // Update dynamic headers
        storeNameDisplays.forEach(el => {
            if (el) el.textContent = settings.storeName;
        });

        logoPlaceholders.forEach(el => {
            if (el) {
                if (settings.storeLogo) {
                    el.innerHTML = `<img src="${settings.storeLogo}" alt="${settings.storeName}" class="logo-img">`;
                } else {
                    el.innerHTML = settings.storeName.charAt(0).toUpperCase();
                }
            }
        });
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener("click", () => {
            if (!storeSettingsForm.reportValidity()) return;

            // DDI Sanitizer for clean phone numbers (remove symbols)
            const rawPhone = inputStorePhone.value.trim();
            const cleanPhone = rawPhone.replace(/\D/g, "");

            const updatedSettings = {
                storeName: inputStoreName.value.trim(),
                storeLogo: inputStoreLogo.value.trim(),
                storePhone: cleanPhone,
                storePhoneDisplay: inputStorePhoneDisplay.value.trim(),
                storeTheme: inputStoreTheme.value
            };

            window.LagosDB.saveSettings(updatedSettings);
            loadSettings();
            showToast("Settings updated successfully!", "success");
        });
    }

    // ==========================================
    // 3. Category Management (CRUD)
    // ==========================================
    function renderCategoriesTable() {
        if (!categoriesTableBody) return;

        const categories = window.LagosDB.getCategories();
        
        categoriesTableBody.innerHTML = categories.map(cat => {
            const isProtected = cat === "All";
            return `
                <tr>
                    <td style="font-weight: 500;">${cat}</td>
                    <td>
                        ${isProtected ? 
                            `<span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">Protected</span>` : 
                            `<button class="action-badge delete" onclick="deleteCategoryTrigger('${cat}')">Delete</button>`
                        }
                    </td>
                </tr>
            `;
        }).join("");
    }

    // Add new Category handler
    if (addCategoryForm) {
        addCategoryForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const newCatName = inputNewCategory.value.trim();
            if (!newCatName) return;

            window.LagosDB.addCategory(newCatName);
            inputNewCategory.value = "";
            renderCategoriesTable();
            populateCategoryDropdowns();
            showToast(`Category "${newCatName}" added!`, "success");
        });
    }

    window.deleteCategoryTrigger = function(catName) {
        if (confirm(`Are you sure you want to delete category "${catName}"? Products inside this category will be re-assigned to "All".`)) {
            window.LagosDB.deleteCategory(catName);
            renderCategoriesTable();
            populateCategoryDropdowns();
            renderProductsTable();
            showToast("Category removed.", "error");
        }
    };

    // ==========================================
    // 4. Products CRUD (Add, Edit, Delete)
    // ==========================================
    function renderProductsTable() {
        if (!productsTableBody) return;

        const products = window.LagosDB.getProducts();
        const settings = window.LagosDB.getSettings();
        const currency = settings.storeCurrency || "$";

        if (products.length === 0) {
            productsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        No products inside the catalog. Add one now!
                    </td>
                </tr>
            `;
            return;
        }

        productsTableBody.innerHTML = products.map(p => {
            return `
                <tr>
                    <td>
                        <img src="${p.image}" alt="${p.title}" class="admin-table-img" onerror="this.src='https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=150&auto=format&fit=crop'">
                    </td>
                    <td style="font-family: monospace; font-size: 0.8rem;">${p.sku}</td>
                    <td style="font-weight: 500;">${p.title}</td>
                    <td><span style="font-size:0.75rem; background-color:var(--bg-main); padding:0.25rem 0.6rem; border-radius:var(--radius-sm); font-weight:600;">${p.category}</span></td>
                    <td style="font-weight:700; color:var(--primary);">${currency}${p.price.toFixed(2)}</td>
                    <td>
                        <div style="display:flex; gap:0.5rem;">
                            <button class="action-badge edit" onclick="openEditProductModal('${p.id}')">Edit</button>
                            <button class="action-badge delete" onclick="deleteProductTrigger('${p.id}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // Fill selects in product forms
    function populateCategoryDropdowns() {
        if (!crudCategorySelect) return;

        const categories = window.LagosDB.getCategories();
        crudCategorySelect.innerHTML = categories.map(cat => {
            return `<option value="${cat}">${cat}</option>`;
        }).join("");
    }

    // Modal opens & triggers
    function openModal() {
        crudModal.classList.add("active");
    }

    function closeModal() {
        crudModal.classList.remove("active");
        crudForm.reset();
        crudIdInput.value = "";
    }

    if (addProductBtn) {
        addProductBtn.addEventListener("click", () => {
            crudModalTitle.textContent = "Add New Product";
            crudIdInput.value = ""; // clear ID to specify creating
            populateCategoryDropdowns();
            openModal();
        });
    }

    if (crudModalClose) crudModalClose.addEventListener("click", closeModal);
    if (crudCancelBtn) crudCancelBtn.addEventListener("click", closeModal);
    
    // Close modal if user clicks outside content
    crudModal.addEventListener("click", (e) => {
        if (e.target === crudModal) closeModal();
    });

    // CRUD edit click triggers
    window.openEditProductModal = function(id) {
        const product = window.LagosDB.getProductById(id);
        if (!product) return;

        crudModalTitle.textContent = "Edit Jewelry Piece";
        crudIdInput.value = product.id;
        
        populateCategoryDropdowns();

        // Populate form values
        crudTitleInput.value = product.title || "";
        crudSkuInput.value = product.sku || "";
        crudCategorySelect.value = product.category || "All";
        crudPriceInput.value = product.price || "";
        crudOriginalPriceInput.value = product.originalPrice || "";
        crudImageInput.value = product.image || "";
        crudDescriptionInput.value = product.description || "";

        // Fill variations options
        if (product.variations) {
            crudVarNameInput.value = product.variations.name || "";
            crudVarOptionsInput.value = product.variations.options.join(", ") || "";
        } else {
            crudVarNameInput.value = "";
            crudVarOptionsInput.value = "";
        }

        openModal();
    };

    window.deleteProductTrigger = function(id) {
        const product = window.LagosDB.getProductById(id);
        if (!product) return;

        if (confirm(`Are you sure you want to delete "${product.title}" from the catalog?`)) {
            window.LagosDB.deleteProduct(id);
            renderProductsTable();
            showToast("Product deleted.", "error");
        }
    };

    // Product form submission (both creates & updates)
    if (crudForm) {
        crudForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // Extract variations
            const varName = crudVarNameInput.value.trim();
            const varOptionsRaw = crudVarOptionsInput.value.trim();
            let variations = null;

            if (varName && varOptionsRaw) {
                // Split comma separated list and clean strings
                const options = varOptionsRaw.split(",").map(opt => opt.trim()).filter(opt => opt.length > 0);
                if (options.length > 0) {
                    variations = {
                        name: varName,
                        options: options
                    };
                }
            }

            const productData = {
                title: crudTitleInput.value.trim(),
                sku: crudSkuInput.value.trim(),
                category: crudCategorySelect.value,
                price: parseFloat(crudPriceInput.value),
                originalPrice: crudOriginalPriceInput.value ? parseFloat(crudOriginalPriceInput.value) : null,
                image: crudImageInput.value.trim() || "images/placeholder.png",
                description: crudDescriptionInput.value.trim(),
                variations: variations
            };

            const productId = crudIdInput.value;

            if (productId) {
                // UPDATE operation
                window.LagosDB.updateProduct(productId, productData);
                showToast("Product updated successfully!", "success");
            } else {
                // CREATE operation
                window.LagosDB.addProduct(productData);
                showToast("Product created and added to catalog!", "success");
            }

            closeModal();
            renderProductsTable();
        });
    }

    // ==========================================
    // 5. Toast Notification System
    // ==========================================
    window.showToast = function(message, type = "success") {
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

        // Transition Out & Remove after 3s
        setTimeout(() => {
            toast.style.transform = "translateY(-100px)";
            toast.style.opacity = "0";
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    };

    // Initial administrative setups
    loadSettings();
    renderCategoriesTable();
    renderProductsTable();
});
