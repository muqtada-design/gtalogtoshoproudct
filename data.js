// البيانات الأولية لمنتجات الكتالوج
const INITIAL_PRODUCTS = [
    {
        id: "prod-1",
        barcode: "6281007000018",
        name: "حليب كامل الدسم المراعي 1 لتر",
        category: "ألبان وأجبان",
        cartonPack: 12,
        image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "حليب بقر طازج مبسط كامل الدسم من شركة المراعي. تعبئة خاصة بالجملة والسوبرماركت.",
        unitPriceNote: "عرض كتالوج (بدون أسعار)"
    },
    {
        id: "prod-2",
        barcode: "6281007000025",
        name: "عصير برتقال طبيعي نادك 1.5 لتر",
        category: "مشروبات وعصائر",
        cartonPack: 6,
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80",
        inStock: false,
        description: "عصير برتقال طبيعي 100% بدون إضافات سكر من نادك.",
        unitPriceNote: "عرض كتالوج (بدون أسعار)"
    },
    {
        id: "prod-3",
        barcode: "6281007000032",
        name: "بسكويت دايجستف مكفيتيز 400 جم",
        category: "بسكويت وشوكولاتة",
        cartonPack: 24,
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "بسكويت دايجستف الأصلي المصنوع من القمح الكامل من مكفيتيز.",
        unitPriceNote: "عرض كتالوج (بدون أسعار)"
    },
    {
        id: "prod-4",
        barcode: "6281007000049",
        name: "جبنة موزاريلا مبشورة البقرة الضاحكة 900 جم",
        category: "ألبان وأجبان",
        cartonPack: 10,
        image: "https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "جبنة موزاريلا مبشورة عالية الجودة وممتازة للبيتزا والمعجنات.",
        unitPriceNote: "عرض كتالوج (بدون أسعار)"
    },
    {
        id: "prod-5",
        barcode: "6281007000056",
        name: "زيت زيتون بكر ممتاز السوسن 500 مل",
        category: "معلبات وزيوت",
        cartonPack: 12,
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "زيت زيتون فلسطيني بكر ممتاز معصور على البارد.",
        unitPriceNote: "عرض كتالوج (بدون أسعار)"
    },
    {
        id: "prod-6",
        barcode: "6281007000063",
        name: "شوكولاتة نوتيلا 750 جم",
        category: "بسكويت وشوكولاتة",
        cartonPack: 6,
        image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "كريمة الشوكولاتة والبندق الشهيرة نوتيلا بالعبوة الاقتصادية.",
        unitPriceNote: "عرض كتالوج (بدون أسعار)"
    },
    {
        id: "prod-7",
        barcode: "6281007000070",
        name: "مسحوق غسيل أرييل اتوماتيك 5 كجم",
        category: "منظفات",
        cartonPack: 4,
        image: "https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "مسحوق غسيل للغسالات الأوتوماتيكية بنظافة ناصعة ورائحة منشة.",
        unitPriceNote: "عرض كتالوج (بدون أسعار)"
    },
    {
        id: "prod-8",
        barcode: "6281007000087",
        name: "مياه غازية كوكاكولا علب 330 مل",
        category: "مشروبات وعصائر",
        cartonPack: 24,
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "كرتون كوكاكولا علب معدنية منعشة حجم 330 مل.",
        unitPriceNote: "عرض كتالوج (بدون أسعار)"
    },
    {
        id: "prod-9",
        barcode: "6281007000094",
        name: "تونا قودي لحم خفيف بالزيت 185 جم",
        category: "معلبات وزيوت",
        cartonPack: 48,
        image: "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "تونا قودي زعانف زرقاء فاخرة محفوظة بزيت دوار الشمس.",
        unitPriceNote: "عرض كتالوج (بدون أسعار)"
    },
    {
        id: "prod-10",
        barcode: "6281007000100",
        name: "سائل جلي فيري بالليمون 1 لتر",
        category: "منظفات",
        cartonPack: 12,
        image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80",
        inStock: true,
        description: "منظف الصحون والأواني الأقوى بقوة الليمون المركز.",
        unitPriceNote: "عرض كتالوج (بدون أسعار)"
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
