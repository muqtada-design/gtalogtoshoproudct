/**
 * تطبيق الجملة السريعة - الكتالوج التفاعلي
 * Refactored logic for Customer Checkout, Order Persistence & WhatsApp Integration
 */

// حالة التطبيق العامة
const state = {
    products: [],
    categories: [],
    selectedCategory: "الكل",
    searchQuery: "",
    sortBy: "default",
    onlyInStock: false,
    cart: {}, // productId -> { product, cartonQty, pieceQty, unitType: 'carton'|'piece' }
    darkTheme: false,
    html5QrcodeScanner: null
};

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    loadThemePreference();
    loadCatalogData();
    setupEventListeners();
    renderCategories();
    renderProducts();
    updateCartUI();
    loadSavedCustomerInfo();
}

// 1. تحميل منتجات الكتالوج
function loadCatalogData() {
    state.products = getProducts();
    state.categories = CATEGORIES;
}

// 2. إدارة المظهر الداكن (Dark Mode)
function loadThemePreference() {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        state.darkTheme = true;
        document.documentElement.classList.add("dark");
        updateThemeIcon(true);
    } else {
        state.darkTheme = false;
        document.documentElement.classList.remove("dark");
        updateThemeIcon(false);
    }
}

function toggleTheme() {
    state.darkTheme = !state.darkTheme;
    if (state.darkTheme) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
        updateThemeIcon(true);
    } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
        updateThemeIcon(false);
    }
}

function updateThemeIcon(isDark) {
    const icon = document.getElementById("theme-icon");
    if (icon) {
        icon.textContent = isDark ? "light_mode" : "dark_mode";
    }
}

// 3. عرض شريط التصنيفات
function renderCategories() {
    const container = document.getElementById("categories-container");
    if (!container) return;

    container.innerHTML = state.categories.map(cat => {
        const isActive = cat === state.selectedCategory;
        const activeClasses = isActive 
            ? "bg-emerald-700 text-white shadow-sm font-bold border-emerald-700 dark:bg-emerald-600" 
            : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 border-slate-200 dark:border-slate-600 font-medium";
        
        return `
            <button data-category="${cat}" class="btn-category flex-shrink-0 px-4 py-2 text-xs rounded-xl border transition-all whitespace-nowrap ${activeClasses}">
                ${cat}
            </button>
        `;
    }).join("");

    // إضافة مستمع للأزرار
    document.querySelectorAll(".btn-category").forEach(btn => {
        btn.addEventListener("click", (e) => {
            state.selectedCategory = e.currentTarget.dataset.category;
            renderCategories();
            renderProducts();
        });
    });
}

// 4. تصفية وترتيب المنتجات
function getFilteredProducts() {
    let list = [...state.products];

    // تصفية حسب التصنيف
    if (state.selectedCategory !== "الكل") {
        list = list.filter(p => p.category === state.selectedCategory);
    }

    // تصفية المتوفر فقط
    if (state.onlyInStock) {
        list = list.filter(p => p.inStock);
    }

    // تصفية حسب البحث (اسم، كود، باركود، تصنيف)
    if (state.searchQuery.trim() !== "") {
        const q = state.searchQuery.trim().toLowerCase();
        list = list.filter(p => 
            p.name.toLowerCase().includes(q) || 
            (p.itemCode && p.itemCode.toLowerCase().includes(q)) ||
            (p.barcode && p.barcode.toLowerCase().includes(q)) ||
            p.category.toLowerCase().includes(q)
        );
    }

    // الترتيب
    if (state.sortBy === "name-asc") {
        list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    } else if (state.sortBy === "in-stock") {
        list.sort((a, b) => (b.inStock === a.inStock) ? 0 : b.inStock ? 1 : -1);
    }

    return list;
}

