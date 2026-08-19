/**
 * الجملة السريعة - التطبيق التفاعلي (Quick Wholesale Catalog Web App)
 */

// STATE MANAGEMENT
const STATE = {
    products: [],
    cart: {}, // { prodId: { cartons: 0, pieces: 0 } }
    categories: typeof CATEGORIES !== 'undefined' ? CATEGORIES : ["الكل"],
    selectedCategory: "الكل",
    searchQuery: "",
    sortBy: "default",
    onlyInStock: false,
    darkMode: localStorage.getItem('theme') === 'dark',
    html5QrScanner: null
};

// DOM ELEMENTS
const DOM = {
    productsGrid: document.getElementById('products-grid'),
    emptyState: document.getElementById('empty-state'),
    categoriesContainer: document.getElementById('categories-container'),
    searchInput: document.getElementById('search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    productsCountBadge: document.getElementById('products-count-badge'),
    activeFilterLabel: document.getElementById('active-filter-label'),
    sortSelect: document.getElementById('sort-select'),
    
    // Bottom Bar & Cart
    bottomBar: document.getElementById('bottom-bar'),
    cartSummaryText: document.getElementById('cart-summary-text'),
    btnOpenCartModal: document.getElementById('btn-open-cart-modal'),
    btnCheckoutWhatsapp: document.getElementById('btn-checkout-whatsapp'),
    btnExportPdfBottom: document.getElementById('btn-export-pdf-bottom'),
    
    // Modals
    modalCart: document.getElementById('modal-cart'),
    cartItemsList: document.getElementById('cart-items-list'),
    inputShopName: document.getElementById('input-shop-name'),
    inputMerchantName: document.getElementById('input-merchant-name'),
    inputOrderNotes: document.getElementById('input-order-notes'),
    btnClearCart: document.getElementById('btn-clear-cart'),
    btnSendWhatsappModal: document.getElementById('btn-send-whatsapp-modal'),
    btnExportPdfModal: document.getElementById('btn-export-pdf-modal'),
    
    // Barcode Scanner Modal
    modalBarcode: document.getElementById('modal-barcode'),
    btnOpenBarcode: document.getElementById('btn-open-barcode'),
    inputManualBarcode: document.getElementById('input-manual-barcode'),
    btnSubmitBarcode: document.getElementById('btn-submit-barcode'),
    simulatedBarcodesList: document.getElementById('simulated-barcodes-list'),
    
    // Add Product Modal
    modalAddProduct: document.getElementById('modal-add-product'),
    btnOpenAddProduct: document.getElementById('btn-open-add-product'),
    formAddProduct: document.getElementById('form-add-product'),
    
    // Product Detail Modal
    modalProductDetail: document.getElementById('modal-product-detail'),
    detailProdImg: document.getElementById('detail-prod-img'),
    detailProdName: document.getElementById('detail-prod-name'),
    detailProdStockBadge: document.getElementById('detail-prod-stock-badge'),
    detailProdCategory: document.getElementById('detail-prod-category'),
    detailProdPack: document.getElementById('detail-prod-pack'),
    detailProdBarcode: document.getElementById('detail-prod-barcode'),
    detailProdDesc: document.getElementById('detail-prod-desc'),
    
    // Side Menu
    sideMenu: document.getElementById('side-menu'),
    btnOpenMenu: document.getElementById('btn-open-menu'),
    btnCloseSideMenu: document.getElementById('btn-close-side-menu'),
    menuBtnAddProduct: document.getElementById('menu-btn-add-product'),
    menuBtnOnlyInstock: document.getElementById('menu-btn-only-instock'),
    menuBtnResetData: document.getElementById('menu-btn-reset-data'),
    
    // Theme & Helpers
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    toastContainer: document.getElementById('toast-container'),
    btnResetFilters: document.getElementById('btn-reset-filters')
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadProducts();
    loadCart();
    renderCategories();
    renderProducts();
    updateCartUI();
    setupEventListeners();
    populateSampleBarcodes();
});

// THEME MANAGEMENT
function initTheme() {
    if (STATE.darkMode) {
        document.documentElement.classList.add('dark');
        DOM.themeIcon.textContent = 'light_mode';
    } else {
        document.documentElement.classList.remove('dark');
        DOM.themeIcon.textContent = 'dark_mode';
    }
}

function toggleTheme() {
    STATE.darkMode = !STATE.darkMode;
    localStorage.setItem('theme', STATE.darkMode ? 'dark' : 'light');
    initTheme();
    showToast(STATE.darkMode ? 'تم تفعيل الوضع الداكن 🌙' : 'تم تفعيل الوضع النهار ☀️', 'info');
}

