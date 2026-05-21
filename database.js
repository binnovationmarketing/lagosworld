/**
 * Lagos Jewelry - Database Management System
 * Persists catalog and configuration data using LocalStorage.
 */

const DEFAULT_SETTINGS = {
    storeName: "Lagos Jewelry",
    storePhone: "12156262345", // Clean number for WhatsApp API
    storePhoneDisplay: "(215) 626-2345",
    storeLogo: "", // Dynamically generated text logo if empty
    storeCurrency: "$",
    storeTheme: "gold" // "gold" | "dark" | "rose"
};

const DEFAULT_CATEGORIES = ["All", "Rings", "Earrings", "Necklaces", "Bracelets"];

const DEFAULT_PRODUCTS = [
    {
        id: "prod-001",
        title: "18k Gold Plated Solitaire Ring",
        sku: "RING-SOL-001",
        category: "Rings",
        price: 79.90,
        originalPrice: 99.90,
        description: "A classic luxury solitaire ring featuring a brilliant round-cut sparkling cubic zirconia, precision-set in high-polish 18k yellow gold plating. Hypoallergenic and perfect for special occasions or everyday luxury.",
        variations: {
            name: "Size",
            options: ["6", "7", "8", "9"]
        },
        image: "images/solitaire_ring.png"
    },
    {
        id: "prod-002",
        title: "Oval Emerald Stud Earrings",
        sku: "EAR-EME-002",
        category: "Earrings",
        price: 120.00,
        originalPrice: null,
        description: "Stunning royal emerald-green crystals surrounded by a halo of micro-pave zirconia, beautifully plated in premium white gold. Designed to catch light with every movement.",
        variations: {
            name: "Finish",
            options: ["White Gold", "Yellow Gold"]
        },
        image: "images/emerald_earrings.png"
    },
    {
        id: "prod-003",
        title: "Infinity Heart Pendant Necklace",
        sku: "NEC-INF-003",
        category: "Necklaces",
        price: 85.00,
        originalPrice: null,
        description: "An elegant and romantic adjustable necklace featuring a shimmering infinity symbol intertwined with a polished 18k gold-plated heart. Symbolizes eternal love and sophistication.",
        variations: null,
        image: "images/heart_necklace.png"
    },
    {
        id: "prod-004",
        title: "Eternity Diamond Tennis Bracelet",
        sku: "BRA-TEN-004",
        category: "Bracelets",
        price: 150.00,
        originalPrice: 180.00,
        description: "A classic showstopper. This elegant tennis bracelet features a continuous line of hand-set sparkling crystals on a highly-polished white gold plated chain with a secure safety clasp.",
        variations: {
            name: "Length",
            options: ["6.5 in", "7.0 in", "7.5 in"]
        },
        image: "images/tennis_bracelet.png"
    },
    {
        id: "prod-005",
        title: "18k Gold Classic Hoop Earrings",
        sku: "EAR-HOO-005",
        category: "Earrings",
        price: 65.00,
        originalPrice: 75.00,
        description: "Sleek, lightweight, and versatile classic hoops in high-polish yellow gold plating. Features a secure click-top closure, perfect for adding effortless glamour to any outfit.",
        variations: {
            name: "Size",
            options: ["20mm", "30mm", "40mm"]
        },
        image: "images/gold_hoops.png"
    },
    {
        id: "prod-006",
        title: "Dainty Cultured Pearl Drop Necklace",
        sku: "NEC-PEA-006",
        category: "Necklaces",
        price: 95.00,
        originalPrice: null,
        description: "Features a hand-selected freshwater cultured pearl suspended on a delicate, adjustable 18k gold-plated sterling silver chain. A timeless classic that exudes elegance.",
        variations: null,
        image: "images/pearl_necklace.png"
    },
    {
        id: "prod-007",
        title: "Stacked Twist Band Ring",
        sku: "RING-TWI-007",
        category: "Rings",
        price: 45.00,
        originalPrice: 55.00,
        description: "Exquisite textured rope twist pattern ring, heavily plated in yellow gold. A versatile piece perfect for wearing solo or stacking with other rings.",
        variations: {
            name: "Size",
            options: ["6", "7", "8"]
        },
        image: "images/twist_ring.png"
    },
    {
        id: "prod-008",
        title: "Boho Feather Cuff Bracelet",
        sku: "BRA-FEA-008",
        category: "Bracelets",
        price: 110.00,
        originalPrice: null,
        description: "A beautifully detailed, adjustable feather-shaped wrap cuff bracelet plated in brilliant rhodium. Expresses freedom and bohemian elegance.",
        variations: null,
        image: "images/feather_cuff.png"
    }
];