// 5. عرض شبكة المنتجات
function renderProducts() {
    const grid = document.getElementById("products-grid");
    const emptyState = document.getElementById("empty-state");
    const badge = document.getElementById("products-count-badge");
    const filtered = getFilteredProducts();

    if (badge) {
        badge.textContent = `العدد: ${filtered.length} منتج`;
    }

    if (filtered.length === 0) {
        grid.classList.add("hidden");
        emptyState.classList.remove("hidden");
        emptyState.classList.add("flex");
        return;
    }

    grid.classList.remove("hidden");
    emptyState.classList.add("hidden");
    emptyState.classList.remove("flex");

    grid.innerHTML = filtered.map(p => {
        const cartItem = state.cart[p.id] || { cartonQty: 0, pieceQty: 0, unitType: 'carton' };
        const inCart = (cartItem.cartonQty > 0 || cartItem.pieceQty > 0);
        
        // قيود الشراء (carton-only | piece-only | both)
        const restriction = p.unitRestriction || 'both';
        let currentUnitType = cartItem.unitType || (restriction === 'piece-only' ? 'piece' : 'carton');
        if (restriction === 'carton-only') currentUnitType = 'carton';
        if (restriction === 'piece-only') currentUnitType = 'piece';

        const isCarton = currentUnitType === 'carton';
        const isPiece = currentUnitType === 'piece';
        const currentQty = isCarton ? (cartItem.cartonQty || 0) : (cartItem.pieceQty || 0);

        // بادج التوفر / القيد (تم إخفاؤه بناءً على طلب المستخدم)
        let restrictionBadgeHtml = "";

        const stockBadgeHtml = p.inStock 
            ? `<span class="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">متوفر</span>`
            : `<span class="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-[10px] px-2 py-0.5 rounded-full font-bold">نفدت الكمية</span>`;

        return `
            <div class="article-card bg-white dark:bg-slate-800 rounded-2xl border ${inCart ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'} p-3 sm:p-4 flex flex-col justify-between transition-all duration-200 relative overflow-hidden">
                
                <div>
                    <!-- صورة المنتج والمعاينة -->
                    <div class="relative w-full h-32 sm:h-36 bg-slate-50 dark:bg-slate-900/50 rounded-xl overflow-hidden mb-2 cursor-pointer group btn-detail-modal" data-id="${p.id}">
                        <img src="${p.image}" alt="${p.name}" class="product-card-img w-full h-full object-contain p-2" loading="lazy" onerror="this.src='https://via.placeholder.com/300x300?text=منتج'">
                        <div class="absolute top-2 right-2 z-10">
                            ${stockBadgeHtml}
                        </div>
                    </div>

                    <!-- تفاصيل المنتج -->
                    <span class="text-[10px] text-slate-400 dark:text-slate-400 block mb-0.5 font-semibold">${p.category}</span>
                    <h3 class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 line-clamp-2 mb-1 leading-snug hover:text-emerald-700 cursor-pointer btn-detail-modal" data-id="${p.id}">
                        ${p.name}
                    </h3>
                    <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs text-emerald-600">inventory</span>
                        <span>تعبئة الكرتون: <strong>${p.cartonPack} قطعة</strong></span>
                    </div>

                    <!-- شارة قيد البيع (إن وجد) -->
                    ${restrictionBadgeHtml}
                </div>

                <!-- أزرار الإضافة والتعديل للكمية -->
                <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 mt-3 flex flex-col gap-2">
                    ${!p.inStock ? `
                        <button disabled class="w-full bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 text-xs font-semibold py-2.5 rounded-xl cursor-not-allowed">
                            غير متوفر حالياً
                        </button>
                    ` : `
                        <!-- تبديل العبوة (كرتون / قطعة) -->
                        <div class="bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl border border-slate-200 dark:border-slate-600 grid grid-cols-2 gap-1">
                            <button data-id="${p.id}" data-unit="carton" ${restriction === 'piece-only' ? 'disabled title="الشراء بالكارتون غير متوفر"' : ''} class="btn-card-unit-tab py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${isCarton ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-sm border border-slate-200 dark:border-slate-600' : restriction === 'piece-only' ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}">
                                كرتون
                            </button>

                            <button data-id="${p.id}" data-unit="piece" ${restriction === 'carton-only' ? 'disabled title="الشراء بالمفرد غير متوفر حالياً"' : ''} class="btn-card-unit-tab py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${isPiece ? 'bg-white dark:bg-slate-800 text-blue-800 dark:text-blue-300 shadow-sm border border-slate-200 dark:border-slate-600' : restriction === 'carton-only' ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}">
                                قطعة
                            </button>
                        </div>

                        <!-- عداد الكمية (زيادة / إنقاص) -->
                        <div class="flex items-center justify-between bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl border border-slate-200 dark:border-slate-600 min-h-[44px]">
                            <button data-id="${p.id}" class="btn-card-inc w-9 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center shadow-sm font-extrabold text-lg active:scale-90 transition-transform">
                                +
                            </button>

                            <span class="font-black text-sm text-slate-800 dark:text-slate-100 px-3">
                                ${currentQty}
                            </span>

                            <button data-id="${p.id}" class="btn-card-dec w-9 h-9 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center shadow-sm font-extrabold text-lg hover:bg-slate-50 active:scale-90 transition-transform">
                                -
                            </button>
                        </div>

                        <!-- بيان تفاصيل التعبئة الحالية -->
                        <div class="text-[10px] text-center font-bold text-slate-500 dark:text-slate-400">
                            ${isCarton ? `1 كارتون = ${p.cartonPack} قطعة` : `1 قطعة (مفرد)`}
                        </div>
                    `}
                </div>
            </div>
        `;
    }).join("");

    attachProductCardEvents();
}

function attachProductCardEvents() {
    // تفاصيل المنتج
    document.querySelectorAll(".btn-detail-modal").forEach(el => {
        el.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            openProductDetailModal(id);
        });
    });

    // اختيار تبويب كرتون / قطعة على الكارت مباشرة
    document.querySelectorAll(".btn-card-unit-tab").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            const targetUnit = e.currentTarget.dataset.unit;
            const product = state.products.find(p => p.id === id);
            if (!product) return;

            if (product.unitRestriction === 'carton-only' && targetUnit === 'piece') {
                showToast("الشراء بالمفرد غير متوفر حالياً لهذا المنتج (بيع بالكارتون فقط)", "warning");
                return;
            }
            if (product.unitRestriction === 'piece-only' && targetUnit === 'carton') {
                showToast("الشراء بالكارتون غير متوفر حالياً لهذا المنتج (بيع بالمفرد فقط)", "warning");
                return;
            }

            if (!state.cart[id]) {
                state.cart[id] = {
                    product: product,
                    cartonQty: targetUnit === 'carton' ? 1 : 0,
                    pieceQty: targetUnit === 'piece' ? 1 : 0,
                    unitType: targetUnit
                };
            } else {
                const item = state.cart[id];
                const oldQty = item.unitType === 'carton' ? (item.cartonQty || 1) : (item.pieceQty || 1);
                item.unitType = targetUnit;
                if (targetUnit === 'carton') {
                    item.cartonQty = oldQty || 1;
                    item.pieceQty = 0;
                } else {
                    item.pieceQty = oldQty || 1;
                    item.cartonQty = 0;
                }
            }
            renderProducts();
            updateCartUI();
        });
    });

    // زيادة الكمية (+1)
    document.querySelectorAll(".btn-card-inc").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            const product = state.products.find(p => p.id === id);
            if (!product) return;

            if (!state.cart[id]) {
                state.cart[id] = {
                    product: product,
                    cartonQty: 1,
                    pieceQty: 0,
                    unitType: 'carton'
                };
            } else {
                const item = state.cart[id];
                if (item.unitType === 'carton') {
                    item.cartonQty = (item.cartonQty || 0) + 1;
                } else {
                    item.pieceQty = (item.pieceQty || 0) + 1;
                }
            }
            renderProducts();
            updateCartUI();
        });
    });

    // إنقاص الكمية (-1)
    document.querySelectorAll(".btn-card-dec").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            if (state.cart[id]) {
                const item = state.cart[id];
                if (item.unitType === 'carton') {
                    item.cartonQty = Math.max(0, (item.cartonQty || 0) - 1);
                } else {
                    item.pieceQty = Math.max(0, (item.pieceQty || 0) - 1);
                }
                if ((item.cartonQty || 0) <= 0 && (item.pieceQty || 0) <= 0) {
                    delete state.cart[id];
                }
                renderProducts();
                updateCartUI();
            }
        });
    });
}