// STORAGE MANAGERS
function loadProducts() {
    const saved = localStorage.getItem('wholesale_products');
    if (saved) {
        try {
            STATE.products = JSON.parse(saved);
        } catch (e) {
            STATE.products = [...INITIAL_PRODUCTS];
        }
    } else {
        STATE.products = typeof INITIAL_PRODUCTS !== 'undefined' ? [...INITIAL_PRODUCTS] : [];
    }
}

function saveProducts() {
    localStorage.setItem('wholesale_products', JSON.stringify(STATE.products));
}

function loadCart() {
    const saved = localStorage.getItem('wholesale_cart');
    if (saved) {
        try {
            STATE.cart = JSON.parse(saved);
        } catch (e) {
            STATE.cart = {};
        }
    }
}

function saveCart() {
    localStorage.setItem('wholesale_cart', JSON.stringify(STATE.cart));
}

// CATEGORIES RENDER
function renderCategories() {
    DOM.categoriesContainer.innerHTML = '';
    
    // Ensure all categories exist
    const categoryList = ["الكل", ...new Set(STATE.products.map(p => p.category))];
    
    categoryList.forEach(cat => {
        const btn = document.createElement('button');
        const isActive = cat === STATE.selectedCategory;
        
        btn.className = `whitespace-nowrap px-4 py-1.5 rounded-full font-semibold text-xs sm:text-sm transition-all border ${
            isActive 
                ? 'bg-primary text-white border-primary shadow-sm dark:bg-emerald-600 dark:border-emerald-600' 
                : 'bg-surface-container-low text-on-secondary-container hover:bg-surface-variant dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 border-outline-variant'
        }`;
        
        btn.textContent = cat;
        btn.addEventListener('click', () => {
            STATE.selectedCategory = cat;
            renderCategories();
            renderProducts();
        });
        
        DOM.categoriesContainer.appendChild(btn);
    });
}

// FILTER & SORT PRODUCTS
function getFilteredProducts() {
    return STATE.products.filter(p => {
        // Category filter
        if (STATE.selectedCategory !== "الكل" && p.category !== STATE.selectedCategory) {
            return false;
        }
        // Search Query filter (name, category, or barcode)
        if (STATE.searchQuery.trim() !== "") {
            const query = STATE.searchQuery.trim().toLowerCase();
            const matchName = p.name.toLowerCase().includes(query);
            const matchCat = p.category.toLowerCase().includes(query);
            const matchBarcode = p.barcode ? p.barcode.includes(query) : false;
            if (!matchName && !matchCat && !matchBarcode) return false;
        }
        // In-stock filter
        if (STATE.onlyInStock && !p.inStock) {
            return false;
        }
        return true;
    }).sort((a, b) => {
        if (STATE.sortBy === "name-asc") {
            return a.name.localeCompare(b.name, 'ar');
        } else if (STATE.sortBy === "in-stock") {
            return (b.inStock === a.inStock) ? 0 : b.inStock ? 1 : -1;
        }
        return 0;
    });
}

