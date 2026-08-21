/**
 * Admin Panel & Product Management CMS Logic
 */

const adminState = {
    isAuthenticated: false,
    activeTab: "tab-products",
    productsSearch: "",
    orderStatusFilter: "ALL"
};

document.addEventListener("DOMContentLoaded", () => {
    initAdmin();
});

function initAdmin() {
    checkAdminAuth();
    setupAdminEventListeners();
}

// 1. التحقق من صلاحية الدخول
function checkAdminAuth() {
    const isAuth = sessionStorage.getItem("admin_authenticated") === "true";
    const loginModal = document.getElementById("admin-login-modal");
    const dashboard = document.getElementById("admin-dashboard");

    if (isAuth) {
        adminState.isAuthenticated = true;
        loginModal.classList.add("hidden");
        dashboard.classList.remove("hidden");
        loadAdminData();
    } else {
        adminState.isAuthenticated = false;
        loginModal.classList.remove("hidden");
        dashboard.classList.add("hidden");
    }
}

function handleLogin(e) {
    e.preventDefault();
    const inputPass = document.getElementById("admin-password-input").value;
    const settings = getSettings();

    if (inputPass === settings.adminPassword) {
        sessionStorage.setItem("admin_authenticated", "true");
        showToast("تم تسجيل الدخول بنجاح! مرحباً بك في لوحة التحكم.", "success");
        checkAdminAuth();
    } else {
        showToast("كلمة المرور غير صحيحة! يرجى إعادة المحاولة.", "warning");
    }
}

function handleLogout() {
    sessionStorage.removeItem("admin_authenticated");
    checkAdminAuth();
    showToast("تم قفل لوحة التحكم الإدارية.", "info");
}

// 2. تحميل وعرض البيانات اللحظية
function loadAdminData() {
    renderAdminProducts();
    renderAdminOrders();
    loadSettingsForm();
}

// 3. التبديل بين التبويبات (Tabs)
function switchTab(tabId) {
    adminState.activeTab = tabId;

    document.querySelectorAll(".btn-admin-tab").forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add("border-emerald-600", "text-emerald-700", "dark:text-emerald-400");
            btn.classList.remove("border-transparent", "text-slate-600", "dark:text-slate-400");
        } else {
            btn.classList.remove("border-emerald-600", "text-emerald-700", "dark:text-emerald-400");
            btn.classList.add("border-transparent", "text-slate-600", "dark:text-slate-400");
        }
    });

    document.querySelectorAll(".admin-tab-content").forEach(content => {
        if (content.id === tabId) {
            content.classList.remove("hidden");
        } else {
            content.classList.add("hidden");
        }
    });
}

// 4. إدارة المنتجات (CRUD)
function renderAdminProducts() {
    const tbody = document.getElementById("admin-products-tbody");
    if (!tbody) return;

    let products = getProducts();

    if (adminState.productsSearch.trim()) {
        const q = adminState.productsSearch.trim().toLowerCase();
        products = products.filter(p => 
            p.name.toLowerCase().includes(q) || 
            (p.itemCode && p.itemCode.toLowerCase().includes(q)) ||
            (p.barcode && p.barcode.toLowerCase().includes(q)) ||
            p.category.toLowerCase().includes(q)
        );
    }

    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-slate-400 font-semibold">
                    لا توجد منتجات مسجلة مطابقة للبحث
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(p => {
        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td class="p-3">
                    <div class="flex items-center gap-2.5">
                        <img src="${p.image}" alt="${p.name}" class="w-10 h-10 object-contain rounded-lg bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 flex-shrink-0" onerror="this.src='https://via.placeholder.com/80?text=منتج'">
                        <div class="flex flex-col">
                            <span class="font-bold text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-[300px]">${p.name}</span>
                            <span class="text-[10px] text-slate-400">ID: ${p.id}</span>
                        </div>
                    </div>
                </td>
                <td class="p-3 font-mono">
                    <span class="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold px-2 py-0.5 rounded-lg text-xs border border-amber-200 dark:border-amber-800">#${p.itemCode || '----'}</span>
                </td>
                <td class="p-3 font-semibold text-slate-600 dark:text-slate-300">${p.category}</td>
                <td class="p-3 font-bold text-emerald-700 dark:text-emerald-400">${p.cartonPack} قطعة</td>
                <td class="p-3 font-mono text-slate-500">${p.barcode || '—'}</td>
                <td class="p-3">
                    <button data-id="${p.id}" class="btn-toggle-stock px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${p.inStock ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 hover:bg-red-200'}">
                        ${p.inStock ? '✓ متوفر' : '✗ نفدت الكمية'}
                    </button>
                </td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                        <button data-id="${p.id}" class="btn-edit-prod p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors" title="تعديل">
                            <span class="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button data-id="${p.id}" class="btn-delete-prod p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors" title="حذف">
                            <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    attachProductsTableEvents();
}

function attachProductsTableEvents() {
    // تبديل حالة التوفر
    document.querySelectorAll(".btn-toggle-stock").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            let products = getProducts();
            const idx = products.findIndex(p => p.id === id);
            if (idx !== -1) {
                products[idx].inStock = !products[idx].inStock;
                saveProducts(products);
                renderAdminProducts();
                showToast(`تم تحديث حالة توفر المنتج: ${products[idx].name}`, "info");
            }
        });
    });

    // تعديل المنتج
    document.querySelectorAll(".btn-edit-prod").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            openSaveProductModal(id);
        });
    });

    // حذف المنتج
    document.querySelectorAll(".btn-delete-prod").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            let products = getProducts();
            const prod = products.find(p => p.id === id);
            if (prod && confirm(`هل أنت تأكد من حذف المنتج "${prod.name}" من الكتالوج؟`)) {
                products = products.filter(p => p.id !== id);
                saveProducts(products);
                renderAdminProducts();
                showToast("تم حذف المنتج من الكتالوج بنجاح", "success");
            }
        });
    });
}