// 6. تحديث واجهة شريط العربة السفلي (Floating Cart Bar)
function updateCartUI() {
    const cartKeys = Object.keys(state.cart);
    const totalItems = cartKeys.reduce((sum, key) => {
        const item = state.cart[key];
        return sum + (item.unitType === 'carton' ? item.cartonQty : item.pieceQty);
    }, 0);

    const badge = document.getElementById("cart-badge-count");
    const subText = document.getElementById("cart-summary-sub");
    const checkoutItemsCount = document.getElementById("checkout-items-count");
    // New header badge inside modal
    const modalBadge = document.getElementById("checkout-items-count-badge");

    if (badge) {
        badge.textContent = cartKeys.length;
        badge.classList.remove("bounce-cart-anim");
        void badge.offsetWidth; // trigger reflow
        badge.classList.add("bounce-cart-anim");
    }
    if (subText) subText.textContent = `${cartKeys.length} مواد مختارة في العربة (${totalItems} كميات)`;
    if (checkoutItemsCount) checkoutItemsCount.textContent = cartKeys.length;
    if (modalBadge) modalBadge.textContent = cartKeys.length;

    renderCartItemsList();
}

// 7. عرض عناصر العربة داخل نافذة Checkout Modal
function renderCartItemsList() {
    const container = document.getElementById("cart-items-list");
    if (!container) return;

    const keys = Object.keys(state.cart);

    // Update summary totals
    const summaryEl = document.getElementById("cart-order-summary");
    const totalCartonsEl = document.getElementById("cart-total-cartons");
    const totalPiecesEl = document.getElementById("cart-total-pieces");
    if (summaryEl) {
        const totalCartons = keys.reduce((s, k) => s + (state.cart[k].cartonQty || 0), 0);
        const totalPieces = keys.reduce((s, k) => s + (state.cart[k].pieceQty || 0), 0);
        if (totalCartonsEl) totalCartonsEl.textContent = totalCartons;
        if (totalPiecesEl) totalPiecesEl.textContent = totalPieces;
        summaryEl.classList.toggle("hidden", keys.length === 0);
    }

    if (keys.length === 0) {
        container.innerHTML = `
            <div class="py-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span class="material-symbols-outlined text-5xl block mb-3 text-slate-300">shopping_bag</span>
                <p class="text-sm font-bold text-slate-500 dark:text-slate-400">عربة الطلب فارغة</p>
                <p class="text-xs text-slate-400 mt-1">اختر منتجات من الكتالوج لإضافتها للعربة</p>
            </div>
        `;
        return;
    }

    container.innerHTML = keys.map(id => {
        const item = state.cart[id];
        const p = item.product;
        const cartonQty = item.cartonQty || 0;
        const pieceQty = item.pieceQty || 0;
        const packLabel = p.cartonPackLabel || 'كرتون';
        const pieceLabel = p.pieceLabel || 'قطعة';

        return `
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden">
                <!-- Row 1: Image + Info + Delete -->
                <div class="flex gap-3 p-3">
                    <div class="w-[76px] h-[76px] flex-shrink-0 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden">
                        <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<div class=\'w-full h-full flex items-center justify-center text-2xl\'>📦</div>'">
                    </div>
                    <div class="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                        <h4 class="font-bold text-[14px] leading-snug text-slate-800 dark:text-slate-100">${p.name}</h4>
                        <p class="text-[12px] text-slate-500 dark:text-slate-400">تعبئة: <span class="font-semibold">${p.cartonPack}</span> حبة/${packLabel}</p>
                        ${p.itemCode ? `<span class="text-[10px] text-slate-400 font-mono">#${p.itemCode}</span>` : ''}
                    </div>
                    <button data-id="${p.id}" class="modal-remove-item flex-shrink-0 self-start w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 active:scale-90 transition-all">
                        <span class="material-symbols-outlined" style="font-size:20px">delete</span>
                    </button>
                </div>
                <!-- Divider -->
                <div class="h-px bg-slate-100 dark:bg-slate-700 mx-3"></div>
                <!-- Row 2: Dual Steppers -->
                <div class="flex gap-2 p-3">
                    <!-- كرتون -->
                    <div class="flex-1 flex flex-col gap-1.5">
                        <div class="flex justify-center">
                            <span class="bg-emerald-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full">${packLabel}</span>
                        </div>
                        <div class="flex items-center bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 h-[46px] overflow-hidden">
                            <button data-id="${p.id}" class="btn-carton-inc w-[46px] h-full flex items-center justify-center text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-600 active:scale-90 transition-all">
                                <span class="material-symbols-outlined" style="font-size:22px">add</span>
                            </button>
                            <span class="flex-1 text-center font-black text-[20px] text-slate-800 dark:text-white tabular-nums">${cartonQty}</span>
                            <button data-id="${p.id}" class="btn-carton-dec w-[46px] h-full flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-90 transition-all">
                                <span class="material-symbols-outlined" style="font-size:22px">remove</span>
                            </button>
                        </div>
                    </div>
                    <!-- Separator -->
                    <div class="w-px bg-slate-200 dark:bg-slate-700 self-stretch my-1"></div>
                    <!-- قطعة -->
                    <div class="flex-1 flex flex-col gap-1.5">
                        <div class="flex justify-center">
                            <span class="text-[11px] font-bold text-blue-600 dark:text-blue-400 px-3 py-0.5 border border-blue-200 dark:border-blue-800 rounded-full bg-blue-50 dark:bg-blue-950/30">${pieceLabel}</span>
                        </div>
                        <div class="flex items-center bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 h-[46px] overflow-hidden">
                            <button data-id="${p.id}" class="btn-piece-inc w-[46px] h-full flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 active:scale-90 transition-all">
                                <span class="material-symbols-outlined" style="font-size:22px">add</span>
                            </button>
                            <span class="flex-1 text-center font-black text-[20px] text-slate-800 dark:text-white tabular-nums">${pieceQty}</span>
                            <button data-id="${p.id}" class="btn-piece-dec w-[46px] h-full flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-90 transition-all">
                                <span class="material-symbols-outlined" style="font-size:22px">remove</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    // المستمعات للكرتون والقطعة والحذف
    document.querySelectorAll(".btn-carton-inc").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            if (state.cart[id]) {
                state.cart[id].cartonQty = (state.cart[id].cartonQty || 0) + 1;
                renderProducts();
                updateCartUI();
            }
        });
    });

    document.querySelectorAll(".btn-carton-dec").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            if (state.cart[id]) {
                state.cart[id].cartonQty = Math.max(0, (state.cart[id].cartonQty || 0) - 1);
                if ((state.cart[id].cartonQty || 0) <= 0 && (state.cart[id].pieceQty || 0) <= 0) {
                    delete state.cart[id];
                }
                renderProducts();
                updateCartUI();
            }
        });
    });

    document.querySelectorAll(".btn-piece-inc").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            if (state.cart[id]) {
                state.cart[id].pieceQty = (state.cart[id].pieceQty || 0) + 1;
                renderProducts();
                updateCartUI();
            }
        });
    });

    document.querySelectorAll(".btn-piece-dec").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            if (state.cart[id]) {
                state.cart[id].pieceQty = Math.max(0, (state.cart[id].pieceQty || 0) - 1);
                if ((state.cart[id].cartonQty || 0) <= 0 && (state.cart[id].pieceQty || 0) <= 0) {
                    delete state.cart[id];
                }
                renderProducts();
                updateCartUI();
            }
        });
    });

    document.querySelectorAll(".modal-remove-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            delete state.cart[id];
            renderProducts();
            updateCartUI();
        });
    });
}