// RENDER PRODUCTS GRID
function renderProducts() {
    const products = getFilteredProducts();
    DOM.productsGrid.innerHTML = '';

    // Update stats count
    DOM.productsCountBadge.textContent = `${products.length} من أصل ${STATE.products.length} منتجات`;
    
    if (STATE.selectedCategory !== "الكل" || STATE.searchQuery !== "") {
        DOM.activeFilterLabel.classList.remove('hidden');
        DOM.activeFilterLabel.textContent = `• التصفية: ${STATE.selectedCategory !== "الكل" ? STATE.selectedCategory : ''} ${STATE.searchQuery ? `"${STATE.searchQuery}"` : ''}`;
    } else {
        DOM.activeFilterLabel.classList.add('hidden');
    }

    if (products.length === 0) {
        DOM.productsGrid.classList.add('hidden');
        DOM.emptyState.classList.remove('hidden');
        DOM.emptyState.classList.add('flex');
        return;
    } else {
        DOM.productsGrid.classList.remove('hidden');
        DOM.emptyState.classList.add('hidden');
        DOM.emptyState.classList.remove('flex');
    }

    products.forEach(prod => {
        const cartData = STATE.cart[prod.id] || { cartons: 0, pieces: 0 };
        const hasItemsInCart = cartData.cartons > 0 || cartData.pieces > 0;
        
        const card = document.createElement('article');
        card.className = `article-card bg-surface dark:bg-slate-800 rounded-2xl p-3 shadow-[0_4px_20px_rgba(30,41,59,0.05)] border border-slate-200 dark:border-slate-700 flex flex-col gap-3 transition-all duration-200 ${
            !prod.inStock ? 'opacity-75' : ''
        }`;

        card.innerHTML = `
            <div class="w-full aspect-square rounded-xl overflow-hidden bg-surface-container-lowest dark:bg-slate-900 relative cursor-pointer group-img">
                <img class="product-card-img w-full h-full object-cover" 
                     src="${prod.image}" 
                     alt="${prod.name}"
                     onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';"/>
                
                ${!prod.inStock ? `
                    <div class="absolute inset-0 bg-surface/60 dark:bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span class="bg-error-container text-on-error-container font-semibold text-xs px-3 py-1 rounded-full shadow-sm">
                            نفذت الكمية
                        </span>
                    </div>
                ` : ''}

                <div class="absolute top-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-md">
                    ${prod.category}
                </div>
            </div>

            <div class="flex flex-col gap-1">
                <h3 class="font-bold text-sm sm:text-base text-on-surface dark:text-slate-100 line-clamp-2 cursor-pointer hover:text-primary dark:hover:text-emerald-400 transition-colors title-btn">
                    ${prod.name}
                </h3>
                <span class="inline-block bg-surface-container-high dark:bg-slate-700 text-on-surface-variant dark:text-slate-300 font-semibold text-[11px] px-2 py-0.5 rounded-md w-fit">
                    تعبئة الكرتون: ${prod.cartonPack} حبة
                </span>
                <p class="text-[11px] text-secondary dark:text-slate-400 mt-0.5">
                    ${prod.unitPriceNote || 'عرض كتالوج (بدون أسعار)'}
                </p>
            </div>

            <div class="flex flex-col gap-2 mt-auto pt-2 border-t border-surface-variant dark:border-slate-700 ${!prod.inStock ? 'opacity-50 pointer-events-none' : ''}">
                <!-- Carton Counter -->
                <div class="flex items-center justify-between bg-emerald-50/80 dark:bg-slate-700/80 border border-emerald-200/60 dark:border-slate-600 rounded-xl p-1.5">
                    <span class="font-bold text-xs text-emerald-900 dark:text-emerald-300 pr-2">كرتون</span>
                    <div class="flex items-center gap-2">
                        <button class="btn-dec-carton w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm flex items-center justify-center hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 active:scale-90 transition-all border border-slate-200 dark:border-slate-600">
                            <span class="material-symbols-outlined text-[20px] font-bold">remove</span>
                        </button>
                        <span class="carton-count font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 min-w-[24px] text-center">
                            ${cartData.cartons}
                        </span>
                        <button class="btn-inc-carton w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm flex items-center justify-center hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 active:scale-90 transition-all border border-slate-200 dark:border-slate-600">
                            <span class="material-symbols-outlined text-[20px] font-bold">add</span>
                        </button>
                    </div>
                </div>

                <!-- Piece Counter -->
                <div class="flex items-center justify-between bg-blue-50/80 dark:bg-slate-700/80 border border-blue-200/60 dark:border-slate-600 rounded-xl p-1.5">
                    <span class="font-bold text-xs text-blue-900 dark:text-blue-300 pr-2">قطعة</span>
                    <div class="flex items-center gap-2">
                        <button class="btn-dec-piece w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm flex items-center justify-center hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 active:scale-90 transition-all border border-slate-200 dark:border-slate-600">
                            <span class="material-symbols-outlined text-[20px] font-bold">remove</span>
                        </button>
                        <span class="piece-count font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 min-w-[24px] text-center">
                            ${cartData.pieces}
                        </span>
                        <button class="btn-inc-piece w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm flex items-center justify-center hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 active:scale-90 transition-all border border-slate-200 dark:border-slate-600">
                            <span class="material-symbols-outlined text-[20px] font-bold">add</span>
                        </button>
                    </div>
                </div>

                <!-- Add Action Button -->
                ${prod.inStock ? `
                    <button class="btn-add-action w-full mt-1 font-semibold text-xs py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                        hasItemsInCart 
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600' 
                            : 'bg-primary dark:bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                    }">
                        <span class="material-symbols-outlined text-[18px]">${hasItemsInCart ? 'check' : 'add_shopping_cart'}</span>
                        <span>${hasItemsInCart ? 'تمت الإضافة للطلب' : 'إضافة للطلب'}</span>
                    </button>
                ` : `
                    <button disabled class="w-full mt-1 bg-slate-200 dark:bg-slate-700 text-slate-400 font-semibold text-xs py-2 rounded-xl cursor-not-allowed">
                        غير متوفر حالياً
                    </button>
                `}
            </div>
        `;

        // Image & Title Lightbox Click
        card.querySelector('.group-img').addEventListener('click', () => openProductDetail(prod));
        card.querySelector('.title-btn').addEventListener('click', () => openProductDetail(prod));

        // Counter Event Handlers
        if (prod.inStock) {
            card.querySelector('.btn-inc-carton').addEventListener('click', () => updateProductCartQty(prod.id, 1, 0));
            card.querySelector('.btn-dec-carton').addEventListener('click', () => updateProductCartQty(prod.id, -1, 0));
            card.querySelector('.btn-inc-piece').addEventListener('click', () => updateProductCartQty(prod.id, 0, 1));
            card.querySelector('.btn-dec-piece').addEventListener('click', () => updateProductCartQty(prod.id, 0, -1));
            card.querySelector('.btn-add-action').addEventListener('click', () => {
                const current = STATE.cart[prod.id] || { cartons: 0, pieces: 0 };
                if (current.cartons === 0 && current.pieces === 0) {
                    updateProductCartQty(prod.id, 1, 0); // Default to 1 carton
                    showToast(`تمت إضافة ${prod.name} (1 كرتون) للسلة`, 'success');
                } else {
                    openCartModal();
                }
            });
        }

        DOM.productsGrid.appendChild(card);
    });
}

