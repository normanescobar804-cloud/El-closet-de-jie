# 👗 El closet de jie - Tienda Online de Moda & Peluches

Tienda moderna, rápida y responsive diseñada para la venta de ropa nueva, seminueva y peluches en **Nicaragua** (Managua y envíos departamentales). Cuenta con integración directa de pedidos por **WhatsApp**, cálculo de envíos por **inDrive / Delivery / Encomienda CargoTrans**, conversión de moneda en tiempo real (**C$ Córdobas y $ Dólares**), pasarela informativa de pagos (**LAFISE Bancentro y Efectivo**), y panel administrativo con contraseña protegida.

---

## 🌟 Características Principales

### 🛍️ Experiencia de Compra del Cliente
- **Catálogo de Prendas y Peluches**: Filtrado por categorías (*Vestidos, Blusas, Camisetas, Pantalones, Niños, Peluches, etc.*), tallas (*XS hasta XL y Única*), rangos de precio y buscador inteligente instantáneo.
- **Selector de Moneda Dinámico**: Alterna entre **Córdobas (C$)** y **Dólares ($)** con tasa de cambio oficial configurable.
- **Carrito de Compras Completo**:
  - Ajuste de cantidades, selección de tallas y colores.
  - Cálculo automático de subtotal, descuentos de promociones y costos de envío.
  - Métodos de entrega: **inDrive Express** (con punto de referencia para el motorizado), **Envío Departamental (CargoTrans)** o **Retiro en Tienda Física**.
- **Checkout directo a WhatsApp**: Genera un mensaje estructurado y detallado listo para enviar al WhatsApp de la tienda con un solo toque, con código único de pedido (ej. `#JIET-829104`).
- **Historial de Pedidos y Rastreabilidad**:
  - Pestaña de historial en el perfil del cliente.
  - Stepper visual de progreso en 4 fases: *Pendiente de confirmación 🟡 → En preparación 🔵 → En camino 🟣 → Entregado 🟢*.
  - Función **"Volver a pedir"** para agregar compras pasadas de nuevo al carrito.
  - Rastreo directo para usuarios invitados con su número o código de orden.
- **Favoritos (Wishlist)**: Guarda prendas que te gusten para verlas luego o agregarlas todas juntas al carrito.
- **Reseñas con Calificación de 5 Estrellas**: Valoraciones de clientes reales con fotos y comentarios.

### ⚙️ Panel de Administración (Gestión Completa de la Tienda)
- **Acceso Protegido por Contraseña**: Inicio de sesión administrativo con PIN/Clave segura y opción de cambiar contraseña.
- **Gestor de Catálogo de Productos**:
  - Agregar prendas nuevas con subida de fotos desde la galería del celular o computadora (soporte de compresión automática de imágenes a base64 / URLs).
  - Editar precios, descripciones, tallas, colores y control de stock (*Disponible / Agotado*).
  - Eliminación segura con confirmación.
- **Configuración de Tienda y Métodos de Pago**:
  - Modificar número de WhatsApp receptor de pedidos.
  - Modificar tasa de cambio oficial (ej. 36.62 C$/$).
  - Configurar números de cuenta bancaria (LAFISE Bancentro C$ y $).
  - Modificar horarios y dirección de la tienda física.
- **Registro y Supervisión de Pedidos**:
  - Lista de todas las órdenes emitidas en la tienda con su estado, monto total y datos del cliente.
  - Cambio de estado de cada pedido (*Pendiente, En preparación, Enviado, Entregado*).
- **Exportación Directa a GitHub / Respaldo**:
  - Descarga instantánea de todo el código fuente en `.zip` o archivo comprimido.
  - Enlaces directos para sincronizar con repositorios de GitHub.

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Estilos & UI**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Iconografía**: [Lucide React](https://lucide.dev/)
- **Animaciones**: [Motion (Framer Motion)](https://motion.dev/)
- **Persistencia de Datos**: LocalStorage estructurado con sincronización reactiva y soporte para respaldos.

---

## 🚀 Instalación y Ejecución Local

Sigue estos pasos para correr el proyecto en tu computadora:

### 1. Clonar el repositorio
```bash
git clone https://github.com/normanescobar804-cloud/El-closet-de-ji.git
cd El-closet-de-ji
```

### 2. Instalar dependencias
Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior):
```bash
npm install
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```
Abre tu navegador en `http://localhost:3000` (o el puerto indicado en la consola).

### 4. Compilar para producción
```bash
npm run build
```
Los archivos estáticos optimizados se generarán en la carpeta `dist/`.

---

## 📁 Estructura del Proyecto

```text
├── index.html                  # Punto de entrada HTML principal
├── package.json                # Dependencias y scripts de Node
├── vite.config.ts              # Configuración de Vite y Tailwind
├── tsconfig.json               # Configuración de TypeScript
├── public/                     # Archivos estáticos e imágenes descargables
│   ├── el-closet-de-jie.zip    # Archivo ZIP descargable del código
│   └── portada.jpg             # Portada de bienvenida
└── src/
    ├── main.tsx                # Entrada de la aplicación React
    ├── App.tsx                 # Componente principal con estado global
    ├── index.css               # Estilos globales con Tailwind CSS
    ├── types.ts                # Tipos e interfaces de TypeScript
    ├── data/
    │   └── initialProducts.ts  # Catálogo inicial de productos y datos de prueba
    ├── utils/
    │   └── storage.ts          # Manejo de persistencia local y formateo de moneda
    └── components/             # Componentes modulares
        ├── Header.tsx          # Barra de navegación superior
        ├── HeroBanner.tsx      # Banner principal de la tienda
        ├── ProductCard.tsx     # Tarjeta interactiva de producto
        ├── ProductDetailModal.tsx # Modal con detalles y selección de tallas
        ├── CartDrawer.tsx      # Carrito de compras lateral y checkout WhatsApp
        ├── QuickAuthModal.tsx  # Modal de inicio de sesión y perfil de cliente
        ├── OrderHistorySection.tsx # Historial interactivo de pedidos y estados
        ├── FavoritesModal.tsx  # Modal de prendas favoritas guardadas
        ├── AdminModal.tsx      # Panel de control y administración de la tienda
        ├── GitHubExportModal.tsx # Asistente de exportación a GitHub
        ├── Toast.tsx           # Notificaciones flotantes interactivas
        └── Footer.tsx          # Pie de página y enlaces de contacto
```

---

## 🔒 Datos Administrativos por Defecto

- **Contraseña inicial del Panel de Administración**: `admin123` (se puede cambiar dentro del panel).
- **Moneda base**: Córdobas nicaragüenses (NIO) con conversión a Dólares (USD).

---

## 📄 Licencia

Este proyecto es privado y de uso exclusivo para la tienda **El closet de jie**.
Desarrollado con ❤️ para brindar la mejor experiencia de compra en línea en Nicaragua.