// 8. إرسال الطلب، إنشاء فاتورة PDF المخصصة، والمراسلة عبر الواتساب والمشاركة الذكية
async function handleCheckoutAndWhatsApp() {
    const customerNameInput = document.getElementById("input-customer-name");
    const customerPhoneInput = document.getElementById("input-customer-phone");
    const notesInput = document.getElementById("input-order-notes");
    const checkoutBtn = document.getElementById("btn-send-whatsapp-modal");

    const customerName = customerNameInput ? customerNameInput.value.trim() : "";
    const customerPhone = customerPhoneInput ? customerPhoneInput.value.trim() : "";
    const notes = notesInput ? notesInput.value.trim() : "";

    const cartKeys = Object.keys(state.cart);

    if (cartKeys.length === 0) {
        showToast("العربة فارغة! يرجى اختيار منتجات أولاً.", "warning");
        return;
    }

    if (!customerName || !customerPhone) {
        showToast("يرجى إدخال اسم الزبون ورقم الهاتف لإكمال الطلب.", "warning");
        if (customerNameInput && !customerName) customerNameInput.focus();
        else if (customerPhoneInput && !customerPhone) customerPhoneInput.focus();
        return;
    }

    // تعطل زر الإرسال مع إظهار مؤشر التحميل لتجنب النقرات المتكررة
    let originalBtnHtml = "";
    if (checkoutBtn) {
        originalBtnHtml = checkoutBtn.innerHTML;
        checkoutBtn.disabled = true;
        checkoutBtn.style.opacity = "0.7";
        checkoutBtn.innerHTML = `
            <span class="material-symbols-outlined animate-spin" style="font-size:20px">sync</span>
            جاري تجهيز وتصدير الفاتورة...
        `;
    }

    let tempDiv = null;
    let orderId = "";
    let waUrl = "";

    try {
        // 1. توليد رقم طلب فريد وتجهيز البيانات
        const orderNum = Math.floor(1000 + Math.random() * 9000);
        orderId = `ORD-${orderNum}`;
        const now = new Date();
        const formattedDate = now.toLocaleDateString("ar-EG") + " " + now.toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' });

        const orderItems = cartKeys.map(id => {
            const item = state.cart[id];
            const p = item.product;
            const cartonQty = item.cartonQty || 0;
            const pieceQty = item.pieceQty || 0;
            
            let qtyParts = [];
            if (cartonQty > 0) qtyParts.push(`${cartonQty} كرتون`);
            if (pieceQty > 0) qtyParts.push(`${pieceQty} قطعة`);
            const qtyLabel = qtyParts.length > 0 ? qtyParts.join(" و ") : "1 كرتون";

            return {
                id: p.id,
                itemCode: p.itemCode || "",
                name: p.name,
                barcode: p.barcode || "",
                cartonQty: cartonQty,
                pieceQty: pieceQty,
                quantityLabel: qtyLabel,
                quantity: cartonQty > 0 ? cartonQty : pieceQty,
                unitLabel: qtyLabel,
                cartonPack: p.cartonPack
            };
        });

        // 2. حفظ الطلب في قاعدة البيانات المحلية (Persistent DB) والـ LocalStorage
        const newOrder = {
            id: orderId,
            customerName: customerName,
            customerPhone: customerPhone,
            notes: notes,
            items: orderItems,
            totalItemsCount: orderItems.length,
            createdAt: now.toISOString(),
            status: "Pending"
        };
        addOrder(newOrder);

        localStorage.setItem("wholesale_saved_customer_name", customerName);
        localStorage.setItem("wholesale_saved_customer_phone", customerPhone);

        // 3. تجهيز رابط واتساب التاجر
        const settings = getSettings();
        const rawPhone = settings.merchantPhone || "9647735482884";
        const merchantPhone = cleanWhatsAppPhone(rawPhone);

        const waText = 
`📦 *طلب كتالوج جديد مع فاتورة PDF*
🔢 *رقم الطلب:* ${orderId}
👤 *اسم الزبون:* ${customerName}
📱 *رقم الهاتف:* ${customerPhone}
📅 *التاريخ:* ${formattedDate}
--------------------------------
📎 *تم تحميل وتوليد ملف فاتورة الـ PDF المرفق بنجاح.*
يرجى إرفاق ملف الفاتورة المُنزل على جهازكم وتأكيد استلام الطلب!`;

        waUrl = `https://wa.me/${merchantPhone}?text=${encodeURIComponent(waText)}`;

        // 4. إنشاء عنصر الفاتورة في الـ DOM بشكل مرئي مؤقتاً خارج الشاشة (بدون display:none وبدون صور خارجية لتفادي التعليق CORS)
        tempDiv = document.createElement("div");
        tempDiv.id = "temp-pdf-export-container";
        tempDiv.style.position = "fixed";
        tempDiv.style.left = "-9999px";
        tempDiv.style.top = "0px";
        tempDiv.style.width = "750px";
        tempDiv.style.background = "#ffffff";
        tempDiv.style.zIndex = "-100";

        let tableRowsHtml = "";
        orderItems.forEach((it, idx) => {
            const bgClass = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
            tableRowsHtml += `
                <tr style="background-color: ${bgClass}; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 12px; text-align: center; font-weight: bold; color: #64748b;">${idx + 1}</td>
                    <td style="padding: 10px 12px; text-align: right;">
                        <div style="font-weight: bold; color: #0f172a;">${it.name}</div>
                        ${it.itemCode ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">كود المنتج: ${it.itemCode}</div>` : ''}
                    </td>
                    <td style="padding: 10px 12px; text-align: center; color: #475569;">${it.cartonPack} قطعة / كرتون</td>
                    <td style="padding: 10px 12px; text-align: center; font-weight: bold; color: #006c49; background-color: rgba(16, 185, 129, 0.05);">${it.quantityLabel}</td>
                </tr>
            `;
        });

        tempDiv.innerHTML = `
            <div style="padding: 28px; font-family: 'IBM Plex Sans Arabic', Arial, sans-serif; direction: rtl; color: #1e293b; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #006c49; padding-bottom: 16px; margin-bottom: 20px;">
                    <div>
                        <h1 style="font-size: 24px; font-weight: 800; color: #006c49; margin: 0 0 4px 0;">الجملة السريعة</h1>
                        <p style="font-size: 12px; color: #64748b; margin: 0;">كتالوج الطلبات الرقمية والفواتير الرسمية</p>
                    </div>
                    <div style="text-align: left; direction: ltr;">
                        <div style="font-size: 16px; font-weight: 800; color: #006c49;">#${orderId}</div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${formattedDate}</div>
                    </div>
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-size: 11px; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">اسم الزبون / المحل:</span>
                        <strong style="font-size: 14px; color: #0f172a;">${customerName}</strong>
                    </div>
                    <div style="text-align: left;">
                        <span style="font-size: 11px; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">رقم الهاتف:</span>
                        <strong style="font-size: 14px; color: #0f172a; font-family: monospace;">${customerPhone}</strong>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
                    <thead>
                        <tr style="background: #006c49; color: #ffffff;">
                            <th style="padding: 10px 12px; text-align: center; width: 36px;">#</th>
                            <th style="padding: 10px 12px; text-align: right;">المنتج</th>
                            <th style="padding: 10px 12px; text-align: center;">تعبئة الكرتون</th>
                            <th style="padding: 10px 12px; text-align: center;">الكمية المطلوبة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>

                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-top: 2px solid #f1f5f9; padding-top: 16px; margin-bottom: 20px;">
                    <div style="max-width: 60%;">
                        ${notes ? `<div style="font-size: 12px; color: #475569; background: #fffbebf5; border: 1px solid #fef3c7; padding: 8px 12px; border-radius: 8px;"><strong style="color: #92400e;">ملاحظات الطلب:</strong> ${notes}</div>` : ''}
                    </div>
                    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 12px 20px; text-align: center;">
                        <span style="font-size: 11px; font-weight: 700; color: #047857; display: block; margin-bottom: 2px;">إجمالي المواد</span>
                        <strong style="font-size: 18px; color: #065f46;">${orderItems.length} عنصر</strong>
                    </div>
                </div>

                <div style="text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 12px;">
                    شُكراً لتعاملكم مع الجملة السريعة ⚡ • الفاتورة مولدة إلكترونياً
                </div>
            </div>
        `;

        document.body.appendChild(tempDiv);

        // 5. التصدير الآمن مع مهلة زمنية (Timeout Safety 6 ثوانٍ) لمنع التعليق مطلقاً
        if (window.html2pdf) {
            const cleanCustomerName = customerName.replace(/[^a-zA-Z0-9آ-ي]/g, "_") || "عميل";
            const pdfFileName = `طلب_${cleanCustomerName}_${orderId}.pdf`;

            const opt = {
                margin: [8, 8, 8, 8],
                filename: pdfFileName,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 1.5, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            const pdfPromise = window.html2pdf().set(opt).from(tempDiv).save();

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("PDF generation timeout")), 6000);
            });

            await Promise.race([pdfPromise, timeoutPromise]);
            showToast(`تم تنزيل فاتورة الـ PDF (${orderId}) بنجاح!`, "success");
        } else {
            showToast(`تم تسجيل الطلب رقم ${orderId} بنجاح!`, "success");
        }

    } catch (err) {
        console.warn("تنويه أثناء تصدير الـ PDF (سيتم فتح الواتساب كالمعتاد):", err);
        showToast(`تم تسجيل الطلب رقم ${orderId}! جاري فتح واتساب...`, "info");
    } finally {
        // 6. التنظيف المضمون دائماً في كتلة finally
        if (tempDiv && tempDiv.parentNode) {
            tempDiv.parentNode.removeChild(tempDiv);
        }

        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.style.opacity = "1";
            if (originalBtnHtml) checkoutBtn.innerHTML = originalBtnHtml;
        }

        // تفريغ السلة والملاحظات
        state.cart = {};
        if (notesInput) notesInput.value = "";

        renderProducts();
        updateCartUI();
        closeAllModals();

        // فتح واتساب التاجر في نافذة جديدة
        if (waUrl) {
            setTimeout(() => {
                window.open(waUrl, "_blank");
            }, 300);
        }
    }
}

// 9. إعداد مستمعات الأحداث (Event Listeners)
function setupEventListeners() {
    // تبديل الوضع الداكن
    const themeBtn = document.getElementById("btn-theme-toggle");
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

    // الحفظ التلقائي الفوري لبيانات الزبون (الاسم والهاتف) عبر LocalStorage
    const customerNameInput = document.getElementById("input-customer-name");
    const customerPhoneInput = document.getElementById("input-customer-phone");

    if (customerNameInput) {
        customerNameInput.addEventListener("input", (e) => {
            localStorage.setItem("wholesale_saved_customer_name", e.target.value.trim());
            const badge = document.getElementById("cart-autosave-badge");
            if (badge) badge.classList.remove("hidden");
        });
    }

    if (customerPhoneInput) {
        customerPhoneInput.addEventListener("input", (e) => {
            localStorage.setItem("wholesale_saved_customer_phone", e.target.value.trim());
            const badge = document.getElementById("cart-autosave-badge");
            if (badge) badge.classList.remove("hidden");
        });
    }

    // حقل البحث
    const searchInput = document.getElementById("search-input");
    const clearSearchBtn = document.getElementById("btn-clear-search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            state.searchQuery = e.target.value;
            if (clearSearchBtn) {
                if (state.searchQuery) clearSearchBtn.classList.remove("hidden");
                else clearSearchBtn.classList.add("hidden");
            }
            renderProducts();
        });
    }
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener("click", () => {
            state.searchQuery = "";
            if (searchInput) searchInput.value = "";
            clearSearchBtn.classList.add("hidden");
            renderProducts();
        });
    }

    // الترتيب
    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            state.sortBy = e.target.value;
            renderProducts();
        });
    }

    // فتح وإغلاق العربة (Checkout Drawer)
    const openCheckoutBtn = document.getElementById("btn-open-checkout");
    if (openCheckoutBtn) {
        openCheckoutBtn.addEventListener("click", () => {
            openModal("modal-cart");
        });
    }

    // تأكيد وإرسال عبر الواتساب
    const sendWhatsappBtn = document.getElementById("btn-send-whatsapp-modal");
    if (sendWhatsappBtn) {
        sendWhatsappBtn.addEventListener("click", handleCheckoutAndWhatsApp);
    }

    // تفريغ العربة
    const clearCartBtn = document.getElementById("btn-clear-cart");
    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", () => {
            state.cart = {};
            renderProducts();
            updateCartUI();
            showToast("تم تفريغ عربة الطلبات", "info");
        });
    }

    // القائمة الجانبية (Side Menu)
    const openMenuBtn = document.getElementById("btn-open-menu");
    const closeMenuBtn = document.getElementById("btn-close-side-menu");
    const sideMenu = document.getElementById("side-menu");

    if (openMenuBtn && sideMenu) {
        openMenuBtn.addEventListener("click", () => sideMenu.classList.remove("hidden"));
    }
    if (closeMenuBtn && sideMenu) {
        closeMenuBtn.addEventListener("click", () => sideMenu.classList.add("hidden"));
    }

    const resetDataBtn = document.getElementById("menu-btn-reset-data");
    if (resetDataBtn) {
        resetDataBtn.addEventListener("click", () => {
            if (confirm("هل أنت تأكد من إعادة الكتالوج الافتراضي وتصفية التعديلات؟")) {
                resetProducts();
                loadCatalogData();
                renderCategories();
                renderProducts();
                showToast("تم إعادة الكتالوج الافتراضي بنجاح", "success");
                if (sideMenu) sideMenu.classList.add("hidden");
            }
        });
    }

    const onlyInstockBtn = document.getElementById("menu-btn-only-instock");
    if (onlyInstockBtn) {
        onlyInstockBtn.addEventListener("click", () => {
            state.onlyInStock = !state.onlyInStock;
            onlyInstockBtn.classList.toggle("bg-emerald-100");
            renderProducts();
            if (sideMenu) sideMenu.classList.add("hidden");
        });
    }

    // إغلاق النوافذ عند النقر على الأزرار المعنونة بـ btn-close-modal
    document.querySelectorAll(".btn-close-modal").forEach(btn => {
        btn.addEventListener("click", closeAllModals);
    });

    // ماسح الباركود
    const openBarcodeBtn = document.getElementById("btn-open-barcode");
    if (openBarcodeBtn) {
        openBarcodeBtn.addEventListener("click", () => {
            openModal("modal-barcode");
            startBarcodeScanner();
        });
    }

    const submitBarcodeBtn = document.getElementById("btn-submit-barcode");
    if (submitBarcodeBtn) {
        submitBarcodeBtn.addEventListener("click", () => {
            const input = document.getElementById("input-manual-barcode");
            if (input && input.value.trim()) {
                handleBarcodeScanned(input.value.trim());
            }
        });
    }

    // مستمعات النافذة الصغيرة لاختيار العبوة والكمية (كرتون / قطعة)
    const cartonOptBtn = document.getElementById("opt-unit-carton");
    const pieceOptBtn = document.getElementById("opt-unit-piece");
    const selectorIncBtn = document.getElementById("btn-selector-inc");
    const selectorDecBtn = document.getElementById("btn-selector-dec");
    const confirmAddUnitBtn = document.getElementById("btn-confirm-add-unit");

    if (cartonOptBtn) {
        cartonOptBtn.addEventListener("click", () => {
            selectorState.unitType = 'carton';
            updateUnitOptionButtonsUI();
        });
    }
    if (pieceOptBtn) {
        pieceOptBtn.addEventListener("click", () => {
            selectorState.unitType = 'piece';
            updateUnitOptionButtonsUI();
        });
    }
    if (selectorIncBtn) {
        selectorIncBtn.addEventListener("click", () => {
            selectorState.qty++;
            const qtyValEl = document.getElementById("selector-qty-val");
            if (qtyValEl) qtyValEl.textContent = selectorState.qty;
        });
    }
    if (selectorDecBtn) {
        selectorDecBtn.addEventListener("click", () => {
            selectorState.qty = Math.max(1, selectorState.qty - 1);
            const qtyValEl = document.getElementById("selector-qty-val");
            if (qtyValEl) qtyValEl.textContent = selectorState.qty;
        });
    }
    if (confirmAddUnitBtn) {
        confirmAddUnitBtn.addEventListener("click", () => {
            const pid = selectorState.productId;
            if (!pid) return;

            const product = state.products.find(p => p.id === pid);
            if (!product) return;

            if (!state.cart[pid]) {
                state.cart[pid] = {
                    product: product,
                    cartonQty: 0,
                    pieceQty: 0,
                    unitType: selectorState.unitType
                };
            }

            if (selectorState.unitType === 'carton') {
                state.cart[pid].cartonQty = (state.cart[pid].cartonQty || 0) + selectorState.qty;
            } else {
                state.cart[pid].pieceQty = (state.cart[pid].pieceQty || 0) + selectorState.qty;
            }
            state.cart[pid].unitType = selectorState.unitType;

            const unitLabel = selectorState.unitType === 'carton' ? 'كرتون' : 'قطعة';
            showToast(`تمت إضافة ${selectorState.qty} ${unitLabel} من "${product.name}" إلى السلة`, "success");

            closeAllModals();
            renderProducts();
            updateCartUI();
        });
    }
}

// حالة النافذة الصغيرة لاختيار العبوة (كرتون / قطعة)
let selectorState = {
    productId: null,
    unitType: 'carton',
    qty: 1
};

function openUnitSelectorModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    selectorState.productId = productId;
    
    // ضبط الوحدة الابتدائية بناءً على القيود
    const restriction = product.unitRestriction || 'both';
    if (restriction === 'piece-only') {
        selectorState.unitType = 'piece';
    } else {
        selectorState.unitType = 'carton';
    }
    selectorState.qty = 1;

    const imgEl = document.getElementById("selector-prod-img");
    const nameEl = document.getElementById("selector-prod-name");
    const packEl = document.getElementById("selector-prod-pack");
    const qtyValEl = document.getElementById("selector-qty-val");

    if (imgEl) imgEl.src = product.image;
    if (nameEl) nameEl.textContent = product.name;
    if (packEl) packEl.textContent = `تعبئة الكرتون: ${product.cartonPack} قطعة`;
    if (qtyValEl) qtyValEl.textContent = selectorState.qty;

    updateUnitOptionButtonsUI(restriction);
    openModal("modal-unit-selector");
}

function updateUnitOptionButtonsUI(restriction = 'both') {
    const cartonBtn = document.getElementById("opt-unit-carton");
    const pieceBtn = document.getElementById("opt-unit-piece");

    if (cartonBtn && pieceBtn) {
        // تعطيل الزر غير المتاح
        if (restriction === 'carton-only') {
            pieceBtn.disabled = true;
            pieceBtn.title = "الشراء بالمفرد غير متوفر حالياً";
            cartonBtn.disabled = false;
        } else if (restriction === 'piece-only') {
            cartonBtn.disabled = true;
            cartonBtn.title = "الشراء بالكارتون غير متوفر حالياً";
            pieceBtn.disabled = false;
        } else {
            cartonBtn.disabled = false;
            pieceBtn.disabled = false;
            cartonBtn.title = "";
            pieceBtn.title = "";
        }

        if (selectorState.unitType === 'carton') {
            cartonBtn.className = "unit-opt-btn border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 p-3 rounded-2xl flex flex-col items-center gap-1 transition-all shadow-sm font-bold";
            pieceBtn.className = restriction === 'carton-only' 
                ? "unit-opt-btn border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 p-3 rounded-2xl flex flex-col items-center gap-1 cursor-not-allowed opacity-60"
                : "unit-opt-btn border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 p-3 rounded-2xl flex flex-col items-center gap-1 transition-all";
        } else {
            pieceBtn.className = "unit-opt-btn border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 p-3 rounded-2xl flex flex-col items-center gap-1 transition-all shadow-sm font-bold";
            cartonBtn.className = restriction === 'piece-only'
                ? "unit-opt-btn border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 p-3 rounded-2xl flex flex-col items-center gap-1 cursor-not-allowed opacity-60"
                : "unit-opt-btn border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 p-3 rounded-2xl flex flex-col items-center gap-1 transition-all";
        }
    }
}

// 10. إدارة النوافذ المنبثقة (Modals)
function loadSavedCustomerInfo() {
    const customerNameInput = document.getElementById("input-customer-name");
    const customerPhoneInput = document.getElementById("input-customer-phone");
    const notesInput = document.getElementById("input-order-notes");
    const autosaveBadge = document.getElementById("cart-autosave-badge");

    const savedName = localStorage.getItem("wholesale_saved_customer_name") || "";
    const savedPhone = localStorage.getItem("wholesale_saved_customer_phone") || "";

    if (customerNameInput && savedName) {
        customerNameInput.value = savedName;
    }
    if (customerPhoneInput && savedPhone) {
        customerPhoneInput.value = savedPhone;
    }

    // أظهر بادج "تم الحفظ" إذا كانت هناك بيانات محفوظة
    if (autosaveBadge) {
        autosaveBadge.classList.toggle("hidden", !(savedName || savedPhone));
    }

    // حقل الملاحظات يبقى فارغاً دائماً مع كل فتح للسلة أو طلب جديد
    if (notesInput) {
        notesInput.value = "";
    }
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove("hidden");
        if (id === "modal-cart") {
            loadSavedCustomerInfo();
        }
    }
}

function closeAllModals() {
    document.querySelectorAll(".modal-backdrop").forEach(m => {
        if (m.id !== "side-menu") m.classList.add("hidden");
    });
    stopBarcodeScanner();
}

function openProductDetailModal(productId) {
    const p = state.products.find(item => item.id === productId);
    if (!p) return;

    document.getElementById("detail-prod-img").src = p.image;
    document.getElementById("detail-prod-name").textContent = p.name;
    document.getElementById("detail-prod-category").textContent = `التصنيف: ${p.category}`;
    document.getElementById("detail-prod-pack").textContent = `${p.cartonPack} قطعة في الكرتون`;
    document.getElementById("detail-prod-barcode").textContent = p.barcode || "غير مسجل";
    document.getElementById("detail-prod-desc").textContent = p.description || "لا يوجد وصف إضافي للمنتج.";

    const badge = document.getElementById("detail-prod-stock-badge");
    if (p.inStock) {
        badge.textContent = "متوفر";
        badge.className = "px-2.5 py-1 text-xs rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
    } else {
        badge.textContent = "نفدت الكمية";
        badge.className = "px-2.5 py-1 text-xs rounded-full font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }

    openModal("modal-product-detail");
}

// 11. ماسح الباركود (Barcode Scanner Integration)
function startBarcodeScanner() {
    if (typeof Html5QrcodeScanner === "undefined") return;

    const qrBox = document.getElementById("qr-reader");
    if (!qrBox) return;

    if (!state.html5QrcodeScanner) {
        state.html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 150 } },
            /* verbose= */ false
        );

        state.html5QrcodeScanner.render((decodedText) => {
            handleBarcodeScanned(decodedText);
        }, (error) => {
            // Ignore scan errors
        });
    }
}

function stopBarcodeScanner() {
    if (state.html5QrcodeScanner) {
        try {
            state.html5QrcodeScanner.clear();
        } catch (e) {}
        state.html5QrcodeScanner = null;
    }
}

function handleBarcodeScanned(code) {
    const matched = state.products.find(p => p.barcode === code.trim());
    closeAllModals();

    if (matched) {
        showToast(`تم العثور على المنتَج: ${matched.name}`, "success");
        state.searchQuery = code.trim();
        const searchInput = document.getElementById("search-input");
        if (searchInput) searchInput.value = code.trim();
        renderProducts();
    } else {
        showToast(`لم يتم العثور على منتج برقم الباركود: ${code}`, "warning");
    }
}

// 12. نظام التنبيهات المنبثقة (Toast Notification System)
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast-item ${type}`;
    
    let iconName = "info";
    if (type === "success") iconName = "check_circle";
    if (type === "warning") iconName = "warning";

    toast.innerHTML = `
        <span class="material-symbols-outlined text-base">${iconName}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