function openSaveProductModal(productId = null) {
    const modal = document.getElementById("modal-product-form");
    const title = document.getElementById("prod-modal-title");
    const form = document.getElementById("form-save-product");

    form.reset();

    const products = getProducts();

    if (productId) {
        const p = products.find(item => item.id === productId);
        if (p) {
            title.textContent = "تعديل بيانات المنتج";
            document.getElementById("prod-id").value = p.id;
            document.getElementById("prod-item-code").value = p.itemCode || "";
            document.getElementById("prod-name").value = p.name;
            document.getElementById("prod-category").value = p.category;
            document.getElementById("prod-carton-pack").value = p.cartonPack;
            document.getElementById("prod-barcode").value = p.barcode || "";
            document.getElementById("prod-in-stock").value = p.inStock ? "true" : "false";
            document.getElementById("prod-unit-restriction").value = p.unitRestriction || "both";
            document.getElementById("prod-image").value = p.image || "";
            document.getElementById("prod-desc").value = p.description || "";
        }
    } else {
        title.textContent = "إضافة منتج جديد للكتالوج";
        document.getElementById("prod-id").value = "";
        const nextCode = (1001 + products.length).toString();
        document.getElementById("prod-item-code").value = nextCode;
        document.getElementById("prod-unit-restriction").value = "both";
    }

    modal.classList.remove("hidden");
}

function handleSaveProductSubmit(e) {
    e.preventDefault();

    const id = document.getElementById("prod-id").value;
    let itemCode = document.getElementById("prod-item-code").value.trim();
    const name = document.getElementById("prod-name").value.trim();
    const category = document.getElementById("prod-category").value;
    const cartonPack = parseInt(document.getElementById("prod-carton-pack").value) || 1;
    const barcode = document.getElementById("prod-barcode").value.trim();
    const inStock = document.getElementById("prod-in-stock").value === "true";
    const unitRestriction = document.getElementById("prod-unit-restriction").value || "both";
    const image = document.getElementById("prod-image").value.trim() || "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80";
    const description = document.getElementById("prod-desc").value.trim();

    let products = getProducts();

    if (!itemCode) {
        itemCode = (1001 + products.length).toString();
    }

    if (id) {
        // تحديث منتج قائم
        const idx = products.findIndex(p => p.id === id);
        if (idx !== -1) {
            products[idx] = { ...products[idx], itemCode, name, category, cartonPack, barcode, inStock, unitRestriction, image, description };
            showToast(`تم تعديل بيانات "${name}" بنجاح`, "success");
        }
    } else {
        // إضافة منتج جديد
        const newId = `prod-${Date.now()}`;
        const newProd = { id: newId, itemCode, name, category, cartonPack, barcode, inStock, unitRestriction, image, description };
        products.unshift(newProd);
        showToast(`تم إضافة المنتَج الجديد "${name}" [كود: #${itemCode}] بنجاح`, "success");
    }

    saveProducts(products);
    renderAdminProducts();
    document.getElementById("modal-product-form").classList.add("hidden");
}

    saveProducts(products);
    renderAdminProducts();
    document.getElementById("modal-product-form").classList.add("hidden");
}

