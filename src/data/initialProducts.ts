import { CategoryFilter, OrderRecord, PriceRangeFilter, Product, ProductReview, StoreSettings } from '../types';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'ModaNica - Tienda de Ropa',
  tagline: 'Plataforma Nacional de Ropa y Clósets • Compra y Vende en Toda Nicaragua',
  whatsappNumber: '', // Configurado por cada usuario al editar su tienda
  whatsappCustomGreeting: '¡Hola! 👋 Me gustaría realizar el siguiente pedido desde su tienda de ropa:',
  currencySymbol: 'C$',
  currencyCode: 'NIO',
  exchangeRate: 36.5, // 1 USD = ~36.5 Cordobas
  discountPercent: 20, // 20% discount across store
  shippingCost: 50,
  freeShippingThreshold: 450,
  adminPin: 'jordan#$29',
  instagramUrl: 'https://instagram.com',
  facebookUrl: 'https://facebook.com',
  tiktokUrl: 'https://tiktok.com',
  address: 'Managua, Nicaragua',
  bankName: '',
  bankAccount: '', // Configurado por cada vendedor para recibir su 97%
  bankAccountHolder: '',
  sellerWalletPhone: '',
  indriveEnabled: true,
  indriveEstimatedCost: 70,
  indrivePickupAddress: 'Punto de retiro acordado con la tienda',
  // 💰 Datos Oficiales del Dueño de la App (Comisión 3% y Monetización)
  platformFeePercent: 3,
  platformOwnerWallet: '+505 58898311',
  platformOwnerAccount: '134082049',
  platformOwnerBank: 'LAFISE'
};

export const PRICE_RANGE_FILTERS: PriceRangeFilter[] = [
  { id: 'all', label: 'Todos los precios', min: 0, max: null },
  { id: '10-50', label: 'C$ 10 - C$ 50', min: 10, max: 50 },
  { id: '50-100', label: 'C$ 50 - C$ 100', min: 50, max: 100 },
  { id: '100-200', label: 'C$ 100 - C$ 200', min: 100, max: 200 },
  { id: '200-500', label: 'C$ 200 - C$ 500', min: 200, max: 500 },
  { id: '500-plus', label: 'C$ 500+', min: 500, max: null }
];

