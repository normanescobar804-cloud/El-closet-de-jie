import React, { useState, useRef, useId, useEffect } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  Package,
  Settings,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  MessageCircle,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  Download,
  BarChart3,
  CreditCard,
  Users,
  Database,
  Bell,
  Megaphone,
  Globe,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  Zap,
  Award,
  Smartphone,
  FileText,
  ShieldCheck,
  ExternalLink,
  WifiOff,
  Mail,
  Key,
  ArrowLeft,
  Send,
  Printer
} from 'lucide-react';
import {
  getSavedPlatformEarnings
} from '../utils/monetization';
import {
  AnalyticsData,
  BusinessAd,
  CurrencyType,
  CustomerInquiry,
  GoogleAdSenseConfig,
  OrderRecord,
  PaymentGatewayConfig,
  PaymentStatusType,
  Product,
  StoreSettings,
  UserAccount
} from '../types';
import { PRODUCT_CATEGORIES } from '../data/initialProducts';
import {
  deleteInquiry,
  formatCurrency,
  getSavedInquiries,
  processHighResImage,
  updateInquiryStatus
} from '../utils/storage';
import { getAnalyticsData } from '../utils/analytics';
import { AnalyticsView } from './AnalyticsView';
import {
  DEFAULT_PAYMENT_GATEWAYS,
  getPaymentMethodBadge,
  getPaymentStatusBadge
} from '../utils/paymentGateways';
import { DEFAULT_ADSENSE_CONFIG } from '../utils/advertising';
import {
  grantCurrentUserAdminRole,
  signInWithGooglePopup,
  auth,
  ADMIN_OWNER_EMAIL,
  uploadProductImageToStorage,
  seedInitialCatalogToCloud
} from '../firebase';
import { generateReceiptPdf } from '../utils/generateReceiptPdf';
import { exportOrdersToCsv } from '../utils/exportOrdersCsv';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  storeSettings: StoreSettings;
  orders: OrderRecord[];
  customers?: UserAccount[];
  businessAds?: BusinessAd[];
  currency?: CurrencyType;
  isCloudConnected?: boolean;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onResetProducts: () => void;
  onSaveSettings: (settings: StoreSettings) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderRecord['status'], paymentStatus?: PaymentStatusType) => void;
  onUpdateBusinessAd?: (updatedAd: BusinessAd) => void;
  onOpenCreateAdModal?: () => void;
  onOpenChat?: () => void;
  onPrintInvoice?: (order: OrderRecord) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  products,
  storeSettings,
  orders,
  customers = [],
  businessAds = [],
  currency = 'NIO',
  isCloudConnected = true,
  onSaveProduct,
  onDeleteProduct,
  onResetProducts,
  onSaveSettings,
  onUpdateOrderStatus,
  onUpdateBusinessAd,
  onDeleteBusinessAd,
  onOpenCreateAdModal,
  onOpenChat,
  onPrintInvoice
}) => {
  const pinInputId = useId();
  const searchFilterId = useId();
  const productNameId = useId();
  const productCategoryId = useId();
  const productPriceId = useId();
  const productOriginalPriceId = useId();
  const productDescId = useId();
  const productStockId = useId();
  const customSizeId = useId();
  const customColorId = useId();
  const photoUrlId = useId();
  const storeNameId = useId();
  const storeTaglineId = useId();
  const storeWhatsappId = useId();
  const storeGreetingId = useId();
  const storeCurrencyId = useId();
  const storeShippingCostId = useId();
  const storeFreeShippingThresholdId = useId();
  const storePinId = useId();
  const emailInputId = useId();
  const passwordInputId = useId();
  const phoneInputId = useId();
  const otpInputId = useId();

  // Back-End Login Gate Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone' | 'pin'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneInput, setPhoneInput] = useState(storeSettings.whatsappNumber || '58898311');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [rememberSession, setRememberSession] = useState<boolean>(true);
  const [authenticatedUserLabel, setAuthenticatedUserLabel] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginSuccessNotice, setLoginSuccessNotice] = useState<string | null>(null);

  // Legacy PIN state
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showSettingsPin, setShowSettingsPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isGrantingCloudAdmin, setIsGrantingCloudAdmin] = useState(false);
  const [isSyncingCatalog, setIsSyncingCatalog] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'products' | 'orders' | 'customers' | 'payments' | 'ads' | 'inquiries' | 'analytics' | 'settings' | 'monetization'
  >('products');

  // Traffic & Page Views Analytics State
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(getAnalyticsData());

  // Customer Inquiries state
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [inquiryFilter, setInquiryFilter] = useState<'todos' | 'nuevo' | 'contactado' | 'cerrado'>('todos');

  // Payment Gateways Configuration State
  const [gatewaysForm, setGatewaysForm] = useState<PaymentGatewayConfig[]>(
    storeSettings.paymentGateways && storeSettings.paymentGateways.length > 0
      ? storeSettings.paymentGateways
      : DEFAULT_PAYMENT_GATEWAYS
  );
  const [gatewaysSavedMsg, setGatewaysSavedMsg] = useState(false);

  // Google AdSense Configuration State
  const [adSenseForm, setAdSenseForm] = useState<GoogleAdSenseConfig>(
    storeSettings.adSenseConfig || DEFAULT_ADSENSE_CONFIG
  );
  const [adSenseSavedMsg, setAdSenseSavedMsg] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInquiries(getSavedInquiries());
      setAnalyticsData(getAnalyticsData());
      setSettingsForm({ ...storeSettings });
      setGatewaysForm(
        storeSettings.paymentGateways && storeSettings.paymentGateways.length > 0
          ? storeSettings.paymentGateways
          : DEFAULT_PAYMENT_GATEWAYS
      );
      setAdSenseForm(storeSettings.adSenseConfig || DEFAULT_ADSENSE_CONFIG);

      // Verify remembered session token
      const savedSession = localStorage.getItem('elcloset_backend_session');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          if (parsed?.authenticated && parsed?.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
            setIsAuthenticated(true);
            setAuthenticatedUserLabel(parsed.identity || 'Administrador');
          }
        } catch {
          // ignore
        }
      }
    }
  }, [isOpen, activeTab, storeSettings]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const handleRefreshAnalytics = () => {
    setAnalyticsData(getAnalyticsData());
  };

  // Boutique Preset Photos for 1-Click Assignment
  const BOUTIQUE_PRESET_PHOTOS = [
    { label: 'Vestido Floral', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=85' },
    { label: 'Vestido de Fiesta', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85' },
    { label: 'Blusa Elegante', url: 'https://images.unsplash.com/photo-1534126511673-b6899657816a?auto=format&fit=crop&w=900&q=85' },
    { label: 'Jeans Clásico', url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85' },
    { label: 'Chaqueta Denim', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85' },
    { label: 'Conjunto Lino', url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=85' },
    { label: 'Bolso Chic', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85' },
    { label: 'Camisa Casual', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=85' }
  ];

  // Product Editing / Creation State
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Vestidos');
  const [condition, setCondition] = useState<'usada' | 'nueva'>('usada');
  const [material, setMaterial] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L']);
  const [colors, setColors] = useState<string[]>(['Original']);
  const [images, setImages] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);
  const [stock, setStock] = useState<number>(5);
  const [featured, setFeatured] = useState(false);

  // Custom inputs for sizes/colors
  const [customSize, setCustomSize] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Image upload status
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadMessage, setImageUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter in products list
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');

  // Settings State
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...storeSettings });
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);
  const [copiedOwnerWallet, setCopiedOwnerWallet] = useState(false);
  const [copiedOwnerAccount, setCopiedOwnerAccount] = useState(false);

  // Master Unlock Success Handler
  const handleUnlockSuccess = async (identityLabel: string) => {
    setIsAuthenticated(true);
    setAuthenticatedUserLabel(identityLabel);
    setPinError('');
    setLoginSuccessNotice(`¡Bienvenido al Back-end! Acceso autorizado como ${identityLabel}`);
    
    if (rememberSession) {
      try {
        localStorage.setItem(
          'elcloset_backend_session',
          JSON.stringify({
            authenticated: true,
            identity: identityLabel,
            timestamp: Date.now()
          })
        );
      } catch {
        // ignore
      }
    }

    if (auth.currentUser) {
      await grantCurrentUserAdminRole().catch(() => {});
    }

    setTimeout(() => {
      setLoginSuccessNotice(null);
    }, 3500);
  };

  const handleLockAdmin = () => {
    setIsAuthenticated(false);
    setAuthenticatedUserLabel('');
    setPinInput('');
    setPasswordInput('');
    setOtpInput('');
    setGeneratedOtp(null);
    setOtpNotice(null);
    try {
      localStorage.removeItem('elcloset_backend_session');
    } catch {
      // ignore
    }
  };

  // Method 1: Email & Password Authentication
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const email = emailInput.trim().toLowerCase();
    const pass = passwordInput.trim();

    if (!email) {
      setPinError('Por favor ingresa tu correo electrónico.');
      return;
    }
    if (!pass) {
      setPinError('Por favor ingresa tu contraseña de administrador.');
      return;
    }

    const authorizedKey = (storeSettings.adminPin && storeSettings.adminPin !== '1234')
      ? storeSettings.adminPin
      : 'jordan#$29';

    if (pass === '1234') {
      setPinError('Acceso denegado: Clave incorrecta. Solo el administrador tiene autorización.');
      return;
    }

    if (pass === authorizedKey || pass === 'jordan#$29') {
      await handleUnlockSuccess(email);
    } else {
      setPinError('Acceso denegado: Contraseña de administrador incorrecta.');
    }
  };

  // Method 2: Phone & Verification Code (OTP)
  const handleSendOtp = () => {
    setPinError('');
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setPinError('Ingresa un número de teléfono válido (mínimo 8 dígitos).');
      return;
    }

    // Generate random 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpNotice(`Código de verificación: ${code}`);
    setOtpCountdown(60);

    // Open WhatsApp link or prepare message
    const fullPhone = cleanPhone.startsWith('505') ? cleanPhone : `505${cleanPhone}`;
    const text = encodeURIComponent(
      `🔐 *Código de Acceso Back-End ${storeSettings.storeName}*\nTu código de seguridad temporal es: *${code}*.\n(Válido por 10 minutos).`
    );
    window.open(`https://wa.me/${fullPhone}?text=${text}`, '_blank');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const enteredCode = otpInput.trim();

    if (!enteredCode) {
      setPinError('Ingresa el código de 6 dígitos.');
      return;
    }

    const authorizedKey = (storeSettings.adminPin && storeSettings.adminPin !== '1234')
      ? storeSettings.adminPin
      : 'jordan#$29';

    if (
      (generatedOtp && enteredCode === generatedOtp) ||
      enteredCode === authorizedKey ||
      enteredCode === 'jordan#$29'
    ) {
      await handleUnlockSuccess(`Teléfono +505 ${phoneInput}`);
    } else {
      setPinError('Código incorrecto. Verifica el número recibido o solicita uno nuevo.');
    }
  };

  // Method 3: Direct PIN / Master Security Key
  const handlePinUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const entered = pinInput.trim();

    if (!entered) {
      setPinError('Ingresa la llave de seguridad.');
      return;
    }

    if (entered === '1234') {
      setPinError('Acceso denegado: Clave incorrecta. Solo el administrador tiene autorización.');
      return;
    }

    const authorizedKey = (storeSettings.adminPin && storeSettings.adminPin !== '1234')
      ? storeSettings.adminPin
      : 'jordan#$29';

    if (entered === 'jordan#$29' || entered === authorizedKey) {
      await handleUnlockSuccess('Llave Maestra');
    } else {
      setPinError('Acceso denegado: Llave de seguridad incorrecta.');
    }
  };

  // Method 4: 1-Click Google Sign-In with Owner Email
  const handleGoogleAdminLogin = async () => {
    setPinError('');
    setLoginLoading(true);
    try {
      if (!auth.currentUser) {
        await signInWithGooglePopup();
      }
      if (auth.currentUser) {
        await grantCurrentUserAdminRole().catch(() => {});
        await handleUnlockSuccess(auth.currentUser.email || 'Google Admin');
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request' &&
        !err?.message?.includes('popup-closed-by-user')
      ) {
        setPinError('No se pudo completar el inicio de sesión con Google.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleUnlock = handlePinUnlock;
  const handleLinkCloudAdmin = handleGoogleAdminLogin;

  const handleBulkSyncToFirebase = async () => {
    setIsSyncingCatalog(true);
    setSyncFeedback(null);
    try {
      const count = await seedInitialCatalogToCloud(products);
      setSyncFeedback(`¡${count} productos sincronizados con éxito en Firebase Firestore!`);
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err) {
      console.error(err);
      setSyncFeedback('Error al sincronizar catálogo con Firebase.');
      setTimeout(() => setSyncFeedback(null), 5000);
    } finally {
      setIsSyncingCatalog(false);
    }
  };

  // Open Form to Create New Product
  const handleOpenCreateProduct = () => {
    setEditingId(null);
    setName('');
    setCategory('Camisetas y Camisas');
    setCondition('usada');
    setMaterial('');
    setPrice(65);
    setOriginalPrice(undefined);
    setDescription('');
    setSizes(['S', 'M', 'L']);
    setColors(['Original']);
    setImages([
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
    ]);
    setInStock(true);
    setStock(5);
    setFeatured(false);
    setIsEditingProduct(true);
  };

  // Open Form to Edit Existing Product
  const handleOpenEditProduct = (prod: Product) => {
    setEditingId(prod.id);
    setName(prod.name);
    setCategory(prod.category);
    setCondition(prod.condition || 'usada');
    setMaterial(prod.material || '');
    setPrice(prod.price);
    setOriginalPrice(prod.originalPrice);
    setDescription(prod.description);
    setSizes(prod.sizes || []);
    setColors(prod.colors || []);
    setImages(prod.images || []);
    setInStock(prod.inStock);
    setStock(prod.stock ?? prod.inventory ?? (prod.condition === 'usada' ? 1 : 5));
    setFeatured(!!prod.featured);
    setIsEditingProduct(true);
  };

  // 📸 Subida de fotos desde la Galería en Alta Resolución
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setImageUploadMessage('Cargando foto(s) de la galería...');

    try {
      const newImagesList: string[] = [...images];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setImageUploadMessage(`Cargando foto ${i + 1} de ${files.length}...`);
        // Process crisp high-res version first to ensure instant gallery compatibility
        let processedData: string = '';
        try {
          processedData = await processHighResImage(file);
        } catch {
          // If canvas fails, fallback to direct upload
          processedData = '';
        }
        const storageUrl = await uploadProductImageToStorage(processedData || file, `prod-${name || 'producto'}`);
        newImagesList.push(storageUrl);
      }
      setImages(newImagesList);
      setImageUploadMessage(`¡${files.length} foto(s) agregada(s) correctamente!`);
      setTimeout(() => setImageUploadMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setImageUploadMessage('Error al procesar la imagen de la galería.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Drag & Drop
  const handleDropFiles = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    setIsUploadingImage(true);
    setImageUploadMessage('Subiendo foto(s) a Firebase Storage...');

    try {
      const newImagesList: string[] = [...images];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file.type.startsWith('image/')) {
          setImageUploadMessage(`Subiendo foto ${i + 1} de ${e.dataTransfer.files.length} a Firebase Storage...`);
          const storageUrl = await uploadProductImageToStorage(file, `prod-${name || 'prenda'}`);
          newImagesList.push(storageUrl);
        }
      }
      setImages(newImagesList);
      setImageUploadMessage('¡Foto(s) subida(s) a Firebase Storage con éxito!');
      setTimeout(() => setImageUploadMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setImageUploadMessage('Error al cargar la foto.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages([...images, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    const target = images[indexToPrimary];
    const rest = images.filter((_, idx) => idx !== indexToPrimary);
    setImages([target, ...rest]);
  };

  const handleSelectPresetPhoto = (url: string) => {
    if (!images.includes(url)) {
      setImages([url, ...images]);
      setImageUploadMessage('¡Foto de muestra añadida como foto principal!');
      setTimeout(() => setImageUploadMessage(''), 3000);
    }
  };

  const handleUpdateInquiryStatus = (id: string, newStatus: CustomerInquiry['status']) => {
    updateInquiryStatus(id, newStatus);
    setInquiries(getSavedInquiries());
  };

  const handleDeleteInquiry = (id: string) => {
    if (confirm('¿Deseas eliminar este mensaje de contacto?')) {
      deleteInquiry(id);
      setInquiries(getSavedInquiries());
    }
  };

  const handleReplyWhatsApp = (inquiry: CustomerInquiry) => {
    let cleanPhone = inquiry.customerPhone.replace(/\D/g, '');
    if (cleanPhone.length === 8) {
      cleanPhone = `505${cleanPhone}`;
    }
    const replyText = `*¡Hola ${inquiry.customerName}!* 👋\nTe escribe ${storeSettings.storeName}. Recibimos tu mensaje en nuestra tienda online sobre: "${inquiry.inquiryType === 'inscripcion_ofertas' ? 'Inscripción a ofertas' : inquiry.productName || 'tu consulta'}". Con mucho gusto te atendemos. ¿En qué podemos ayudarte?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(replyText)}`, '_blank');
  };

  const handleAddSize = () => {
    if (customSize.trim() && !sizes.includes(customSize.trim().toUpperCase())) {
      setSizes([...sizes, customSize.trim().toUpperCase()]);
      setCustomSize('');
    }
  };

  const handleRemoveSize = (sz: string) => {
    setSizes(sizes.filter((s) => s !== sz));
  };

  const handleAddColor = () => {
    if (customColor.trim() && !colors.includes(customColor.trim())) {
      setColors([...colors, customColor.trim()]);
      setCustomColor('');
    }
  };

  const handleRemoveColor = (col: string) => {
    setColors(colors.filter((c) => c !== col));
  };

  // Save Product
  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const productPayload: Product = {
      id: editingId || `prod-${Date.now()}`,
      name: name.trim(),
      category,
      condition,
      material: material.trim() || undefined,
      price: Number(price) || 0,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      description: description.trim(),
      sizes: sizes.length > 0 ? sizes : ['Única'],
      colors: colors.length > 0 ? colors : ['Original'],
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=85'],
      inStock: Number(stock) > 0 ? inStock : false,
      stock: Number(stock) >= 0 ? Number(stock) : 0,
      inventory: Number(stock) >= 0 ? Number(stock) : 0,
      featured,
      createdAt: editingId ? (products.find((p) => p.id === editingId)?.createdAt || Date.now()) : Date.now(),
    };

    onSaveProduct(productPayload);
    setIsEditingProduct(false);
  };

  // Save Settings
  const handleSaveSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedForm = { ...settingsForm, paymentGateways: gatewaysForm };
    if (!updatedForm.adminPin || updatedForm.adminPin.trim() === '1234') {
      updatedForm.adminPin = 'jordan#$29';
      setSettingsForm(updatedForm);
    }
    onSaveSettings(updatedForm);
    setSettingsSavedSuccess(true);
    setTimeout(() => setSettingsSavedSuccess(false), 3000);
  };

  // Save Electronic Payment Gateways
  const handleSaveGateways = () => {
    const updatedSettings: StoreSettings = {
      ...storeSettings,
      paymentGateways: gatewaysForm
    };
    setSettingsForm(updatedSettings);
    onSaveSettings(updatedSettings);
    setGatewaysSavedMsg(true);
    setTimeout(() => setGatewaysSavedMsg(false), 3000);
  };

  const handleToggleGateway = (gwId: PaymentGatewayConfig['id']) => {
    setGatewaysForm((prev) =>
      prev.map((g) => (g.id === gwId ? { ...g, enabled: !g.enabled } : g))
    );
  };

  const handleUpdateGatewayField = (
    gwId: PaymentGatewayConfig['id'],
    field: keyof PaymentGatewayConfig,
    value: string | boolean
  ) => {
    setGatewaysForm((prev) =>
      prev.map((g) => (g.id === gwId ? { ...g, [field]: value } : g))
    );
  };

  // Merge registered customers from Firestore + unique customers from orders
  const mergedCustomers = React.useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      phone: string;
      email?: string;
      address?: string;
      city?: string;
      department?: string;
      ordersCount: number;
      totalSpent: number;
      preferredPaymentMethod?: string;
      isCloudAccount: boolean;
    }>();

    customers.forEach((c) => {
      const key = c.uid || c.phone || c.name;
      map.set(key, {
        id: key,
        name: c.name,
        phone: c.phone || 'Sin teléfono',
        email: c.email,
        address: c.address,
        city: c.city,
        department: c.department,
        ordersCount: 0,
        totalSpent: 0,
        preferredPaymentMethod: c.preferredPaymentMethod,
        isCloudAccount: !!c.uid
      });
    });

    orders.forEach((o) => {
      const existingKey = Array.from(map.keys()).find(
        (k) =>
          k === o.customerUid ||
          map.get(k)?.phone.replace(/\D/g, '') === o.customerPhone.replace(/\D/g, '')
      );
      if (existingKey) {
        const curr = map.get(existingKey)!;
        curr.ordersCount += 1;
        curr.totalSpent += o.total;
      } else {
        const key = o.customerUid || o.customerPhone || o.id;
        map.set(key, {
          id: key,
          name: o.customerName,
          phone: o.customerPhone,
          email: o.customerEmail,
          address: o.customerAddress,
          city: o.customerCity,
          ordersCount: 1,
          totalSpent: o.total,
          preferredPaymentMethod: o.paymentMethod,
          isCloudAccount: !!o.customerUid
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customers, orders]);

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.category.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'Todas' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in">
      <div
        className="relative bg-white w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-gradient-to-r from-stone-950 via-purple-950 to-stone-900 text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-amber-400/50 shadow-md bg-stone-900 shrink-0">
              <img src="/icon.svg" alt="Logotipo El Clóset de Jié" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-serif text-lg sm:text-xl font-bold">
                    {isAuthenticated ? 'Panel de Administración y Back-End' : `${storeSettings.storeName} • Back-End`}
                  </h2>
                  <span className="bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-stone-950 font-black text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded shadow-2xs uppercase tracking-wider">
                    V2
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Database className="w-3 h-3" />
                  <span>{isCloudConnected ? 'Firebase Cloud Activo' : 'Local'}</span>
                </span>
                {isAuthenticated && authenticatedUserLabel && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-200 border border-violet-500/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{authenticatedUserLabel}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-300">
                {isAuthenticated
                  ? 'Catálogo, pedidos con notificaciones en vivo, clientes, estadísticas y pasarelas de pago'
                  : 'Acceso seguro y exclusivo para administradores'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                id="btn-lock-admin"
                onClick={handleLockAdmin}
                className="text-xs text-rose-300 hover:text-white flex items-center gap-1.5 bg-rose-950/60 hover:bg-rose-900/80 px-3 py-1.5 rounded-lg border border-rose-800/60 cursor-pointer transition-colors"
                title="Cerrar sesión del panel"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}
            <button
              id="btn-close-admin-modal"
              onClick={onClose}
              className="w-8 h-8 rounded-full text-stone-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Back-End Login Gate (Protege el acceso para que no entren de un solo) */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full space-y-6 overflow-y-auto">
            {/* Logotipo Oficial de la App */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition duration-500 animate-pulse"></div>
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-amber-400/80 shadow-2xl bg-gradient-to-tr from-violet-950 via-purple-900 to-indigo-950 p-1 flex items-center justify-center">
                  <img
                    src="/icon.svg"
                    alt="Logotipo Oficial El Clóset de Jié"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-3.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-950 text-[11px] font-bold uppercase tracking-wider border border-amber-300 mb-1.5 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Área Administrativa Segura</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-black text-stone-900">
                  {storeSettings.storeName}
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm">
                  Inicia sesión con tu correo, teléfono o código para acceder a la gestión de productos, pedidos y clientes.
                </p>
              </div>
            </div>

            {/* Success notification */}
            {loginSuccessNotice && (
              <div className="w-full text-xs font-semibold text-emerald-800 bg-emerald-50 p-3.5 rounded-xl border border-emerald-300 flex items-center gap-2 text-left animate-fade-in shadow-2xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{loginSuccessNotice}</span>
              </div>
            )}

            {/* Error notification */}
            {pinError && (
              <div className="w-full text-xs font-semibold text-rose-700 bg-rose-50 p-3.5 rounded-xl border border-rose-300 flex items-center gap-2.5 text-left animate-shake shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{pinError}</span>
              </div>
            )}

            {/* OTP Code simulated delivery notice */}
            {otpNotice && (
              <div className="w-full text-xs font-semibold text-amber-950 bg-amber-50 p-3.5 rounded-xl border border-amber-300 flex items-start justify-between gap-2 text-left animate-fade-in shadow-2xs">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 shrink-0 text-amber-700" />
                  <div>
                    <span className="font-bold block text-[11px] text-amber-800">Código de Verificación Generado:</span>
                    <span className="font-mono text-base font-black text-amber-950 tracking-widest">
                      {generatedOtp}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (generatedOtp) {
                      setOtpInput(generatedOtp);
                      navigator.clipboard.writeText(generatedOtp);
                    }
                  }}
                  className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Pegar Código
                </button>
              </div>
            )}

            {/* Multi-Method Selector Tabs */}
            <div className="w-full grid grid-cols-3 gap-1 p-1 bg-stone-100 rounded-2xl border border-stone-250 text-xs">
              <button
                type="button"
                onClick={() => { setLoginMethod('email'); setPinError(''); }}
                className={`py-2 px-1.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMethod === 'email'
                    ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-violet-700" />
                <span className="truncate">Correo</span>
              </button>

              <button
                type="button"
                onClick={() => { setLoginMethod('phone'); setPinError(''); }}
                className={`py-2 px-1.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMethod === 'phone'
                    ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate">Teléfono</span>
              </button>

              <button
                type="button"
                onClick={() => { setLoginMethod('pin'); setPinError(''); }}
                className={`py-2 px-1.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMethod === 'pin'
                    ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span className="truncate">Llave Maestra</span>
              </button>
            </div>

            {/* TAB 1: Correo Electrónico y Contraseña */}
            {loginMethod === 'email' && (
              <form onSubmit={handleEmailLogin} className="w-full space-y-3.5 text-left">
                <div>
                  <label htmlFor={emailInputId} className="block text-xs font-bold text-stone-700 mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id={emailInputId}
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Correo de administrador"
                      required
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-stone-300 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200 text-xs sm:text-sm text-stone-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={passwordInputId} className="block text-xs font-bold text-stone-700 mb-1">
                    Contraseña de Administrador
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id={passwordInputId}
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Ingresa tu contraseña de back-end..."
                      required
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-300 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200 text-xs sm:text-sm text-stone-900 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-violet-900 via-indigo-900 to-stone-900 hover:brightness-110 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-amber-300" />
                  <span>Iniciar Sesión en el Back-End</span>
                </button>
              </form>
            )}

            {/* TAB 2: Teléfono o Código de Verificación */}
            {loginMethod === 'phone' && (
              <form onSubmit={handleVerifyOtp} className="w-full space-y-3.5 text-left">
                <div>
                  <label htmlFor={phoneInputId} className="block text-xs font-bold text-stone-700 mb-1">
                    Número Celular o WhatsApp (Nicaragua)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-bold text-stone-500">
                        🇳🇮 +505
                      </div>
                      <input
                        id={phoneInputId}
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="58898311"
                        className="w-full pl-20 pr-3.5 py-3 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 text-xs sm:text-sm text-stone-900 bg-white font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpCountdown > 0}
                      className="px-3.5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{otpCountdown > 0 ? `${otpCountdown}s` : 'Enviar Código'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Te enviaremos un código de seguridad de 6 dígitos a tu WhatsApp.
                  </p>
                </div>

                <div>
                  <label htmlFor={otpInputId} className="block text-xs font-bold text-stone-700 mb-1">
                    Código de 6 dígitos recibido
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      id={otpInputId}
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 text-base font-mono font-bold tracking-widest text-center text-stone-900 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-800 via-teal-900 to-stone-900 hover:brightness-110 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Verificar Código y Entrar</span>
                </button>
              </form>
            )}

            {/* TAB 3: Llave Maestra (PIN) */}
            {loginMethod === 'pin' && (
              <form onSubmit={handlePinUnlock} className="w-full space-y-3.5 text-left">
                <div>
                  <label htmlFor={pinInputId} className="block text-xs font-bold text-stone-700 mb-1">
                    Llave Maestra de Seguridad (PIN)
                  </label>
                  <div className="relative">
                    <input
                      id={pinInputId}
                      type={showPin ? 'text' : 'password'}
                      maxLength={50}
                      placeholder="Ingresa la llave de seguridad (jordan#$29)..."
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        if (pinError) setPinError('');
                      }}
                      autoFocus
                      className="w-full text-center text-base font-mono font-bold py-3 pl-4 pr-12 rounded-xl border-2 border-stone-300 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200 transition-all bg-white text-stone-900 placeholder:font-sans placeholder:text-xs placeholder:font-normal placeholder:text-stone-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 transition-colors cursor-pointer"
                      title={showPin ? 'Ocultar llave' : 'Mostrar llave'}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-pin"
                  className="w-full py-3.5 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 hover:brightness-110 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <Unlock className="w-4 h-4 text-amber-300" />
                  <span>Desbloquear con Llave Maestra</span>
                </button>
              </form>
            )}

            {/* Opción Rápida con Google */}
            <div className="w-full space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="h-px bg-stone-200 flex-1" />
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">o continuar con</span>
                <div className="h-px bg-stone-200 flex-1" />
              </div>

              <button
                type="button"
                onClick={handleGoogleAdminLogin}
                disabled={loginLoading}
                className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs rounded-xl border border-stone-300 flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continuar con Google ({ADMIN_OWNER_EMAIL})</span>
              </button>
            </div>

            {/* Checkbox Recordar Sesión & Botón Volver a la Tienda */}
            <div className="w-full pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 border-t border-stone-200">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-stone-300"
                />
                <span>Recordar sesión (7 días)</span>
              </label>

              <button
                type="button"
                onClick={onClose}
                className="text-stone-600 hover:text-stone-900 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a la Tienda</span>
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated Admin Views */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Tabs Navigation */}
            <div className="flex border-b border-stone-200 bg-stone-50 px-3 sm:px-6 pt-2 gap-1.5 shrink-0 overflow-x-auto scrollbar-none">
              {/* 1. 👗 Productos */}
              <button
                id="tab-btn-products"
                onClick={() => { setActiveTab('products'); setIsEditingProduct(false); }}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'products'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Productos ({products.length})</span>
              </button>

              {/* 2. 📦 Pedidos */}
              <button
                id="tab-btn-orders"
                onClick={() => { setActiveTab('orders'); setIsEditingProduct(false); }}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'orders'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-rose-600" />
                <span>Pedidos & Notificaciones ({orders.length})</span>
              </button>

              {/* 3. 👥 Clientes */}
              <button
                id="tab-btn-customers"
                onClick={() => { setActiveTab('customers'); setIsEditingProduct(false); }}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'customers'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Clientes ({mergedCustomers.length})</span>
              </button>

              {/* 4. 📈 Ventas (2% Comisión, PayPal & Ganancias) */}
              <button
                id="tab-btn-ventas"
                onClick={() => { setActiveTab('monetization'); setIsEditingProduct(false); }}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'monetization'
                    ? 'border-emerald-600 text-emerald-950 bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-emerald-700 hover:text-emerald-900'
                }`}
                title="Ventas totales, comisión 2% de la plataforma y retiros por PayPal"
              >
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Ventas & Ganancias (2%)</span>
              </button>

              {/* 5. 💳 Pagos Electrónicos */}
              <button
                id="tab-btn-payments"
                onClick={() => { setActiveTab('payments'); setIsEditingProduct(false); }}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'payments'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <CreditCard className="w-4 h-4 text-sky-600" />
                <span>Pagos Electrónicos</span>
              </button>

              {/* 6. 📢 Publicidad & AdSense */}
              <button
                id="tab-btn-ads"
                onClick={() => { setActiveTab('ads'); setIsEditingProduct(false); }}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'ads'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Megaphone className="w-4 h-4 text-amber-500" />
                <span>Publicidad & AdSense ({businessAds.length})</span>
              </button>

              {/* 7. 📊 Estadísticas */}
              <button
                id="tab-btn-analytics"
                onClick={() => { setActiveTab('analytics'); setIsEditingProduct(false); }}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <span>Estadísticas</span>
              </button>

              {/* 8. 💬 Consultas */}
              <button
                id="tab-btn-inquiries"
                onClick={() => { setActiveTab('inquiries'); setIsEditingProduct(false); }}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'inquiries'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <MessageCircle className="w-4 h-4 text-violet-600" />
                <span>Consultas ({inquiries.length})</span>
              </button>

              {/* 9. ⚙️ Ajustes */}
              <button
                id="tab-btn-settings"
                onClick={() => { setActiveTab('settings'); setIsEditingProduct(false); }}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Ajustes</span>
              </button>
            </div>

            {/* TAB 1: PRODUCT MANAGEMENT */}
            {activeTab === 'products' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {!auth.currentUser && (
                  <div className="mb-4 p-3 rounded-2xl bg-violet-50 border border-violet-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="text-xs text-violet-950">
                      <strong>Sincronización en la nube (Firestore):</strong> Vincula tu cuenta de Google de administrador para que los cambios del catálogo se publiquen en tiempo real para todos los dispositivos.
                    </div>
                    <button
                      type="button"
                      onClick={handleLinkCloudAdmin}
                      disabled={isGrantingCloudAdmin}
                      className="px-3 py-1.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                    >
                      {isGrantingCloudAdmin ? 'Conectando...' : 'Vincular Google Admin'}
                    </button>
                  </div>
                )}

                {isEditingProduct ? (
                  /* Create / Edit Product Form */
                  <form onSubmit={handleSaveProductSubmit} className="space-y-6 max-w-3xl mx-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                      <h3 className="font-serif text-xl font-bold text-stone-900">
                        {editingId ? 'Editar Prenda' : 'Nueva Prenda de Catálogo'}
                      </h3>
                      <button
                        type="button"
                        id="btn-cancel-product-edit"
                        onClick={() => setIsEditingProduct(false)}
                        className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                      >
                        Cancelar y volver
                      </button>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label htmlFor={productNameId} className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Nombre de la Prenda *
                        </label>
                        <input
                          id={productNameId}
                          type="text"
                          required
                          placeholder="Ej: Vestido Lino Sirena Elegance"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-400 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label htmlFor={productCategoryId} className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Categoría
                        </label>
                        <select
                          id={productCategoryId}
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-400 focus:bg-white"
                        >
                          {PRODUCT_CATEGORIES.filter((c) => c !== 'Todas').map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Estado: Ropa Usada o Ropa Nueva */}
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Estado de la Prenda
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setCondition('usada')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              condition === 'usada'
                                ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                            }`}
                          >
                            <span>♻️</span>
                            <span>Ropa Usada</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCondition('nueva')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              condition === 'nueva'
                                ? 'bg-emerald-100 border-emerald-400 text-emerald-950 shadow-xs'
                                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                            }`}
                          >
                            <span>✨</span>
                            <span>Ropa Nueva</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor={productPriceId} className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Precio de Venta (C$) *
                          </label>
                          <input
                            id={productPriceId}
                            type="number"
                            required
                            min="0"
                            step="5"
                            placeholder="Ej: 150"
                            value={price || ''}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-400 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label htmlFor={productOriginalPriceId} className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Precio Antes (Tachado)
                          </label>
                          <input
                            id={productOriginalPriceId}
                            type="number"
                            min="0"
                            step="5"
                            placeholder="Ej: 200"
                            value={originalPrice || ''}
                            onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-400 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Material / Composición (Para Ficha y Lectura Rápida)
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: 100% Algodón Peinado, Denim Stretch, Lino Natural..."
                          value={material}
                          onChange={(e) => setMaterial(e.target.value)}
                          className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-400 focus:bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor={productDescId} className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Descripción & Detalles
                        </label>
                        <textarea
                          id={productDescId}
                          rows={3}
                          placeholder="Describe el material, caída, horma, ocasión de uso o cuidados..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-400 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Sizes and Colors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                          Tallas Disponibles
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {sizes.map((sz) => (
                            <span
                              key={sz}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-900 text-white rounded-lg text-xs font-semibold"
                            >
                              {sz}
                              <button
                                type="button"
                                onClick={() => handleRemoveSize(sz)}
                                className="hover:text-red-300 p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <label htmlFor={customSizeId} className="sr-only">Agregar talla</label>
                          <input
                            id={customSizeId}
                            type="text"
                            placeholder="Nueva talla (ej: 4T, 6, M)"
                            value={customSize}
                            onChange={(e) => setCustomSize(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSize(); } }}
                            className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-stone-400"
                          />
                          <button
                            type="button"
                            onClick={handleAddSize}
                            className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-semibold"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                          Colores Disponibles
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {colors.map((col) => (
                            <span
                              key={col}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-900 border border-rose-200 rounded-lg text-xs font-semibold"
                            >
                              {col}
                              <button
                                type="button"
                                onClick={() => handleRemoveColor(col)}
                                className="hover:text-red-600 p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <label htmlFor={customColorId} className="sr-only">Agregar color</label>
                          <input
                            id={customColorId}
                            type="text"
                            placeholder="Nuevo color (ej: Rosa, Azul)"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddColor(); } }}
                            className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-stone-400"
                          />
                          <button
                            type="button"
                            onClick={handleAddColor}
                            className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-semibold"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 📸 SUBIDA DE FOTOS EN ALTA RESOLUCIÓN */}
                    <div className="pt-3 border-t border-stone-200 space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                          📸 Fotos del Producto en Alta Resolución ({images.length})
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          Arrastra y suelta fotos desde tu celular o computadora.
                        </p>
                      </div>

                      <div
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={handleDropFiles}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-stone-300 hover:border-rose-400 bg-stone-50 hover:bg-rose-50/30 rounded-2xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center group"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="w-12 h-12 rounded-full bg-stone-200 group-hover:bg-rose-100 group-hover:text-rose-700 text-stone-600 flex items-center justify-center transition-colors mb-2">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-bold text-stone-800">
                          {isUploadingImage ? 'Procesando fotos...' : 'Toca para seleccionar fotos o arrástralas aquí'}
                        </div>
                      </div>

                      {imageUploadMessage && (
                        <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{imageUploadMessage}</span>
                        </div>
                      )}

                      <div className="flex gap-2 items-center">
                        <label htmlFor={photoUrlId} className="sr-only">URL de foto externa</label>
                        <input
                          id={photoUrlId}
                          type="url"
                          placeholder="O pega el enlace web de una foto..."
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-stone-400"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold whitespace-nowrap"
                        >
                          Añadir Enlace
                        </button>
                      </div>

                      {images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                          {images.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 group bg-stone-100 ${
                                idx === 0 ? 'border-stone-900' : 'border-stone-200'
                              }`}
                            >
                              <img src={imgUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                              {idx === 0 && (
                                <span className="absolute top-1.5 left-1.5 bg-stone-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  Principal ⭐
                                </span>
                              )}
                              <div className="absolute inset-0 bg-stone-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                                {idx !== 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetPrimaryImage(idx)}
                                    className="px-2 py-1 bg-white text-stone-900 rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    Hacer Principal
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(idx)}
                                  className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2">
                        <span className="text-[11px] font-bold text-stone-800 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Fotos de muestra rápidas:</span>
                        </span>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                          {BOUTIQUE_PRESET_PHOTOS.map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => handleSelectPresetPhoto(preset.url)}
                              className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-stone-300 hover:border-violet-600 transition-all cursor-pointer"
                            >
                              <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                              <span className="absolute inset-x-0 bottom-0 bg-stone-950/80 text-white text-[8px] py-0.5 px-1 truncate block text-center">
                                {preset.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Status Toggles & Inventory */}
                    <div className="space-y-4 pt-3 border-t border-stone-100">
                      <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <label htmlFor={productStockId} className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-0.5">
                            Cantidad en Inventario (Stock) *
                          </label>
                          <p className="text-[11px] text-stone-500">
                            Si quedan menos de 3 unidades (&lt; 3), la tienda activará automáticamente la insignia visual <strong className="text-amber-800">"Últimas unidades"</strong> con efecto de urgencia.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            id={productStockId}
                            type="number"
                            min="0"
                            step="1"
                            value={stock}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setStock(val);
                              if (val === 0) setInStock(false);
                              else if (!inStock && val > 0) setInStock(true);
                            }}
                            className="w-24 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-bold text-stone-900 text-center focus:outline-none focus:border-stone-500"
                          />
                          <span className="text-xs font-semibold text-stone-600">unidades</span>
                          {stock > 0 && stock < 3 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-rose-600 text-white px-2 py-1 rounded-full shadow-xs animate-pulse">
                              🔥 ¡Últimas unidades!
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                          <input
                            type="checkbox"
                            checked={inStock}
                            onChange={(e) => setInStock(e.target.checked)}
                            className="w-4 h-4 rounded text-stone-900 border-stone-300"
                          />
                          <span>Producto Disponible en Stock</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                          <input
                            type="checkbox"
                            checked={featured}
                            onChange={(e) => setFeatured(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-600 border-stone-300"
                          />
                          <span>Destacar en Colección Principal</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-stone-200 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditingProduct(false)}
                        className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        id="btn-save-product-submit"
                        className="flex-1 py-2.5 px-5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                      >
                        {editingId ? 'Guardar Cambios' : 'Publicar Prenda en Catálogo'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Products List View */
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                      <div className="flex gap-2 flex-1 max-w-md">
                        <label htmlFor={searchFilterId} className="sr-only">Buscar por nombre</label>
                        <input
                          id={searchFilterId}
                          type="text"
                          placeholder="Buscar por nombre o categoría..."
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-stone-400"
                        />
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none"
                        >
                          {PRODUCT_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          id="btn-admin-sync-cloud-catalog"
                          onClick={handleBulkSyncToFirebase}
                          disabled={isSyncingCatalog}
                          className="bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                          title="Sincronizar todo el catálogo de productos con Firebase Firestore para todos los dispositivos"
                        >
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>{isSyncingCatalog ? 'Sincronizando...' : '☁️ Sincronizar con Firebase'}</span>
                        </button>

                        <button
                          id="btn-admin-create-product"
                          onClick={handleOpenCreateProduct}
                          className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Nueva Prenda</span>
                        </button>
                      </div>
                    </div>

                    {syncFeedback && (
                      <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <span>☁️</span>
                        <span>{syncFeedback}</span>
                      </div>
                    )}

                    <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                      {filteredProducts.length === 0 ? (
                        <div className="p-8 text-center text-xs text-stone-500">
                          No se encontraron productos con ese filtro.
                        </div>
                      ) : (
                        filteredProducts.map((prod) => (
                          <div
                            key={prod.id}
                            className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-stone-50/80 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-14 h-16 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                                <img
                                  src={prod.images[0] || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=200&q=80'}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] uppercase font-bold text-rose-800">
                                  {prod.category}
                                </span>
                                <h4 className="text-xs sm:text-sm font-semibold text-stone-900 truncate">
                                  {prod.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5 text-xs">
                                  <span className="font-bold text-stone-900">
                                    {formatCurrency(prod.price, storeSettings.currencySymbol)}
                                  </span>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                      prod.inStock
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-stone-200 text-stone-600'
                                    }`}
                                  >
                                    {prod.inStock ? 'En Stock' : 'Agotado'}
                                  </span>
                                  {prod.inStock && (prod.stock ?? prod.inventory) !== undefined && (
                                    <>
                                      {(prod.stock ?? prod.inventory)! > 0 && (prod.stock ?? prod.inventory)! < 3 ? (
                                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5 animate-pulse">
                                          🔥 {(prod.stock ?? prod.inventory)} { (prod.stock ?? prod.inventory) === 1 ? 'unidad' : 'unidades'}
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-stone-500 font-medium">
                                          ({prod.stock ?? prod.inventory} disp.)
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                id={`btn-edit-prod-${prod.id}`}
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                                title="Editar producto"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                id={`btn-delete-prod-${prod.id}`}
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de eliminar "${prod.name}"?`)) {
                                    onDeleteProduct(prod.id);
                                  }
                                }}
                                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ORDERS & LIVE NOTIFICATIONS */}
            {activeTab === 'orders' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                      <span>Pedidos Registrados ({orders.length})</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                        <Bell className="w-3 h-3 text-amber-600" />
                        <span>Notificaciones Automáticas Activas</span>
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500">
                      Al cambiar el estado de entrega o verificar un pago electrónico, el cliente recibe una notificación instantánea.
                    </p>
                  </div>

                  {orders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => exportOrdersToCsv(orders, storeSettings, currency)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                      title="Exportar todos los pedidos a formato CSV (Excel)"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Exportar a CSV ({orders.length})</span>
                    </button>
                  )}
                </div>

                {orders.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 space-y-2">
                    <ShoppingBag className="w-10 h-10 mx-auto text-stone-300" />
                    <p className="text-xs font-semibold text-stone-700">Aún no hay pedidos registrados</p>
                    <p className="text-[11px] text-stone-400">
                      Cuando un cliente complete su pedido, aparecerá aquí sincronizado con la base de datos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((ord) => {
                      const payBadge = getPaymentMethodBadge(ord.paymentMethod);
                      const payStatusBadge = getPaymentStatusBadge(ord.paymentStatus);

                      return (
                        <div
                          key={ord.id}
                          className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                                #{ord.id}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${payBadge.colorClass}`}>
                                <span>{payBadge.icon}</span>
                                <span>{payBadge.label}</span>
                              </span>
                              {ord.paymentReference && (
                                <span className="text-[11px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                                  Ref: {ord.paymentReference}
                                </span>
                              )}
                              <span className="text-xs text-stone-400">
                                {new Date(ord.createdAt).toLocaleDateString('es-NI', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>

                            {/* Dual Status Controls: Delivery Status + Electronic Payment Status */}
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-stone-500">Pago:</span>
                                <select
                                  value={ord.paymentStatus || 'pendiente'}
                                  onChange={(e) =>
                                    onUpdateOrderStatus(
                                      ord.id,
                                      ord.status,
                                      e.target.value as PaymentStatusType
                                    )
                                  }
                                  className={`text-xs font-bold rounded-lg border px-2 py-1 focus:outline-none cursor-pointer ${payStatusBadge.colorClass}`}
                                >
                                  <option value="pendiente">⏳ Pago Pendiente</option>
                                  <option value="en_verificacion">🔍 En Verificación</option>
                                  <option value="pagado">✅ Pago Confirmado</option>
                                  <option value="rechazado">❌ Pago Rechazado</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-stone-500">Entrega:</span>
                                <select
                                  value={ord.status}
                                  onChange={(e) =>
                                    onUpdateOrderStatus(
                                      ord.id,
                                      e.target.value as OrderRecord['status'],
                                      ord.paymentStatus
                                    )
                                  }
                                  className="text-xs font-bold rounded-lg border border-stone-300 px-2.5 py-1 bg-stone-900 text-white focus:outline-none cursor-pointer"
                                >
                                  <option value="pendiente">📦 Pendiente</option>
                                  <option value="en_preparacion">✨ Preparando</option>
                                  <option value="enviado">🛵 Enviado</option>
                                  <option value="entregado">🎉 Entregado</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Customer details */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-stone-700 bg-stone-50/70 p-3 rounded-xl">
                            <div>
                              <span className="text-stone-400 block text-[10px] uppercase font-bold">Cliente</span>
                              <span className="font-semibold text-stone-900">{ord.customerName}</span>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px] uppercase font-bold">Teléfono / WhatsApp</span>
                              <a
                                href={`https://wa.me/${ord.customerPhone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{ord.customerPhone}</span>
                              </a>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px] uppercase font-bold">Entrega ({ord.deliveryMethod || 'tienda'})</span>
                              <span>{ord.customerAddress || 'Retiro en tienda'} {ord.customerCity ? `(${ord.customerCity})` : ''}</span>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="text-xs space-y-1">
                            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Prendas:</span>
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between text-stone-800">
                                <span>
                                  {it.quantity}x {it.productName} {it.size ? `(Talla: ${it.size})` : ''}
                                </span>
                                <span className="font-medium">
                                  {formatCurrency(it.price * it.quantity, ord.currency || currency, storeSettings.exchangeRate)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Total Row & Receipt Action */}
                          <div className="pt-2 border-t border-stone-100 flex flex-wrap justify-between items-center gap-2 text-xs">
                            <span className="text-stone-500">
                              Envío: {ord.shipping === 0 ? 'Gratis' : formatCurrency(ord.shipping, ord.currency || currency, storeSettings.exchangeRate)}
                            </span>
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() =>
                                  generateReceiptPdf({
                                    order: ord,
                                    storeSettings,
                                    currency
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                                title="Descargar comprobante oficial en PDF"
                              >
                                <FileText className="w-3.5 h-3.5 text-violet-600" />
                                <span>Recibo PDF</span>
                              </button>

                              {onPrintInvoice && (
                                <button
                                  type="button"
                                  onClick={() => onPrintInvoice(ord)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 border border-amber-500 transition-all cursor-pointer shadow-2xs active:scale-95"
                                  title="Imprimir factura formal de compra"
                                >
                                  <Printer className="w-3.5 h-3.5 text-stone-950" />
                                  <span>Imprimir Factura</span>
                                </button>
                              )}
                              <div className="text-sm font-bold text-stone-950">
                                Total: <span className="text-rose-900 font-extrabold">{formatCurrency(ord.total, ord.currency || currency, storeSettings.exchangeRate)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: REGISTERED CUSTOMERS DIRECTORY (DATABASE) */}
            {activeTab === 'customers' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <span>Directorio de Cuentas de Clientes ({mergedCustomers.length})</span>
                    </h3>
                    <p className="text-xs text-stone-500">
                      Clientes registrados con cuenta en la nube o que han realizado pedidos en la tienda.
                    </p>
                  </div>
                </div>

                {mergedCustomers.length === 0 ? (
                  <div className="p-10 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 space-y-2">
                    <Users className="w-10 h-10 mx-auto text-stone-300" />
                    <p className="text-xs font-bold text-stone-700">Aún no hay cuentas de clientes registradas</p>
                    <p className="text-[11px] text-stone-400">
                      Cuando los clientes creen su cuenta o realicen un pedido, sus perfiles aparecerán aquí.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mergedCustomers.map((cust) => {
                      const payBadge = getPaymentMethodBadge(cust.preferredPaymentMethod as any);
                      return (
                        <div
                          key={cust.id}
                          className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-800 font-serif font-bold text-base flex items-center justify-center shrink-0">
                                {cust.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-xs sm:text-sm font-bold text-stone-900">{cust.name}</h4>
                                  {cust.isCloudAccount && (
                                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                                      ☁️ Cuenta Cloud
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-stone-500">
                                  {cust.city ? `Ubicación: ${cust.city}` : 'Cliente verificado'}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-black text-stone-900 block">
                                {formatCurrency(cust.totalSpent, currency, storeSettings.exchangeRate)}
                              </span>
                              <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                                {cust.ordersCount} pedido{cust.ordersCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-stone-400 font-semibold">WhatsApp:</span>
                              <a
                                href={`https://wa.me/${cust.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono font-bold text-emerald-700 hover:underline"
                              >
                                {cust.phone}
                              </a>
                            </div>
                            {cust.address && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-stone-400 font-semibold shrink-0">Dirección:</span>
                                <span className="truncate text-stone-700">{cust.address} {cust.city ? `(${cust.city})` : ''}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-stone-400 font-semibold">Pago preferido:</span>
                              <span className="font-semibold text-stone-800">{payBadge.icon} {payBadge.label}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: MODULAR ELECTRONIC PAYMENTS ARCHITECTURE */}
            {activeTab === 'payments' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                  <div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-sky-600" />
                      <span>Arquitectura de Pagos Electrónicos</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Habilita o configura pasarelas de tarjetas, links de pago, billeteras digitales y transferencias bancarias.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveGateways}
                    className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer shrink-0"
                  >
                    Guardar Pasarelas de Pago
                  </button>
                </div>

                {gatewaysSavedMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>¡Configuración de pasarelas electrónicas actualizada en la tienda!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gatewaysForm.map((gw) => (
                    <div
                      key={gw.id}
                      className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                        gw.enabled
                          ? 'border-stone-900 bg-white shadow-xs'
                          : 'border-stone-200 bg-stone-50/70 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{gw.icon}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs sm:text-sm font-bold text-stone-900">{gw.name}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                                {gw.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500">{gw.description}</p>
                          </div>
                        </div>

                        <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={gw.enabled}
                            onChange={() => handleToggleGateway(gw.id)}
                            className="w-4 h-4 rounded text-stone-900"
                          />
                          <span className="text-xs font-bold text-stone-800">
                            {gw.enabled ? 'Activo' : 'Inactivo'}
                          </span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-stone-100 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                            Proveedor / Pasarela
                          </label>
                          <input
                            type="text"
                            value={gw.providerName || ''}
                            onChange={(e) => handleUpdateGatewayField(gw.id, 'providerName', e.target.value)}
                            placeholder="Ej: Tilopay, Stripe, BAC CompraClick"
                            className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                            Enlace de Pago / Checkout URL (Opcional)
                          </label>
                          <input
                            type="url"
                            value={gw.paymentLinkUrl || ''}
                            onChange={(e) => handleUpdateGatewayField(gw.id, 'paymentLinkUrl', e.target.value)}
                            placeholder="https://checkout.pasarela.com/..."
                            className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                            Instrucciones al Cliente en el Checkout
                          </label>
                          <input
                            type="text"
                            value={gw.instructions}
                            onChange={(e) => handleUpdateGatewayField(gw.id, 'instructions', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4B: PUBLICIDAD DE NEGOCIOS DE NICARAGUA & GOOGLE ADSENSE */}
            {activeTab === 'ads' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Summary KPIs of Monetization */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-stone-950 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-80 block">
                      Ingresos por Publicidad
                    </span>
                    <span className="font-serif text-xl sm:text-2xl font-black">
                      {formatCurrency(
                        businessAds
                          .filter((a) => a.paymentStatus === 'pagado')
                          .reduce((acc, a) => acc + (a.pricePaid || 0), 0),
                        currency,
                        storeSettings.exchangeRate
                      )}
                    </span>
                    <span className="text-[10px] font-bold block mt-0.5">
                      Negocios de Nicaragua
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-900 text-white shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                      Anuncios Activos
                    </span>
                    <span className="font-serif text-xl sm:text-2xl font-black">
                      {businessAds.filter((a) => a.status === 'activo').length} / {businessAds.length}
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">
                      En portada, catálogo y directorio
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-violet-50 border border-violet-200 text-violet-950">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 block">
                      Impresiones de Anuncios
                    </span>
                    <span className="font-serif text-xl sm:text-2xl font-black">
                      {businessAds.reduce((acc, a) => acc + (a.impressions || 0), 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-violet-600 block mt-0.5">
                      Vistas acumuladas
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Clics a Anunciantes
                    </span>
                    <span className="font-serif text-xl sm:text-2xl font-black">
                      {businessAds.reduce((acc, a) => acc + (a.clicks || 0), 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-700 block mt-0.5">
                      Contactos generados
                    </span>
                  </div>
                </div>

                {/* Section 1: Google AdSense Configuration */}
                <div className="p-5 rounded-3xl border border-stone-200 bg-stone-50/70 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">
                          1. Configuración de Google AdSense
                        </h3>
                        <p className="text-xs text-stone-500">
                          Monetiza el tráfico de tu tienda con anuncios automáticos y bloques adaptables de Google.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                        <input
                          type="checkbox"
                          checked={adSenseForm.enabled}
                          onChange={(e) =>
                            setAdSenseForm({ ...adSenseForm, enabled: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-sky-600"
                        />
                        <span>Bloques AdSense Activos</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const updated: StoreSettings = {
                            ...storeSettings,
                            adSenseConfig: adSenseForm
                          };
                          setSettingsForm(updated);
                          onSaveSettings(updated);
                          setAdSenseSavedMsg(true);
                          setTimeout(() => setAdSenseSavedMsg(false), 3000);
                        }}
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Guardar Google AdSense
                      </button>
                    </div>
                  </div>

                  {adSenseSavedMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>¡Configuración de Google AdSense guardada exitosamente!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                        ID de Editor Google AdSense (Publisher ID)
                      </label>
                      <input
                        type="text"
                        value={adSenseForm.publisherId}
                        onChange={(e) =>
                          setAdSenseForm({ ...adSenseForm, publisherId: e.target.value })
                        }
                        placeholder="ca-pub-1234567890123456"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                        Slot ID Banner Catálogo
                      </label>
                      <input
                        type="text"
                        value={adSenseForm.inFeedSlotId || ''}
                        onChange={(e) =>
                          setAdSenseForm({ ...adSenseForm, inFeedSlotId: e.target.value })
                        }
                        placeholder="Ej: 1234567890"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                        Slot ID Pie de Página
                      </label>
                      <input
                        type="text"
                        value={adSenseForm.footerSlotId || ''}
                        onChange={(e) =>
                          setAdSenseForm({ ...adSenseForm, footerSlotId: e.target.value })
                        }
                        placeholder="Ej: 0987654321"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Nicaraguan Business Advertisements Manager */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-amber-600" />
                        <span>2. Anuncios Pagados de Negocios de Nicaragua ({businessAds.length})</span>
                      </h3>
                      <p className="text-xs text-stone-500">
                        Administra los negocios patrocinados, verifica sus pagos electrónicos y controla su visibilidad.
                      </p>
                    </div>

                    {onOpenCreateAdModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenCreateAdModal();
                        }}
                        className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Publicar Nuevo Anuncio</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {businessAds.map((ad) => {
                      const payStatusBadge = getPaymentStatusBadge(ad.paymentStatus);
                      return (
                        <div
                          key={ad.id}
                          className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={ad.imageUrl}
                              alt={ad.businessName}
                              className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                            />
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-stone-900">
                                  {ad.businessName}
                                </span>
                                <span className="text-[10px] font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full">
                                  📍 {ad.department} • {ad.category}
                                </span>
                                <span className="text-[10px] font-bold bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full">
                                  {ad.planName} (C$ {ad.pricePaid})
                                </span>
                              </div>
                              <p className="text-xs text-stone-700 font-medium truncate">
                                {ad.headline}
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-stone-500">
                                <span>Responsable: {ad.ownerName}</span>
                                <span>•</span>
                                <span>WhatsApp: {ad.whatsappPhone}</span>
                                <span>•</span>
                                <span className="font-bold text-stone-700">
                                  👁️ {ad.impressions} vistas | 👆 {ad.clicks} clics
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                            {/* Payment Verification Selector */}
                            <select
                              value={ad.paymentStatus}
                              onChange={(e) =>
                                onUpdateBusinessAd &&
                                onUpdateBusinessAd({
                                  ...ad,
                                  paymentStatus: e.target.value as PaymentStatusType
                                })
                              }
                              className={`text-xs font-bold rounded-lg border px-2.5 py-1.5 cursor-pointer ${payStatusBadge.colorClass}`}
                            >
                              <option value="pendiente">⏳ Pago Pendiente</option>
                              <option value="en_verificacion">🔍 En Verificación</option>
                              <option value="pagado">✅ Pagado (C$ {ad.pricePaid})</option>
                              <option value="rechazado">❌ Rechazado</option>
                            </select>

                            {/* Visibility Status Selector */}
                            <select
                              value={ad.status}
                              onChange={(e) =>
                                onUpdateBusinessAd &&
                                onUpdateBusinessAd({
                                  ...ad,
                                  status: e.target.value as BusinessAd['status']
                                })
                              }
                              className="text-xs font-bold rounded-lg border border-stone-300 px-2.5 py-1.5 bg-stone-900 text-white cursor-pointer"
                            >
                              <option value="activo">🟢 Activo en Tienda</option>
                              <option value="pendiente_aprobacion">🟡 En Revisión</option>
                              <option value="pausado">⏸️ Pausado</option>
                              <option value="expirado">⚪ Expirado</option>
                            </select>

                            {onDeleteBusinessAd && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Eliminar el anuncio de "${ad.businessName}"?`)) {
                                    onDeleteBusinessAd(ad.id);
                                  }
                                }}
                                className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar anuncio"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: CUSTOMER INQUIRIES */}
            {activeTab === 'inquiries' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-violet-600" />
                      <span>Mensajes y Consultas ({inquiries.length})</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {onOpenChat && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenChat();
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-amber-200" />
                        <span>Abrir Chat & Audios en Vivo</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
                      {(['todos', 'nuevo', 'contactado', 'cerrado'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setInquiryFilter(st)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                            inquiryFilter === st
                              ? 'bg-white text-stone-900 shadow-xs'
                              : 'text-stone-500 hover:text-stone-800'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {inquiries.length === 0 ? (
                  <div className="p-10 text-center bg-stone-50 rounded-3xl border border-stone-200 text-stone-500 space-y-2">
                    <MessageCircle className="w-8 h-8 mx-auto text-stone-400" />
                    <h4 className="text-sm font-bold text-stone-800">No hay mensajes de clientes aún</h4>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inquiries
                      .filter((inq) => inquiryFilter === 'todos' || inq.status === inquiryFilter)
                      .map((inq) => (
                        <div
                          key={inq.id}
                          className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-stone-900 text-sm">{inq.customerName}</span>
                              {inq.customerCity && (
                                <span className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                                  <MapPin className="w-3 h-3 inline mr-1" />
                                  {inq.customerCity}
                                </span>
                              )}
                              <span className="text-[11px] text-stone-400">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {new Date(inq.createdAt).toLocaleString('es-NI', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={inq.status}
                                onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value as CustomerInquiry['status'])}
                                className="text-xs bg-stone-100 border border-stone-200 rounded-lg px-2 py-1 text-stone-700"
                              >
                                <option value="nuevo">Nuevo</option>
                                <option value="contactado">Contactado</option>
                                <option value="cerrado">Cerrado</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleDeleteInquiry(inq.id)}
                                className="p-1 text-stone-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-800">
                            &ldquo;{inq.message}&rdquo;
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleReplyWhatsApp(inq)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>Responder por WhatsApp ({inq.customerPhone})</span>
                            </button>
                            <a
                              href={`tel:${inq.customerPhone}`}
                              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Llamar</span>
                            </a>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: ANALYTICS & SALES DASHBOARD */}
            {activeTab === 'analytics' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <AnalyticsView
                  analytics={analyticsData}
                  orders={orders}
                  products={products}
                  currency={currency}
                  exchangeRate={storeSettings.exchangeRate}
                  customersCount={mergedCustomers.length}
                  isCloudConnected={isCloudConnected}
                  onRefresh={handleRefreshAnalytics}
                />
              </div>
            )}

            {/* TAB 7: STORE SETTINGS */}
            {activeTab === 'settings' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <form onSubmit={handleSaveSettingsSubmit} className="max-w-xl mx-auto space-y-5">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-stone-900">
                      Configuración de la Tienda
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Personaliza el número de WhatsApp receptor de pedidos, cuenta bancaria LAFISE y costos de envío.
                    </p>
                  </div>

                  {settingsSavedSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>¡Configuración guardada exitosamente!</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label htmlFor={storeNameId} className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Nombre de la Tienda
                      </label>
                      <input
                        id={storeNameId}
                        type="text"
                        value={settingsForm.storeName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900"
                      />
                    </div>

                    <div>
                      <label htmlFor={storeTaglineId} className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Slogan / Subtítulo
                      </label>
                      <input
                        id={storeTaglineId}
                        type="text"
                        value={settingsForm.tagline}
                        onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900"
                      />
                    </div>

                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
                      <label htmlFor={storeWhatsappId} className="block text-xs font-bold text-emerald-950 uppercase tracking-wider">
                        📱 Número de WhatsApp para Recibir Pedidos *
                      </label>
                      <input
                        id={storeWhatsappId}
                        type="text"
                        required
                        value={settingsForm.whatsappNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs sm:text-sm text-stone-900 font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor={storeGreetingId} className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Saludo Inicial en Mensaje de WhatsApp
                      </label>
                      <input
                        id={storeGreetingId}
                        type="text"
                        value={settingsForm.whatsappCustomGreeting}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappCustomGreeting: e.target.value })}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label htmlFor={storeCurrencyId} className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Símbolo Moneda
                        </label>
                        <input
                          id={storeCurrencyId}
                          type="text"
                          value={settingsForm.currencySymbol}
                          onChange={(e) => setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })}
                          className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900"
                        />
                      </div>

                      <div>
                        <label htmlFor={storeShippingCostId} className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Costo de Envío
                        </label>
                        <input
                          id={storeShippingCostId}
                          type="number"
                          value={settingsForm.shippingCost}
                          onChange={(e) => setSettingsForm({ ...settingsForm, shippingCost: Number(e.target.value) })}
                          className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900"
                        />
                      </div>

                      <div>
                        <label htmlFor={storeFreeShippingThresholdId} className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Envío Gratis Desde
                        </label>
                        <input
                          id={storeFreeShippingThresholdId}
                          type="number"
                          value={settingsForm.freeShippingThreshold}
                          onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingThreshold: Number(e.target.value) })}
                          className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900"
                        />
                      </div>
                    </div>

                    {/* Datos Bancarios para Recibir Ganancias (97%) */}
                    <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">💳</span>
                          <div>
                            <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider">
                              Cuentas de Tu Tienda de Ropa (Ganancia 97%)
                            </h4>
                            <p className="text-[11px] text-sky-800">
                              Configura tu banco o billetera donde tus clientes te pagarán directo al ordenar.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-sky-950 mb-1">
                            Banco y Número de Cuenta
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: LAFISE 100234567 o BAC 360123456"
                            value={settingsForm.bankAccount || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, bankAccount: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs text-stone-900 font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-sky-950 mb-1">
                            Titular de la Cuenta
                          </label>
                          <input
                            type="text"
                            placeholder="Nombre del titular"
                            value={settingsForm.bankAccountHolder || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, bankAccountHolder: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs text-stone-900 font-semibold"
                          />
                        </div>
                      </div>

                      {/* 🛡️ PRIVACIDAD DEL DUEÑO Y MODELO DE COBRO ALTERNATIVO */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-stone-100 border-2 border-emerald-300 space-y-3.5 shadow-xs">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                                Privacidad del Dueño y Alternativas de Cobro
                              </h4>
                              <p className="text-[11px] text-stone-600">
                                Oculta tu teléfono y cuenta bancaria personal para no comprometer tus datos privados.
                              </p>
                            </div>
                          </div>

                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={settingsForm.hidePersonalAccountsFromPublic !== false}
                              onChange={(e) =>
                                setSettingsForm({
                                  ...settingsForm,
                                  hidePersonalAccountsFromPublic: e.target.checked
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                        </div>

                        {/* Privacy Mode Status Badge */}
                        <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="font-bold text-emerald-950">
                              {settingsForm.hidePersonalAccountsFromPublic !== false
                                ? '🛡️ Modo Privacidad ACTIVO: Tu teléfono y cuenta LAFISE están 100% ocultos del público'
                                : '⚠️ Modo Público: Tu número de teléfono y cuenta LAFISE son visibles'}
                            </span>
                          </div>
                        </div>

                        {/* Selector de Método de Cobro */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-stone-800">
                            ¿Cómo deseas monetizar o cobrar el porcentaje de la app?
                          </label>
                          <select
                            value={settingsForm.platformCollectionMethod || 'digital_link'}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                platformCollectionMethod: e.target.value as any
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 font-semibold focus:border-emerald-600 focus:outline-none cursor-pointer"
                          >
                            <option value="digital_link">
                              💳 Enlace de Pago Digital / Pasarela Comercial (PayPal / Stripe / Tilopay) [Recomendado]
                            </option>
                            <option value="passive_ads">
                              🌐 Monetización 100% Pasiva con Google AdSense (0% cobros a usuarios, sin transferencias)
                            </option>
                            <option value="voucher_prepago">
                              🎟️ Pases y Vouchers Prepago (Códigos de activación digital)
                            </option>
                            <option value="cuentas_bancarias">
                              🏦 Transferencia Bancaria Directa (Billetera / LAFISE)
                            </option>
                          </select>
                        </div>

                        {/* Configuración de Enlace Digital */}
                        {(settingsForm.platformCollectionMethod === 'digital_link' || !settingsForm.platformCollectionMethod) && (
                          <div className="space-y-2 p-3 bg-white/80 rounded-xl border border-stone-200">
                            <div>
                              <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                                URL del Enlace de Pago Digital Comercial (PayPal.me / Stripe / Tilopay / CompraClick):
                              </label>
                              <input
                                type="url"
                                placeholder="https://paypal.me/tu-tienda o enlace de cobro de pasarela"
                                value={settingsForm.platformPaymentLink || ''}
                                onChange={(e) =>
                                  setSettingsForm({
                                    ...settingsForm,
                                    platformPaymentLink: e.target.value
                                  })
                                }
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono text-stone-900 focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                                Nombre Comercial que verá el usuario en la pantalla de pago:
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: El Clóset de Jié Oficial"
                                value={settingsForm.platformBusinessName || ''}
                                onChange={(e) =>
                                  setSettingsForm({
                                    ...settingsForm,
                                    platformBusinessName: e.target.value
                                  })
                                }
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <p className="text-[10px] text-stone-500 italic">
                              * El pagador solo verá este nombre comercial y pagará con tarjeta o cuenta. Jamás conocerá tu teléfono personal ni tu cuenta bancaria privada.
                            </p>
                          </div>
                        )}

                        {settingsForm.platformCollectionMethod === 'passive_ads' && (
                          <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs text-emerald-950 space-y-1">
                            <span className="font-bold flex items-center gap-1.5">
                              <span>🎉 Ventaja de la Monetización Pasiva:</span>
                            </span>
                            <p className="text-[11px] text-emerald-900">
                              La aplicación es 100% libre y gratuita para tus usuarios (compradores y vendedores). Tú generas ingresos recurrentes mediante los anuncios de Google AdSense y marcas locales sin tener que cobrarle manualmente a ningún cliente.
                            </p>
                          </div>
                        )}

                        {/* Datos Internos Opcionales (Editables o Borrables) */}
                        <div className="pt-2 border-t border-stone-200">
                          <span className="block text-[11px] font-bold text-stone-700 mb-1.5">
                            Cuentas Internas del Administrador (Solo tú las ves en el panel de control):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-stone-500 mb-0.5">Billetera Móvil Interna:</label>
                              <input
                                type="text"
                                value={settingsForm.platformOwnerWallet || ''}
                                onChange={(e) => setSettingsForm({ ...settingsForm, platformOwnerWallet: e.target.value })}
                                placeholder="+505 00000000"
                                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono text-stone-900"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-stone-500 mb-0.5">Cuenta Bancaria Interna:</label>
                              <input
                                type="text"
                                value={settingsForm.platformOwnerAccount || ''}
                                onChange={(e) => setSettingsForm({ ...settingsForm, platformOwnerAccount: e.target.value })}
                                placeholder="134082049"
                                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono text-stone-900"
                              />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* 📱 Modo Ahorro de Datos Móviles (Catálogo Ligero) */}
                    <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shrink-0">
                            <WifiOff className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider">
                              Ahorro de Datos Móviles (Catálogo Ligero)
                            </h4>
                            <p className="text-[11px] text-sky-800">
                              Desactiva la carga automática de imágenes en alta resolución en el catálogo para reducir el consumo de paquetes de internet móvil (Claro / Tigo).
                            </p>
                          </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={Boolean(settingsForm.disableHighResCatalogImages)}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                disableHighResCatalogImages: e.target.checked
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                        </label>
                      </div>

                      <div className="p-2.5 bg-white/90 rounded-xl border border-sky-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              settingsForm.disableHighResCatalogImages ? 'bg-sky-500 animate-pulse' : 'bg-emerald-500'
                            }`}
                          />
                          <span className="font-semibold text-stone-700 text-[11px]">
                            {settingsForm.disableHighResCatalogImages
                              ? '📶 Catálogo Ligero ACTIVO: Comprime imágenes al ~80% de ahorro. Los clientes pueden pulsar "Cargar HD" cuando lo deseen.'
                              : '🖼️ Modo Alta Resolución: Las fotos del catálogo se descargan automáticamente con calidad completa.'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                      <label htmlFor={storePinId} className="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                        🔐 Llave Maestra de Seguridad (Solo Dueño)
                      </label>
                      <div className="relative">
                        <input
                          id={storePinId}
                          type={showSettingsPin ? 'text' : 'password'}
                          maxLength={50}
                          value={settingsForm.adminPin}
                          onChange={(e) => setSettingsForm({ ...settingsForm, adminPin: e.target.value })}
                          className="w-full px-3 py-2.5 pr-10 bg-white border border-amber-300 rounded-xl text-xs text-stone-900 font-mono font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsPin(!showSettingsPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                        >
                          {showSettingsPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 📦 Descargar Código para GitHub */}
                  <div className="p-4 bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-2xl space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🐙</span>
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Código Fuente y Respaldo / GitHub
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <a
                        href="/el-closet-de-jie.zip"
                        download="el-closet-de-jie.zip"
                        className="flex-1 py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar Archivo ZIP (.zip)</span>
                      </a>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      id="btn-save-settings"
                      className="flex-1 py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      Guardar Configuración
                    </button>

                    <button
                      type="button"
                      id="btn-reset-factory-products"
                      onClick={() => {
                        if (confirm('¿Deseas limpiar los productos almacenados localmente?')) {
                          onResetProducts();
                        }
                      }}
                      className="py-3 px-4 border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Limpiar Catálogo Local</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: MONETIZATION & OWNER EARNINGS */}
            {activeTab === 'monetization' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-stone-800">
                {/* Official Accounts Card */}
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-900 text-white shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center text-xl font-bold">
                        💰
                      </div>
                      <div>
                        <h3 className="font-serif text-lg sm:text-xl font-black">
                          Cuentas Oficiales del Dueño de la App
                        </h3>
                        <p className="text-xs text-emerald-200">
                          Aquí se reciben las comisiones del 2%, publicidad, suscripciones Pro y transferencias oficiales.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      {storeSettings.hidePersonalAccountsFromPublic && (
                        <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-lg flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Modo Privacidad Activo</span>
                        </span>
                      )}

                      {storeSettings.platformPaymentLink && (
                        <a
                          href={storeSettings.platformPaymentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Probar Enlace Digital</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(storeSettings.platformOwnerWallet || '+50558898311');
                          setCopiedOwnerWallet(true);
                          setTimeout(() => setCopiedOwnerWallet(false), 2500);
                        }}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-mono text-xs flex items-center gap-1.5 cursor-pointer border border-white/20 active:scale-95 transition-all"
                        title="Billetera de administración interna"
                      >
                        {copiedOwnerWallet ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-200" />
                            <span>¡Copiada!</span>
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Billetera: {storeSettings.platformOwnerWallet || '+505 58898311'}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(storeSettings.platformOwnerAccount || '134082049');
                          setCopiedOwnerAccount(true);
                          setTimeout(() => setCopiedOwnerAccount(false), 2500);
                        }}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-mono text-xs flex items-center gap-1.5 cursor-pointer border border-white/20 active:scale-95 transition-all"
                        title="Cuenta bancaria de administración interna"
                      >
                        {copiedOwnerAccount ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-sky-200" />
                            <span>¡Copiada!</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{storeSettings.platformOwnerBank || 'LAFISE'}: {storeSettings.platformOwnerAccount || '134082049'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Financial Metrics (100% Real Data - Zero Simulated Fallbacks) */}
                  {(() => {
                    const realOrdersTotal = orders.reduce((acc, o) => acc + (o.total || 0), 0);
                    const realEarnings = getSavedPlatformEarnings();
                    const confirmedTotal = realEarnings
                      .filter((e) => e.status === 'liquidado')
                      .reduce((sum, e) => sum + e.amountNIO, 0);
                    const pendingTotal = realEarnings
                      .filter((e) => e.status === 'pendiente_confirmacion')
                      .reduce((sum, e) => sum + e.amountNIO, 0);
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-emerald-800/60">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                          <span className="text-[10px] text-emerald-300 uppercase tracking-wider block font-bold">
                            Ventas Reales Totales (100%)
                          </span>
                          <p className="font-mono text-lg font-black text-white mt-0.5">
                            {formatCurrency(realOrdersTotal, currency, storeSettings.exchangeRate)}
                          </p>
                        </div>

                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                          <span className="text-[10px] text-sky-300 uppercase tracking-wider block font-bold">
                            A las Tiendas (98%)
                          </span>
                          <p className="font-mono text-lg font-black text-white mt-0.5">
                            {formatCurrency(realOrdersTotal * 0.98, currency, storeSettings.exchangeRate)}
                          </p>
                        </div>

                        <div className="p-3 bg-emerald-900/60 rounded-2xl border border-emerald-500/50">
                          <span className="text-[10px] text-amber-300 uppercase tracking-wider block font-bold">
                            🛡️ Ingresos Confirmados App
                          </span>
                          <p className="font-mono text-lg font-black text-amber-300 mt-0.5">
                            {formatCurrency(confirmedTotal, currency, storeSettings.exchangeRate)}
                          </p>
                        </div>

                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                          <span className="text-[10px] text-purple-300 uppercase tracking-wider block font-bold">
                            Por Confirmar (Pendientes)
                          </span>
                          <p className="font-mono text-lg font-black text-white mt-0.5">
                            {formatCurrency(pendingTotal, currency, storeSettings.exchangeRate)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Monetization Streams Explanation */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif text-base font-bold text-stone-900">
                        Vías de Monetización Activas en la Plataforma
                      </h4>
                      <p className="text-xs text-stone-500">
                        Cómo la app genera ingresos para el dueño: comisión del 2%, retiros PayPal y anuncios.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Method 1: Suscripciones */}
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">👑</span>
                        <div>
                          <h5 className="font-bold text-stone-900 text-xs">Suscripciones Mensuales Pro & VIP</h5>
                          <span className="text-[10px] text-amber-700 font-mono font-bold">C$ 150 / mes y C$ 350 / mes</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        Las tiendas pagan mensualmente para publicar productos ilimitados, tener comisión reducida y aparecer con banner publicitario en portada.
                      </p>
                      <div className="pt-1 text-[10px] text-emerald-800 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        ✓ {storeSettings.hidePersonalAccountsFromPublic ? 'Cobro procesado confidencialmente por pasarela digital oficial.' : `Cobro directo a Billetera ${storeSettings.platformOwnerWallet || '+505 58898311'} o cuenta bancaria.`}
                      </div>
                    </div>

                    {/* Method 2: Impulso de Prendas */}
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🔥</span>
                        <div>
                          <h5 className="font-bold text-stone-900 text-xs">Impulso de Prendas (Product Boost)</h5>
                          <span className="text-[10px] text-violet-700 font-mono font-bold">C$ 35, C$ 70 y C$ 120</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        Los vendedores pagan micro-tarifas para fijar sus prendas en el carrusel de inicio, búsquedas por voz y notificaciones.
                      </p>
                      <div className="pt-1 text-[10px] text-violet-800 font-semibold bg-violet-50 p-2 rounded-lg border border-violet-200">
                        ✓ Ingreso rápido y frecuente de alta rotación.
                      </div>
                    </div>

                    {/* Method 3: Sello Verificado */}
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🛡️</span>
                        <div>
                          <h5 className="font-bold text-stone-900 text-xs">Sello Oficial de Tienda Verificada</h5>
                          <span className="text-[10px] text-sky-700 font-mono font-bold">C$ 75 Pago Único</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        Verificación oficial de identidad que otorga la insignia dorada de tienda confiable a los vendedores en Nicaragua.
                      </p>
                      <div className="pt-1 text-[10px] text-sky-800 font-semibold bg-sky-50 p-2 rounded-lg border border-sky-200">
                        ✓ Otorga estatus preferente y máxima confianza a compradores.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Platform Commission Records */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                    Últimos Ingresos Reales Registrados
                  </h4>

                  <div className="space-y-2">
                    {getSavedPlatformEarnings().length === 0 ? (
                      <div className="p-6 text-center bg-white border border-dashed border-stone-300 rounded-xl text-stone-500 text-xs">
                        Aún no hay ingresos registrados. Aparecerán aquí automáticamente en tiempo real cuando entren pedidos reales, suscripciones Pro/VIP, impulsos o anuncios pagados.
                      </div>
                    ) : (
                      getSavedPlatformEarnings().slice(0, 8).map((earn) => (
                        <div
                          key={earn.id}
                          className="p-3 bg-white border border-stone-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2
                              className={`w-4 h-4 shrink-0 ${
                                earn.status === 'liquidado' ? 'text-emerald-600' : 'text-amber-500'
                              }`}
                            />
                            <div>
                              <span className="font-bold text-stone-900 block">{earn.title}</span>
                              <span className="text-[10px] text-stone-500">
                                {earn.storeOrUserName} • {earn.date} •{' '}
                                {earn.status === 'liquidado' ? 'Confirmado' : 'Pendiente confirmación'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-black text-emerald-800 block">
                              +{formatCurrency(earn.amountNIO, currency, storeSettings.exchangeRate)}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {earn.paymentDestination === 'paypal'
                                ? 'PayPal'
                                : earn.paymentDestination === 'billetera_movil'
                                ? 'Billetera'
                                : earn.paymentDestination === 'digital_link'
                                ? 'Enlace Digital'
                                : 'Cuenta Banco'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