// 5. إدارة جدول الطلبات الواردة (Orders Dashboard)
function renderAdminOrders() {
    const tbody = document.getElementById("admin-orders-tbody");
    if (!tbody) return;

    let orders = getOrders();

    // تحديث إحصائيات الطلبات
    updateOrderStats(orders);

    // تصفية حسب الحالة
    if (adminState.orderStatusFilter !== "ALL") {
        orders = orders.filter(o => o.status === adminState.orderStatusFilter);
    }

    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-slate-400 font-semibold">
                    لا توجد طلبات واردة حالياً
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.map(o => {
        const dateObj = new Date(o.createdAt);
        const formattedDate = dateObj.toLocaleDateString("ar-EG") + " " + dateObj.toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' });

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td class="p-3 font-bold text-slate-800 dark:text-white font-mono">${o.id}</td>
                <td class="p-3 text-slate-500 text-[11px]">${formattedDate}</td>
                <td class="p-3 font-bold text-slate-800 dark:text-white">${o.customerName}</td>
                <td class="p-3 font-mono font-semibold text-emerald-700 dark:text-emerald-400" dir="ltr">${o.customerPhone}</td>
                <td class="p-3 font-bold text-slate-700 dark:text-slate-300">${o.totalItemsCount || o.items.length} مواد</td>
                <td class="p-3">
                    <select data-id="${o.id}" class="select-order-status text-[11px] font-bold py-1 px-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-emerald-600 ${getStatusBadgeStyle(o.status)}">
                        <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>⏳ قيد الانتظار</option>
                        <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>🔵 مؤكد</option>
                        <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>✅ مكتمل</option>
                        <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>❌ ملغى</option>
                    </select>
                </td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                        <button data-id="${o.id}" class="btn-view-order p-1.5 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-lg transition-colors" title="عرض التفاصيل">
                            <span class="material-symbols-outlined text-base">visibility</span>
                        </button>
                        <a href="https://wa.me/${o.customerPhone}" target="_blank" class="p-1.5 text-[#25D366] hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-lg transition-colors" title="مراسلة الواتساب">
                            <span class="material-symbols-outlined text-base">chat</span>
                        </a>
                        <button data-id="${o.id}" class="btn-delete-order p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors" title="حذف الطلب">
                            <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    attachOrdersTableEvents();
}

function updateOrderStats(orders) {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'Pending').length;
    const completed = orders.filter(o => o.status === 'Completed').length;
    const confirmed = orders.filter(o => o.status === 'Confirmed').length;

    const elTotal = document.getElementById("stat-total-orders");
    const elPending = document.getElementById("stat-pending-orders");
    const elCompleted = document.getElementById("stat-completed-orders");
    const elConfirmed = document.getElementById("stat-confirmed-orders");
    const badgePendingNav = document.getElementById("badge-pending-orders");

    if (elTotal) elTotal.textContent = total;
    if (elPending) elPending.textContent = pending;
    if (elCompleted) elCompleted.textContent = completed;
    if (elConfirmed) elConfirmed.textContent = confirmed;
    if (badgePendingNav) badgePendingNav.textContent = pending;
}

function getStatusBadgeStyle(status) {
    switch (status) {
        case 'Pending': return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200';
        case 'Confirmed': return 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200';
        case 'Completed': return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200';
        case 'Cancelled': return 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200';
        default: return 'bg-slate-100 text-slate-800';
    }
}

function attachOrdersTableEvents() {
    // تغيير حالة الطلب
    document.querySelectorAll(".select-order-status").forEach(select => {
        select.addEventListener("change", (e) => {
            const id = e.target.dataset.id;
            const newStatus = e.target.value;
            if (updateOrderStatus(id, newStatus)) {
                renderAdminOrders();
                showToast(`تم تحديث حالة الطلب ${id} إلى "${newStatus}"`, "success");
            }
        });
    });

    // استعراض تفاصيل الطلب
    document.querySelectorAll(".btn-view-order").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            openOrderDetailModal(id);
        });
    });

    // حذف الطلب
    document.querySelectorAll(".btn-delete-order").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm(`هل أنت تأكد من حذف الطلب رقم ${id}؟`)) {
                deleteOrder(id);
                renderAdminOrders();
                showToast("تم حذف الطلب بنجاح", "info");
            }
        });
    });
}