export const PRODUCT_CATEGORIES: CategoryFilter[] = [
  'Todas',
  'Camisetas y Camisas',
  'Pantalones y Jeans',
  'Vestidos y Faldas',
  'Chaquetas y Abrigos',
  'Ropa para Niños',
  'Bolsas y Accesorios',
  'Deportiva y Playa'
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Camisetas Básicas',
    icon: '👕',
    price: 10,
    originalPrice: 15,
    category: 'Camisetas y Camisas',
    description: 'Camisetas de algodón suave de corte regular para uso diario. Variedad de tonos neutros y frescos.',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Blanco', 'Negro', 'Gris', 'Azul'],
    inStock: true,
    featured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1
  },
  {
    id: 'prod-2',
    name: 'Polos Casual',
    icon: '👕',
    price: 25,
    originalPrice: 35,
    category: 'Camisetas y Camisas',
    description: 'Camisas tipo polo con cuello estructurado y botones. Cómodas para el trabajo y salidas casuales.',
    images: [
      'https://images.unsplash.com/photo-1625910513413-5735b54d6829?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['M', 'L', 'XL'],
    colors: ['Azul Marino', 'Vino', 'Verde Bosque'],
    inStock: true,
    featured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2
  },
  {
    id: 'prod-3',
    name: 'Blusas Elegantes',
    icon: '👚',
    price: 45,
    originalPrice: 60,
    category: 'Camisetas y Camisas',
    description: 'Blusas femeninas con acabados delicados, ideales para oficina o eventos especiales.',
    images: [
      'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Perla', 'Lila', 'Rosa Pastel'],
    inStock: true,
    featured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3
  },
  {
    id: 'prod-4',
    name: 'Camisas de Algodón',
    icon: '👔',
    price: 65,
    originalPrice: 85,
    category: 'Camisetas y Camisas',
    description: 'Camisas manga larga y corta en tejido 100% algodón transpirable y resistente.',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Celeste', 'Blanco', 'Rayas'],
    inStock: true,
    featured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4
  },
  {
    id: 'prod-5',
    name: 'Pantalones Básicos',
    icon: '👖',
    price: 80,
    originalPrice: 105,
    category: 'Pantalones y Jeans',
    description: 'Pantalones rectos versátiles y duraderos para uso diario de excelente horma.',
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Negro', 'Beige', 'Gris'],
    inStock: true,
    featured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5
  },
  {
    id: 'prod-6',
    name: 'Jeans Clásicos',
    icon: '👖',
    price: 120,
    originalPrice: 160,
    category: 'Pantalones y Jeans',
    description: 'Denim de primera calidad con corte clásico y costuras reforzadas.',
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['28', '30', '32', '34'],
    colors: ['Azul Índigo', 'Azul Claro', 'Negro Lavado'],
    inStock: true,
    featured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6
  },
  {
    id: 'prod-7',
    name: 'Pantalones Casuales',
    icon: '👖',
    price: 95,
    originalPrice: 125,
    category: 'Pantalones y Jeans',
    description: 'Pantalones ligeros tipo chino y dockers de máxima frescura para el clima de Managua.',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['30', '32', '34', '36'],
    colors: ['Kaki', 'Oliva', 'Gris Plomo'],
    inStock: true,
    featured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7
  },
  {
    id: 'prod-8',
    name: 'Shorts de Algodón',
    icon: '🩳',
    price: 35,
    originalPrice: 50,
    category: 'Pantalones y Jeans',
    description: 'Shorts frescos con pretina elástica y cordón ajustable para días calurosos.',
    images: [
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Negro', 'Azul Marino', 'Gris'],
    inStock: true,
    featured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8
  },
  {
    id: 'prod-9',
    name: 'Vestidos Casuales',
    icon: '👗',
    price: 100,
    originalPrice: 130,
    category: 'Vestidos y Faldas',
    description: 'Vestidos cómodos con estampados alegres y telas frescas, perfectos para pasear y salidas informales.',
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Floral', 'Rojo', 'Azul Cielo'],
    inStock: true,
    featured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 9
  },
  {
    id: 'prod-10',
    name: 'Vestidos Elegantes',
    icon: '👗',
    price: 200,
    originalPrice: 260,
    category: 'Vestidos y Faldas',
    description: 'Vestidos de fiesta y corte fino con caída espectacular para ocasiones memorables.',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Negro Noche', 'Esmeralda', 'Vino Tinto'],
    inStock: true,
    featured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10
  },
  {
    id: 'prod-11',
    name: 'Faldas Midi',
    icon: '👗',
    price: 75,
    originalPrice: 95,
    category: 'Vestidos y Faldas',
    description: 'Faldas a media pierna con vuelo o plisadas, combinables con zapatillas o sandalias.',
    images: [
      'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Mostaza', 'Negro', 'Estampada'],
    inStock: true,
    featured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 11
  },
  {
    id: 'prod-12',
    name: 'Faldas Largas',
    icon: '👗',
    price: 110,
    originalPrice: 145,
    category: 'Vestidos y Faldas',
    description: 'Faldas largas estilo bohemio con telas ligeras y diseño vaporoso.',
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Terracota', 'Blanco', 'Floral'],
    inStock: true,
    featured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12
  },
  {
    id: 'prod-13',
    name: 'Chaquetas Casual',
    icon: '🧥',
    price: 150,
    originalPrice: 190,
    category: 'Chaquetas y Abrigos',
    description: 'Chaquetas ligeras de mezclilla o drill, el toque perfecto para complementar cualquier outfit.',
    images: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Denim Clásico', 'Negro', 'Verde Militar'],
    inStock: true,
    featured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 13
  },
  {
    id: 'prod-14',
    name: 'Abrigos Premium',
    icon: '🧥',
    price: 350,
    originalPrice: 450,
    category: 'Chaquetas y Abrigos',
    description: 'Abrigos y blazers estructurados de alta gama, confección impecable y forro térmico suave.',
    images: [
      'https://images.unsplash.com/photo-1539533018447-63fcce667883?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['M', 'L'],
    colors: ['Camel', 'Gris Carbón', 'Negro'],
    inStock: true,
    featured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14
  },
  {
    id: 'prod-15',
    name: 'Suéteres Básicos',
    icon: '🧶',
    price: 60,
    originalPrice: 85,
    category: 'Chaquetas y Abrigos',
    description: 'Suéteres tejidos de punto fino y suave al tacto, abrigadores y ligeros.',
    images: [
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Crema', 'Azul Marino', 'Rosa'],
    inStock: true,
    featured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15
  },
  {
    id: 'prod-16',
    name: 'Hoodies',
    icon: '🧶',
    price: 130,
    originalPrice: 170,
    category: 'Chaquetas y Abrigos',
    description: 'Sudaderas con capucha, bolsillo canguro y felpa interior para máxima comodidad.',
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Gris Jaspe', 'Negro', 'Blanco Hueso'],
    inStock: true,
    featured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 16
  },
  {
    id: 'prod-17',
    name: 'Ropa para Niños',
    icon: '👶',
    price: 20,
    originalPrice: 30,
    category: 'Ropa para Niños',
    description: 'Camisetitas, shores y vestiditos seleccionados para los más pequeños de la casa.',
    images: [
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['2T', '3T', '4T', '6'],
    colors: ['Colores Surtidos', 'Amarillo', 'Celeste'],
    inStock: true,
    featured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 17
  },
  {
    id: 'prod-18',
    name: 'Conjuntos Infantiles',
    icon: '👶',
    price: 55,
    originalPrice: 75,
    category: 'Ropa para Niños',
    description: 'Conjuntos completos de 2 piezas (camiseta + short o falda) listos para vestir.',
    images: [
      'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['2', '4', '6', '8', '10'],
    colors: ['Estampado Divertido', 'Azul / Rojo'],
    inStock: true,
    featured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18
  },
  {
    id: 'prod-19',
    name: 'Bolsas y Mochilas',
    icon: '👜',
    price: 40,
    originalPrice: 60,
    category: 'Bolsas y Accesorios',
    description: 'Carteras de hombro, mochilas prácticas y bolsos para uso diario con compartimentos seguros.',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['Única'],
    colors: ['Café Cuero', 'Negro', 'Beige'],
    inStock: true,
    featured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 19
  },
  {
    id: 'prod-20',
    name: 'Accesorios Variados',
    icon: '👒',
    price: 15,
    originalPrice: 25,
    category: 'Bolsas y Accesorios',
    description: 'Gorras, pañuelos, bufandas y accesorios para complementar y lucir tu estilo.',
    images: [
      'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['Única'],
    colors: ['Variados'],
    inStock: true,
    featured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20
  },
  {
    id: 'prod-21',
    name: 'Cinturones',
    icon: '⌚',
    price: 30,
    originalPrice: 45,
    category: 'Bolsas y Accesorios',
    description: 'Cinturones resistentes con hebillas metálicas clásicas para dama y caballero.',
    images: [
      'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Negro', 'Marrón'],
    inStock: true,
    featured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 21
  },
  {
    id: 'prod-22',
    name: 'Ropa Deportiva',
    icon: '🏃',
    price: 90,
    originalPrice: 120,
    category: 'Deportiva y Playa',
    description: 'Leggings, licras y camisetas dry-fit transpirables para entrenamiento y comodidad.',
    images: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Negro', 'Gris', 'Azul Eléctrico'],
    inStock: true,
    featured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 22
  },
  {
    id: 'prod-23',
    name: 'Ropa de Playa',
    icon: '🩱',
    price: 50,
    originalPrice: 70,
    category: 'Deportiva y Playa',
    description: 'Trajes de baño, pareos y prendas frescas para salidas al mar o piscina.',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Turquesa', 'Coral', 'Negro'],
    inStock: true,
    featured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 23
  },
  {
    id: 'prod-24',
    name: 'Conjuntos Premium',
    icon: '✨',
    price: 500,
    originalPrice: 650,
    category: 'Vestidos y Faldas',
    description: 'Conjuntos exclusivos de alta gama con telas finas seleccionadas, corte sastre y estilo deslumbrante.',
    images: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Dorado Champagne', 'Negro Perla', 'Marfil'],
    inStock: true,
    featured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 24
  }
];

export const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: 'rev-1',
    productId: 'prod-1',
    customerName: 'Sofia Morales',
    rating: 5,
    comment: '¡Me encantaron las camisetas! La tela es súper fresca, suave y el color no se va con la lavada.',
    verifiedPurchase: true,
    createdAt: '2026-09-10'
  },
  {
    id: 'rev-2',
    productId: 'prod-1',
    customerName: 'Carlos Mendoza',
    rating: 5,
    comment: 'Excelente relación calidad precio en Managua. Recomendado 100%.',
    verifiedPurchase: true,
    createdAt: '2026-09-12'
  },
  {
    id: 'rev-3',
    productId: 'prod-3',
    customerName: 'Valeria Rivas',
    rating: 5,
    comment: 'La blusa es bellísima, la tela cae muy elegante y la entrega con inDrive llegó súper rápido el mismo día.',
    verifiedPurchase: true,
    createdAt: '2026-09-08'
  },
  {
    id: 'rev-4',
    productId: 'prod-3',
    customerName: 'Elena Jarquín',
    rating: 5,
    comment: 'Excelente atención de parte de Jie por WhatsApp, me ayudó con la talla exacta.',
    verifiedPurchase: true,
    createdAt: '2026-09-11'
  },
  {
    id: 'rev-5',
    productId: 'prod-6',
    customerName: 'Mariana Gutierrez',
    rating: 5,
    comment: 'El jean se ajusta perfecto y la mezclilla es gruesa y de gran calidad.',
    verifiedPurchase: true,
    createdAt: '2026-09-07'
  },
  {
    id: 'rev-6',
    productId: 'prod-6',
    customerName: 'Kevin Silva',
    rating: 4,
    comment: 'Muy buen pantalón, cómodo y resistente. La entrega fue puntual.',
    verifiedPurchase: true,
    createdAt: '2026-09-09'
  },
  {
    id: 'rev-7',
    productId: 'prod-9',
    customerName: 'Andrea Blandón',
    rating: 5,
    comment: 'Hermoso vestido, me encantó el corte fresco. Ya es mi tienda favorita.',
    verifiedPurchase: true,
    createdAt: '2026-09-05'
  },
  {
    id: 'rev-8',
    productId: 'prod-10',
    customerName: 'Lucía Centeno',
    rating: 5,
    comment: 'Lo usé para un evento el fin de semana y todos me preguntaron de dónde era. ¡5 estrellas bien merecidas!',
    verifiedPurchase: true,
    createdAt: '2026-09-06'
  },
  {
    id: 'rev-9',
    productId: 'prod-13',
    customerName: 'Gabriel Fonseca',
    rating: 5,
    comment: 'Chaqueta de mezclilla auténtica y con mucho estilo. Llegó impecable.',
    verifiedPurchase: true,
    createdAt: '2026-09-04'
  }
];

export const INITIAL_ORDERS: OrderRecord[] = [
  {
    id: 'JIET-829104',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toISOString(),
    customerName: 'Cliente Especial',
    customerPhone: '3109876543',
    customerAddress: 'Plaza España 2c al lago, Managua',
    customerCity: 'Managua',
    deliveryMethod: 'indrive',
    indriveReference: 'Frente a la farmacia, portón color café',
    notes: 'Entregar preferiblemente en la tarde',
    items: [
      {
        productId: 'prod-1',
        productName: 'Camiseta Algodón Premium Minimal',
        price: 320,
        quantity: 1,
        size: 'M',
        color: 'Blanco'
      },
      {
        productId: 'prod-15',
        productName: 'Oso de Peluche Gigante Clásico 80cm',
        price: 520,
        quantity: 1,
        size: '80cm',
        color: 'Café Miel'
      }
    ],
    subtotal: 840,
    discount: 168,
    shipping: 0,
    total: 672,
    currency: 'cordobas',
    status: 'en_preparacion'
  },
  {
    id: 'JIET-710492',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 6).toISOString(),
    customerName: 'Cliente Especial',
    customerPhone: '3109876543',
    customerAddress: 'Altamira D’Este, casa #45',
    customerCity: 'Managua',
    deliveryMethod: 'departamental',
    notes: 'Envío departamental coordinado',
    items: [
      {
        productId: 'prod-9',
        productName: 'Vestido Bohemio Floral de Verano',
        price: 450,
        quantity: 1,
        size: 'S',
        color: 'Estampado Flores'
      }
    ],
    subtotal: 450,
    discount: 90,
    shipping: 50,
    total: 410,
    currency: 'cordobas',
    status: 'entregado'
  }
];