// CART QUANTITY UPDATER
function updateProductCartQty(prodId, cartonDelta, pieceDelta) {
    if (!STATE.cart[prodId]) {
        STATE.cart[prodId] = { cartons: 0, pieces: 0 };
    }
    
    let newCartons = Math.max(0, STATE.cart[prodId].cartons + cartonDelta);
    let newPieces = Math.max(0, STATE.cart[prodId].pieces + pieceDelta);
    
    if (newCartons === 0 && newPieces === 0) {
        delete STATE.cart[prodId];
    } else {
        STATE.cart[prodId] = { cartons: newCartons, pieces: newPieces };
    }
    
    saveCart();
    renderProducts();
    updateCartUI();
}

// UPDATE CART UI SUMMARY
function updateCartUI() {
    let totalItems = 0;
    let totalCartons = 0;
    let totalPieces = 0;
    
    Object.keys(STATE.cart).forEach(id => {
        const item = STATE.cart[id];
        totalItems++;
        totalCartons += item.cartons;
        totalPieces += item.pieces;
    });

    if (totalItems > 0) {
        DOM.cartSummaryText.textContent = `السلة: ${totalItems} مواد مختارة (${totalCartons} كرتون ، ${totalPieces} قطعة)`;
        DOM.bottomBar.classList.remove('translate-y-full');
    } else {
        DOM.cartSummaryText.textContent = 'السلة: لا توجد مواد محددة';
    }
}

