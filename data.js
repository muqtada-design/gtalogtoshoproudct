// البيانات الأولية لمنتجات الكتالوج
const INITIAL_PRODUCTS = [
    {
        id: "prod-water-330",
        itemCode: "1001",
        barcode: "6281007000999",
        name: "مياه شرب معبأة 330مل / Bottled Water 330ml",
        category: "مشروبات وعصائر",
        cartonPack: 24,
        unitRestriction: "carton-only", // 'both' | 'carton-only' | 'piece-only'
        image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4e?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "مياه شرب نقية نابعة من المصادر الطبيعية معبأة بأعلى معايير الجودة."
    },
    {
        id: "prod-1",
        itemCode: "1002",
        barcode: "6281007000018",
        name: "حليب كامل الدسم المراعي 1 لتر",
        category: "ألبان وأجبان",
        cartonPack: 12,
        image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "حليب بقر طازج مبسط كامل الدسم من شركة المراعي. تعبئة خاصة بالجملة والسوبرماركت."
    },
    {
        id: "prod-2",
        itemCode: "1003",
        barcode: "6281007000025",
        name: "عصير برتقال طبيعي نادك 1.5 لتر",
        category: "مشروبات وعصائر",
        cartonPack: 6,
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80",
        inStock: false,
        description: "عصير برتقال طبيعي 100% بدون إضافات سكر من نادك."
    },
    {
        id: "prod-3",
        itemCode: "1004",
        barcode: "6281007000032",
        name: "بسكويت دايجستف مكفيتيز 400 جم",
        category: "بسكويت وشوكولاتة",
        cartonPack: 24,
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "بسكويت دايجستف الأصلي المصنوع من القمح الكامل من مكفيتيز."
    },
    {
        id: "prod-4",
        itemCode: "1005",
        barcode: "6281007000049",
        name: "جبنة موزاريلا مبشورة البقرة الضاحكة 900 جم",
        category: "ألبان وأجبان",
        cartonPack: 10,
        image: "https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "جبنة موزاريلا مبشورة عالية الجودة وممتازة للبيتزا والمعجنات."
    },
    {
        id: "prod-5",
        itemCode: "1006",
        barcode: "6281007000056",
        name: "زيت زيتون بكر ممتاز السوسن 500 مل",
        category: "معلبات وزيوت",
        cartonPack: 12,
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "زيت زيتون فلسطيني بكر ممتاز معصور على البارد."
    },
    {
        id: "prod-6",
        itemCode: "1007",
        barcode: "6281007000063",
        name: "شوكولاتة نوتيلا 750 جم",
        category: "بسكويت وشوكولاتة",
        cartonPack: 6,
        image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "كريمة الشوكولاتة والبندق الشهيرة نوتيلا بالعبوة الاقتصادية."
    },
    {
        id: "prod-7",
        itemCode: "1008",
        barcode: "6281007000070",
        name: "مسحوق غسيل أرييل اتوماتيك 5 كجم",
        category: "منظفات",
        cartonPack: 4,
        image: "https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "مسحوق غسيل للغسالات الأوتوماتيكية بنظافة ناصعة ورائحة منشة."
    },
    {
        id: "prod-8",
        itemCode: "1009",
        barcode: "6281007000087",
        name: "مياه غازية كوكاكولا علب 330 مل",
        category: "مشروبات وعصائر",
        cartonPack: 24,
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "كرتون كوكاكولا علب معدنية منعشة حجم 330 مل."
    },
    {
        id: "prod-9",
        itemCode: "1010",
        barcode: "6281007000094",
        name: "تونا قودي لحم خفيف بالزيت 185 جم",
        category: "معلبات وزيوت",
        cartonPack: 48,
        image: "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "تونا قودي زعانف زرقاء فاخرة محفوظة بزيت دوار الشمس."
    },
    {
        id: "prod-10",
        itemCode: "1011",
        barcode: "6281007000100",
        name: "سائل جلي فيري بالليمون 1 لتر",
        category: "منظفات",
        cartonPack: 12,
        image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "منظف الصحون والأواني الأقوى بقوة الليمون المركز."
    }
];

const CATEGORIES = [
    "الكل",
    "ألبان وأجبان",
    "مشروبات وعصائر",
    "معلبات وزيوت",
    "بسكويت وشوكولاتة",
    "منظفات"
];

const DEFAULT_SETTINGS = {
    merchantPhone: "9647735482884",
    adminPassword: "admin123"
};

// مفاتيح التخزين المحلي
const STORAGE_KEYS = {
    PRODUCTS: "wholesale_catalog_products_v2",
    ORDERS: "wholesale_catalog_orders_v2",
    SETTINGS: "wholesale_catalog_settings_v2"
};

// إدارة المنتجات في قاعدة البيانات المحلية
function getProducts() {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    let list = INITIAL_PRODUCTS;
    if (data) {
        try {
            list = JSON.parse(data);
        } catch (e) {
            console.error("Failed to parse products, resetting to initial:", e);
            list = INITIAL_PRODUCTS;
        }
    }
    // ضمان وجود كود سرّي مكون من 4 أرقام لكل منتج
    let modified = false;
    list = list.map((p, idx) => {
        if (!p.itemCode) {
            modified = true;
            p.itemCode = (1001 + idx).toString();
        }
        return p;
    });
    if (modified || !data) {
        saveProducts(list);
    }
    return list;
}

function saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

function resetProducts() {
    saveProducts(INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
}

// إدارة الطلبات في قاعدة البيانات المحلية
function getOrders() {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error("Failed to parse orders:", e);
        return [];
    }
}

function saveOrders(orders) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

function addOrder(order) {
    const orders = getOrders();
    orders.unshift(order); // إضافة الطلب الجديد في البداية
    saveOrders(orders);
    return order;
}

function updateOrderStatus(orderId, newStatus) {
    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        saveOrders(orders);
        return true;
    }
    return false;
}

function deleteOrder(orderId) {
    let orders = getOrders();
    orders = orders.filter(o => o.id !== orderId);
    saveOrders(orders);
}

// تهيئة وتنظيف رقم الواتساب بالصيغة الدولية
function cleanWhatsAppPhone(phone) {
    if (!phone || phone === "966500000000") return "9647735482884";
    let cleaned = phone.toString().replace(/\D/g, "");
    if (cleaned.startsWith("00")) {
        cleaned = cleaned.substring(2);
    }
    if (cleaned.startsWith("0")) {
        cleaned = "964" + cleaned.substring(1);
    }
    return cleaned || "9647735482884";
}

// إدارة إعدادات الموقع
function getSettings() {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
        saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
    }
    try {
        const parsed = JSON.parse(data);
        if (!parsed.merchantPhone || parsed.merchantPhone === "966500000000") {
            parsed.merchantPhone = "9647735482884";
            saveSettings(parsed);
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (e) {
        return DEFAULT_SETTINGS;
    }
}

function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}