function openOrderDetailModal(orderId) {
    const orders = getOrders();
    const o = orders.find(item => item.id === orderId);
    if (!o) return;

    document.getElementById("detail-order-title").textContent = `تفاصيل الطلب: ${o.id}`;
    document.getElementById("detail-customer-name").textContent = o.customerName;
    document.getElementById("detail-customer-phone").textContent = o.customerPhone;
    
    const d = new Date(o.createdAt);
    document.getElementById("detail-order-date").textContent = d.toLocaleDateString("ar-EG") + " " + d.toLocaleTimeString("ar-EG");
    document.getElementById("detail-order-notes").textContent = o.notes || "لا توجد ملاحظات";
    document.getElementById("btn-order-direct-whatsapp").href = `https://wa.me/${o.customerPhone}`;

    const itemsContainer = document.getElementById("detail-order-items-list");
    itemsContainer.innerHTML = o.items.map((it, idx) => {
        const codeText = it.itemCode ? ` <span class="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-mono font-bold px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 text-[11px] mr-1">[كود: #${it.itemCode}]</span>` : '';
        return `
            <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-700/60 p-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-600 gap-2">
                <div class="flex items-center gap-1 overflow-hidden">
                    <span class="font-bold text-slate-800 dark:text-white truncate">${idx + 1}. ${it.name}</span>
                    ${codeText}
                </div>
                <span class="font-bold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 bg-emerald-50 dark:bg-slate-800 rounded-lg flex-shrink-0">
                    ${it.unitLabel || `${it.quantity} قطعة`}
                </span>
            </div>
        `;
    }).join("");

    document.getElementById("modal-order-detail").classList.remove("hidden");
}

// 6. إدارة الإعدادات
function loadSettingsForm() {
    const settings = getSettings();
    document.getElementById("setting-merchant-phone").value = settings.merchantPhone || "";
    document.getElementById("setting-admin-password").value = settings.adminPassword || "admin123";
}

function handleSaveSettings() {
    const merchantPhone = document.getElementById("setting-merchant-phone").value.trim();
    const adminPassword = document.getElementById("setting-admin-password").value.trim();

    if (!merchantPhone || !adminPassword) {
        showToast("يرجى تعبئة كافة حقول الإعدادات بشكل صحيح.", "warning");
        return;
    }

    saveSettings({ merchantPhone, adminPassword });
    showToast("تم حفظ الإعدادات وكلمة المرور بنجاح!", "success");
}

// 7. ربط المستمعات العامة
function setupAdminEventListeners() {
    // تسجيل الدخول
    const loginForm = document.getElementById("form-admin-login");
    if (loginForm) loginForm.addEventListener("submit", handleLogin);

    // تسجيل الخروج
    const logoutBtn = document.getElementById("btn-admin-logout");
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

    // التنقل بين التبويبات
    document.querySelectorAll(".btn-admin-tab").forEach(btn => {
        btn.addEventListener("click", (e) => {
            switchTab(e.currentTarget.dataset.tab);
        });
    });

    // البحث في المنتجات
    const searchProdInput = document.getElementById("admin-products-search");
    if (searchProdInput) {
        searchProdInput.addEventListener("input", (e) => {
            adminState.productsSearch = e.target.value;
            renderAdminProducts();
        });
    }

    // إضافة منتج
    const openAddProdBtn = document.getElementById("btn-open-add-product");
    if (openAddProdBtn) {
        openAddProdBtn.addEventListener("click", () => openSaveProductModal());
    }

    // حفظ المنتَج
    const saveProdForm = document.getElementById("form-save-product");
    if (saveProdForm) saveProdForm.addEventListener("submit", handleSaveProductSubmit);

    // تصفية الطلبات
    const filterOrdersSelect = document.getElementById("select-order-status-filter");
    if (filterOrdersSelect) {
        filterOrdersSelect.addEventListener("change", (e) => {
            adminState.orderStatusFilter = e.target.value;
            renderAdminOrders();
        });
    }

    // حفظ الإعدادات
    const saveSettingsBtn = document.getElementById("btn-save-settings");
    if (saveSettingsBtn) saveSettingsBtn.addEventListener("click", handleSaveSettings);

    // إغلاق النوافذ
    document.querySelectorAll(".btn-close-modal").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.add("hidden"));
        });
    });
}

// 8. التنبيهات المنبثقة
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