// CART MODAL RENDER
function renderCartModal() {
    DOM.cartItemsList.innerHTML = '';
    const itemIds = Object.keys(STATE.cart);

    if (itemIds.length === 0) {
        DOM.cartItemsList.innerHTML = `
            <div class="text-center py-8 text-slate-400">
                <span class="material-symbols-outlined text-4xl mb-2">shopping_bag</span>
                <p class="text-xs font-semibold">سلة الطلب فارغة حالياً</p>
                <p class="text-[11px] text-slate-500 mt-1">تصفح الكتالوج وأضف الكراتين المطلوبة للبدء</p>
            </div>
        `;
        return;
    }

    itemIds.forEach(id => {
        const prod = STATE.products.find(p => p.id === id);
        if (!prod) return;
        const item = STATE.cart[id];

        const row = document.createElement('div');
        row.className = "flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm";
        row.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${prod.image}" alt="${prod.name}" class="w-12 h-12 object-cover rounded-lg bg-slate-100 dark:bg-slate-800">
                <div>
                    <h4 class="font-bold text-xs text-slate-800 dark:text-slate-100 line-clamp-1">${prod.name}</h4>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">تعبئة: ${prod.cartonPack} حبة/كرتون</span>
                </div>
            </div>
            
            <div class="flex items-center gap-3 sm:gap-4">
                <!-- Carton Counter -->
                <div class="flex flex-col items-center">
                    <span class="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold mb-0.5">كرتون</span>
                    <div class="flex items-center gap-1.5 bg-emerald-50 dark:bg-slate-800 p-1 rounded-xl border border-emerald-200/50 dark:border-slate-600">
                        <button class="btn-modal-dec-c w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs hover:bg-emerald-600 hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-sm font-bold">remove</span>
                        </button>
                        <span class="font-extrabold text-xs sm:text-sm px-1 min-w-[18px] text-center">${item.cartons}</span>
                        <button class="btn-modal-inc-c w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs hover:bg-emerald-600 hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-sm font-bold">add</span>
                        </button>
                    </div>
                </div>

                <!-- Piece Counter -->
                <div class="flex flex-col items-center">
                    <span class="text-[10px] text-blue-700 dark:text-blue-300 font-bold mb-0.5">قطعة</span>
                    <div class="flex items-center gap-1.5 bg-blue-50 dark:bg-slate-800 p-1 rounded-xl border border-blue-200/50 dark:border-slate-600">
                        <button class="btn-modal-dec-p w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs hover:bg-blue-600 hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-sm font-bold">remove</span>
                        </button>
                        <span class="font-extrabold text-xs sm:text-sm px-1 min-w-[18px] text-center">${item.pieces}</span>
                        <button class="btn-modal-inc-p w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs hover:bg-blue-600 hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-sm font-bold">add</span>
                        </button>
                    </div>
                </div>

                <button class="btn-modal-remove text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-lg">delete</span>
                </button>
            </div>
        `;

        row.querySelector('.btn-modal-inc-c').addEventListener('click', () => {
            updateProductCartQty(id, 1, 0);
            renderCartModal();
        });
        row.querySelector('.btn-modal-dec-c').addEventListener('click', () => {
            updateProductCartQty(id, -1, 0);
            renderCartModal();
        });
        row.querySelector('.btn-modal-inc-p').addEventListener('click', () => {
            updateProductCartQty(id, 0, 1);
            renderCartModal();
        });
        row.querySelector('.btn-modal-dec-p').addEventListener('click', () => {
            updateProductCartQty(id, 0, -1);
            renderCartModal();
        });
        row.querySelector('.btn-modal-remove').addEventListener('click', () => {
            delete STATE.cart[id];
            saveCart();
            renderProducts();
            updateCartUI();
            renderCartModal();
            showToast('تم إزالة المنتج من السلة', 'warning');
        });

        DOM.cartItemsList.appendChild(row);
    });
}

// WHATSAPP ORDER GENERATOR
function checkoutWhatsApp() {
    const itemIds = Object.keys(STATE.cart);
    if (itemIds.length === 0) {
        showToast('السلة فارغة! الرجاء إضافة بعض المنتجات أولاً', 'warning');
        return;
    }

    // Generate and download PDF Invoice first
    exportOrderToPDF();

    const shopName = DOM.inputShopName.value.trim() || "عميل جملة";
    const merchantName = DOM.inputMerchantName.value.trim() || "غير محدد";
    const notes = DOM.inputOrderNotes.value.trim();

    let message = `🛒 *طلب جديد من موقع الجملة السريعة*\n`;
    message += `------------------------------------\n`;
    message += `📄 *ملاحظة:* تم تحميل ملف الفاتورة الرسمية بصيغة PDF على جهازي ومرفق لكم في المحادثة.\n`;
    message += `------------------------------------\n`;
    message += `🏪 *المحل/السوبرماركت:* ${shopName}\n`;
    message += `👤 *التاجر:* ${merchantName}\n`;
    message += `📅 *التاريخ:* ${new Date().toLocaleDateString('ar-SA')}\n`;
    message += `------------------------------------\n\n`;
    message += `📋 *ملخص الأصناف المطلوبة:*\n\n`;

    let totalCartons = 0;
    let totalPieces = 0;

    itemIds.forEach((id, index) => {
        const prod = STATE.products.find(p => p.id === id);
        if (!prod) return;
        const item = STATE.cart[id];
        
        totalCartons += item.cartons;
        totalPieces += item.pieces;

        message += `${index + 1}. *${prod.name}*\n`;
        message += `   تعبئة: ${prod.cartonPack} حبة/كرتون\n`;
        let qtyText = [];
        if (item.cartons > 0) qtyText.push(`[${item.cartons} كرتون]`);
        if (item.pieces > 0) qtyText.push(`[${item.pieces} قطعة]`);
        message += `   الكمية: ${qtyText.join(' + ')}\n\n`;
    });

    message += `------------------------------------\n`;
    message += `📊 *إجمالي الطلب:* ${totalCartons} كرتون و ${totalPieces} قطعة.\n`;
    if (notes) {
        message += `📝 *ملاحظات التوصيل:* ${notes}\n`;
    }
    message += `------------------------------------\n`;
    message += `📎 *مرفق لكم ملف الفاتورة PDF المجهّز في هذه المحادثة. شكرًا لك!*`;

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    
    setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        showToast('تم تحميل الفاتورة PDF! يرجى اختيار "إرفاق مستند" 📎 في الواتساب', 'success');
    }, 1000);
}

// PDF EXPORT GENERATOR
function exportOrderToPDF() {
    const itemIds = Object.keys(STATE.cart);
    if (itemIds.length === 0) {
        showToast('السلة فارغة! يرجى إضافة منتجات قبل إنشاء الفاتورة 📄', 'warning');
        return;
    }

    showToast('جاري إنشاء وتحضير ملف PDF...', 'info');

    const shopName = DOM.inputShopName.value.trim() || "عميل جملة";
    const merchantName = DOM.inputMerchantName.value.trim() || "غير محدد";
    const notes = DOM.inputOrderNotes.value.trim();
    const currentDate = new Date().toLocaleDateString('ar-SA');
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    let totalCartons = 0;
    let totalPieces = 0;

    let rowsHTML = '';
    itemIds.forEach((id, index) => {
        const prod = STATE.products.find(p => p.id === id);
        if (!prod) return;
        const item = STATE.cart[id];
        totalCartons += item.cartons;
        totalPieces += item.pieces;

        const totalProductUnits = (item.cartons * prod.cartonPack) + item.pieces;

        rowsHTML += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; text-align: center;">${index + 1}</td>
                <td style="padding: 10px; font-weight: bold; color: #1e293b;">${prod.name}</td>
                <td style="padding: 10px; text-align: center; color: #475569;">${prod.cartonPack} حبة/كرتون</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #006c49;">${item.cartons} كرتون</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #2563eb;">${item.pieces} قطعة</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; background: #f8fafc;">${totalProductUnits} حبة</td>
            </tr>
        `;
    });

    const pdfContainer = document.createElement('div');
    pdfContainer.id = 'pdf-export-container';
    pdfContainer.style.position = 'fixed';
    pdfContainer.style.left = '-9999px';
    pdfContainer.style.top = '0';
    pdfContainer.style.width = '790px';
    pdfContainer.style.padding = '24px';
    pdfContainer.style.backgroundColor = '#ffffff';
    pdfContainer.style.color = '#0f172a';
    pdfContainer.style.fontFamily = "'IBM Plex Sans Arabic', sans-serif";
    pdfContainer.style.direction = 'rtl';

    pdfContainer.innerHTML = `
        <div style="border: 2px solid #006c49; border-radius: 12px; padding: 24px; background: #ffffff;">
            <!-- PDF Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #006c49; padding-bottom: 16px; margin-bottom: 20px;">
                <div>
                    <h1 style="font-size: 24px; font-weight: 800; color: #006c49; margin: 0;">📦 الجملة السريعة</h1>
                    <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">قائمة طلب توريد بضائع جملة (Purchase Order)</p>
                </div>
                <div style="text-align: left;">
                    <span style="background: #006c49; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${orderId}</span>
                    <p style="font-size: 12px; color: #475569; margin: 6px 0 0 0;">📅 التاريخ: ${currentDate}</p>
                </div>
            </div>

            <!-- Merchant Info Box -->
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin-bottom: 20px; display: flex; justify-content: space-between;">
                <div>
                    <strong style="color: #166534; font-size: 13px;">🏪 المحل / السوبرماركت:</strong>
                    <span style="font-size: 14px; font-weight: bold; color: #0f172a; margin-right: 6px;">${shopName}</span>
                </div>
                <div>
                    <strong style="color: #166534; font-size: 13px;">👤 اسم التاجر:</strong>
                    <span style="font-size: 14px; font-weight: bold; color: #0f172a; margin-right: 6px;">${merchantName}</span>
                </div>
            </div>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #006c49; color: #ffffff;">
                        <th style="padding: 10px; border-radius: 0 6px 6px 0;">#</th>
                        <th style="padding: 10px; text-align: right;">اسم المنتج</th>
                        <th style="padding: 10px; text-align: center;">التعبئة</th>
                        <th style="padding: 10px; text-align: center;">الكراتين</th>
                        <th style="padding: 10px; text-align: center;">القطع</th>
                        <th style="padding: 10px; text-align: center; border-radius: 6px 0 0 6px;">إجمالي القطع</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHTML}
                </tbody>
            </table>

            <!-- Summary Box -->
            <div style="display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <div style="font-size: 13px;">
                    <span style="color: #64748b;">إجمالي الأصناف:</span>
                    <strong style="color: #0f172a; font-size: 14px; margin-right: 4px;">${itemIds.length} صنف</strong>
                </div>
                <div style="font-size: 14px; font-weight: bold; color: #006c49;">
                    <span>إجمالي الكراتين: </span>
                    <span style="background: #dcfce7; color: #15803d; padding: 2px 10px; border-radius: 6px;">${totalCartons} كرتون</span>
                </div>
                <div style="font-size: 14px; font-weight: bold; color: #2563eb;">
                    <span>إجمالي القطع المنفصلة: </span>
                    <span style="background: #dbeafe; color: #1d4ed8; padding: 2px 10px; border-radius: 6px;">${totalPieces} قطعة</span>
                </div>
            </div>

            ${notes ? `
                <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 12px; color: #92400e;">
                    <strong>📝 ملاحظات التوصيل والطلب:</strong> ${notes}
                </div>
            ` : ''}

            <!-- Footer -->
            <div style="margin-top: 24px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8;">
                تم توليد قائمة الطلبية بواسطة منصة "الجملة السريعة" ⚡
            </div>
        </div>
    `;

    document.body.appendChild(pdfContainer);

    const opt = {
        margin:       8,
        filename:     `طلب_جملة_${shopName.replace(/\s+/g, '_')}_${orderId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(pdfContainer).save().then(() => {
            document.body.removeChild(pdfContainer);
            showToast('تم تحميل قائمة المنتجات بصيغة PDF بنجاح 📄', 'success');
        }).catch(err => {
            console.error(err);
            document.body.removeChild(pdfContainer);
            window.print();
        });
    } else {
        document.body.removeChild(pdfContainer);
        window.print();
    }
}

// BARCODE SCANNER LOGIC
function openBarcodeModal() {
    DOM.modalBarcode.classList.remove('hidden');
    
    // Start QR reader
    try {
        if (!STATE.html5QrScanner && typeof Html5Qrcode !== 'undefined') {
            STATE.html5QrScanner = new Html5Qrcode("qr-reader");
            STATE.html5QrScanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 200, height: 150 } },
                (decodedText) => {
                    onBarcodeFound(decodedText);
                },
                (errorMessage) => {}
            ).catch(err => {
                document.getElementById('qr-reader').innerHTML = `
                    <div class="p-4 text-center text-slate-300">
                        <span class="material-symbols-outlined text-3xl mb-1">videocam_off</span>
                        <p>الكاميرا غير متوفرة أو لم يتم منح الإذن.</p>
                        <p class="text-[10px] text-slate-400 mt-1">يمكنك استخدام البحث بالرمز أسفله.</p>
                    </div>
                `;
            });
        }
    } catch(e) {}
}

function closeBarcodeModal() {
    DOM.modalBarcode.classList.add('hidden');
    if (STATE.html5QrScanner) {
        STATE.html5QrScanner.stop().catch(() => {}).finally(() => {
            STATE.html5QrScanner = null;
        });
    }
}

function onBarcodeFound(code) {
    closeBarcodeModal();
    DOM.searchInput.value = code;
    STATE.searchQuery = code;
    DOM.btnClearSearch.classList.remove('hidden');
    renderProducts();
    showToast(`تم مسح الباركود: ${code}`, 'success');
}

function populateSampleBarcodes() {
    DOM.simulatedBarcodesList.innerHTML = '';
    STATE.products.forEach(p => {
        if (p.barcode) {
            const chip = document.createElement('button');
            chip.className = "bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-md text-[10px] font-mono border border-slate-300 dark:border-slate-600 transition-colors";
            chip.textContent = `${p.name.substring(0, 10)}... (${p.barcode.slice(-4)})`;
            chip.addEventListener('click', () => onBarcodeFound(p.barcode));
            DOM.simulatedBarcodesList.appendChild(chip);
        }
    });
}

// PRODUCT DETAIL LIGHTBOX
function openProductDetail(prod) {
    DOM.detailProdImg.src = prod.image;
    DOM.detailProdName.textContent = prod.name;
    DOM.detailProdCategory.textContent = `التصنيف: ${prod.category}`;
    DOM.detailProdPack.textContent = `${prod.cartonPack} حبة لكل كرتون`;
    DOM.detailProdBarcode.textContent = prod.barcode || 'غير مسجل';
    DOM.detailProdDesc.textContent = prod.description || 'منتج جملة عالي الجودة متوفر للتوريد المباشر.';
    
    if (prod.inStock) {
        DOM.detailProdStockBadge.className = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-semibold px-2.5 py-1 text-xs rounded-full';
        DOM.detailProdStockBadge.textContent = 'متوفر في المستودع';
    } else {
        DOM.detailProdStockBadge.className = 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300 font-semibold px-2.5 py-1 text-xs rounded-full';
        DOM.detailProdStockBadge.textContent = 'نفذت الكمية';
    }

    DOM.modalProductDetail.classList.remove('hidden');
}

// MODAL CONTROLS
function openCartModal() {
    renderCartModal();
    DOM.modalCart.classList.remove('hidden');
}

function closeModals() {
    DOM.modalCart.classList.add('hidden');
    DOM.modalAddProduct.classList.add('hidden');
    DOM.modalProductDetail.classList.add('hidden');
    closeBarcodeModal();
}

// TOAST SYSTEM
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;
    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    if (type === 'warning') icon = 'warning';
    
    toast.innerHTML = `
        <span class="material-symbols-outlined text-base">${icon}</span>
        <span>${message}</span>
    `;
    
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// EVENT LISTENERS SETUP
function setupEventListeners() {
    // Theme Toggle
    DOM.btnThemeToggle.addEventListener('click', toggleTheme);

    // Search Box Events
    DOM.searchInput.addEventListener('input', (e) => {
        STATE.searchQuery = e.target.value;
        if (STATE.searchQuery) {
            DOM.btnClearSearch.classList.remove('hidden');
        } else {
            DOM.btnClearSearch.classList.add('hidden');
        }
        renderProducts();
    });

    DOM.btnClearSearch.addEventListener('click', () => {
        DOM.searchInput.value = '';
        STATE.searchQuery = '';
        DOM.btnClearSearch.classList.add('hidden');
        renderProducts();
    });

    DOM.btnResetFilters.addEventListener('click', () => {
        STATE.searchQuery = '';
        STATE.selectedCategory = 'الكل';
        STATE.onlyInStock = false;
        DOM.searchInput.value = '';
        DOM.btnClearSearch.classList.add('hidden');
        renderCategories();
        renderProducts();
    });

    // Sorting select
    DOM.sortSelect.addEventListener('change', (e) => {
        STATE.sortBy = e.target.value;
        renderProducts();
    });

    // Cart Modal & Checkout
    DOM.btnOpenCartModal.addEventListener('click', openCartModal);
    DOM.btnCheckoutWhatsapp.addEventListener('click', checkoutWhatsApp);
    DOM.btnSendWhatsappModal.addEventListener('click', checkoutWhatsApp);
    if (DOM.btnExportPdfBottom) DOM.btnExportPdfBottom.addEventListener('click', exportOrderToPDF);
    if (DOM.btnExportPdfModal) DOM.btnExportPdfModal.addEventListener('click', exportOrderToPDF);
    
    DOM.btnClearCart.addEventListener('click', () => {
        if (confirm('هل أنت تأكد من فرز وتفريغ السلة بالكامل؟')) {
            STATE.cart = {};
            saveCart();
            renderProducts();
            updateCartUI();
            renderCartModal();
            showToast('تم تفريغ السلة بنجاح', 'info');
        }
    });

    // Barcode Scanner Modal Events
    DOM.btnOpenBarcode.addEventListener('click', openBarcodeModal);
    DOM.btnSubmitBarcode.addEventListener('click', () => {
        const val = DOM.inputManualBarcode.value.trim();
        if (val) {
            onBarcodeFound(val);
        }
    });

    // Add Product Modal Events
    DOM.btnOpenAddProduct.addEventListener('click', () => {
        DOM.modalAddProduct.classList.remove('hidden');
    });

    DOM.formAddProduct.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-prod-name').value.trim();
        const category = document.getElementById('new-prod-category').value;
        const pack = parseInt(document.getElementById('new-prod-pack').value) || 12;
        const barcode = document.getElementById('new-prod-barcode').value.trim();
        const stock = document.getElementById('new-prod-stock').value === 'true';
        const img = document.getElementById('new-prod-image').value.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

        const newProd = {
            id: 'custom-prod-' + Date.now(),
            name,
            category,
            cartonPack: pack,
            barcode,
            inStock: stock,
            image: img,
            description: 'منتج مخصص تمت إضافته عبر إدارة الكتالوج.'
        };

        STATE.products.unshift(newProd);
        saveProducts();
        renderCategories();
        renderProducts();
        populateSampleBarcodes();
        closeModals();
        DOM.formAddProduct.reset();
        showToast(`تمت إضافة المنتَج "${name}" بنجاح للكتالوج 📦`, 'success');
    });

    // Close Modals buttons
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    // Side Menu Drawer Events
    DOM.btnOpenMenu.addEventListener('click', () => {
        DOM.sideMenu.classList.remove('hidden');
    });

    DOM.btnCloseSideMenu.addEventListener('click', () => {
        DOM.sideMenu.classList.add('hidden');
    });

    DOM.menuBtnAddProduct.addEventListener('click', () => {
        DOM.sideMenu.classList.add('hidden');
        DOM.modalAddProduct.classList.remove('hidden');
    });

    DOM.menuBtnOnlyInstock.addEventListener('click', () => {
        STATE.onlyInStock = !STATE.onlyInStock;
        DOM.sideMenu.classList.add('hidden');
        renderProducts();
        showToast(STATE.onlyInStock ? 'تم تفعيل التصفية: المتوفر فقط' : 'عرض جميع المنتجات', 'info');
    });

    DOM.menuBtnResetData.addEventListener('click', () => {
        if (confirm('هل تريد استعادة البيانات والمنتجات الافتراضية للكتالوج؟')) {
            localStorage.removeItem('wholesale_products');
            loadProducts();
            renderCategories();
            renderProducts();
            populateSampleBarcodes();
            DOM.sideMenu.classList.add('hidden');
            showToast('تمت إعادة الكتالوج للوضع الافتراضي', 'success');
        }
    });
}