class LagosDatabase {
    constructor() {
        this.init();
    }

    init() {
        // Initialize localStorage if keys do not exist
        if (!localStorage.getItem("lagos_settings")) {
            localStorage.setItem("lagos_settings", JSON.stringify(DEFAULT_SETTINGS));
        }
        if (!localStorage.getItem("lagos_categories")) {
            localStorage.setItem("lagos_categories", JSON.stringify(DEFAULT_CATEGORIES));
        }
        if (!localStorage.getItem("lagos_products")) {
            localStorage.setItem("lagos_products", JSON.stringify(DEFAULT_PRODUCTS));
        }
    }

    // Settings API
    getSettings() {
        return JSON.parse(localStorage.getItem("lagos_settings"));
    }

    saveSettings(settings) {
        localStorage.setItem("lagos_settings", JSON.stringify(settings));
        // Dispatch event for reactive updates in open tabs
        window.dispatchEvent(new Event("lagos_db_update"));
        return true;
    }

    // Categories API
    getCategories() {
        return JSON.parse(localStorage.getItem("lagos_categories"));
    }

    saveCategories(categories) {
        localStorage.setItem("lagos_categories", JSON.stringify(categories));
        window.dispatchEvent(new Event("lagos_db_update"));
        return true;
    }

    addCategory(category) {
        const categories = this.getCategories();
        if (!categories.includes(category)) {
            categories.push(category);
            this.saveCategories(categories);
        }
        return categories;
    }

    deleteCategory(category) {
        let categories = this.getCategories();
        if (category !== "All") {
            categories = categories.filter(c => c !== category);
            this.saveCategories(categories);
            
            // Re-assign products in deleted category to "All"
            const products = this.getProducts();
            products.forEach(p => {
                if (p.category === category) {
                    p.category = "All";
                }
            });
            this.saveProducts(products);
        }
        return categories;
    }

    // Products API
    getProducts() {
        return JSON.parse(localStorage.getItem("lagos_products"));
    }

    saveProducts(products) {
        localStorage.setItem("lagos_products", JSON.stringify(products));
        window.dispatchEvent(new Event("lagos_db_update"));
        return true;
    }

    getProductById(id) {
        const products = this.getProducts();
        return products.find(p => p.id === id);
    }

    addProduct(product) {
        const products = this.getProducts();
        const newProduct = {
            id: `prod-${Date.now()}`,
            title: product.title || "New Jewelry Piece",
            sku: product.sku || `SKU-${Date.now().toString().slice(-6)}`,
            category: product.category || "All",
            price: parseFloat(product.price) || 0.0,
            originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
            description: product.description || "",
            variations: product.variations || null,
            image: product.image || "images/placeholder.png"
        };
        products.push(newProduct);
        this.saveProducts(products);
        return newProduct;
    }

    updateProduct(id, updatedProduct) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = {
                ...products[index],
                ...updatedProduct,
                id: id // Ensure ID cannot be changed
            };
            this.saveProducts(products);
            return true;
        }
        return false;
    }

    deleteProduct(id) {
        const products = this.getProducts();
        const filtered = products.filter(p => p.id !== id);
        if (filtered.length !== products.length) {
            this.saveProducts(filtered);
            return true;
        }
        return false;
    }
}

// Attach to window for global access
window.LagosDB = new LagosDatabase();
