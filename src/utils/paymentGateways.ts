import { CurrencyType, PaymentGatewayConfig, PaymentMethodType, PaymentStatusType } from '../types';
import { formatCurrency } from './storage';

/**
 * Default modular configuration for current and future electronic payment gateways.
 * Allows seamless activation of credit/debit card processors (Tilopay, Stripe, BAC),
 * payment links (CompraClick, N1CO, PayPal), digital wallets, and bank transfers.
 */
export const DEFAULT_PAYMENT_GATEWAYS: PaymentGatewayConfig[] = [
  {
    id: 'lafise_transfer',
    name: 'Transferencia Bancaria / Móvil LAFISE',
    shortLabel: 'Transferencia LAFISE',
    description: 'Transferencia directa desde Bancanet LAFISE o transferencia interbancaria ACH en Córdobas o Dólares.',
    providerName: 'Banco LAFISE Bancentro',
    mode: 'active',
    enabled: true,
    instructions: 'Transfiere a la cuenta bancaria de la tienda vendedora (97%) y liquida la comisión del 3% de plataforma.',
    accountOrMerchantId: '',
    accountHolder: '',
    feePercent: 0,
    supportedCurrencies: ['cordobas', 'dolares']
  },
  {
    id: 'card_online',
    name: 'Tarjeta de Crédito o Débito (Visa / Mastercard)',
    shortLabel: 'Tarjeta en Línea',
    description: 'Pasarela electrónica preparada para cobros con tarjetas Visa, Mastercard y American Express (Arquitectura Tilopay / BAC / Stripe).',
    providerName: 'Pasarela Tilopay / BAC Credomatic / Stripe',
    mode: 'sandbox',
    enabled: true,
    instructions: 'Procesa tu pago con tarjeta de forma segura o genera una pre-autorización electrónica para tu pedido.',
    accountOrMerchantId: 'MERCHANT-PLATAFORMA-NI',
    publicKey: 'pk_sandbox_3ds2_ready',
    webhookEndpoint: '/api/webhooks/payments/card',
    feePercent: 0,
    supportedCurrencies: ['cordobas', 'dolares']
  },
  {
    id: 'payment_link',
    name: 'Link de Pago Electrónico (CompraClick / N1CO / PayPal)',
    shortLabel: 'Link de Pago',
    description: 'Recibe o abre un enlace de pago electrónico verificado para abonar con cualquier tarjeta desde tu celular o computadora.',
    providerName: 'BAC CompraClick / N1CO / PayPal',
    mode: 'sandbox',
    enabled: true,
    instructions: 'Solicita o abre el enlace directo de pago de la tienda y registra el código de comprobante electrónico.',
    feePercent: 0,
    supportedCurrencies: ['cordobas', 'dolares']
  },
  {
    id: 'mobile_wallet',
    name: 'Billetera Digital / Código QR Bancario',
    shortLabel: 'Billetera / QR',
    description: 'Pago rápido mediante escaneo de código QR bancario o billetera móvil (Kash / N1CO / Billetera Móvil).',
    providerName: 'Billetera Digital / QR Nicaragua',
    mode: 'sandbox',
    enabled: true,
    instructions: 'Envía a la billetera móvil de la tienda o escanea su código QR para pago instantáneo.',
    accountOrMerchantId: '',
    accountHolder: '',
    feePercent: 0,
    supportedCurrencies: ['cordobas', 'dolares']
  },
  {
    id: 'cash_on_delivery',
    name: 'Pago Contra Entrega / Efectivo al Recibir',
    shortLabel: 'Contra Entrega',
    description: 'Paga en efectivo al momento de retirar en tienda física o al coordinar tu entrega local.',
    providerName: 'Efectivo Local',
    mode: 'active',
    enabled: true,
    instructions: 'Prepara el monto exacto en Córdobas o Dólares al recibir tu pedido.',
    feePercent: 0,
    supportedCurrencies: ['cordobas', 'dolares']
  }
];

export interface ElectronicPaymentRequest {
  orderId: string;
  amountInCordobas: number;
  currency: CurrencyType;
  exchangeRate: number;
  method: PaymentMethodType;
  customerName: string;
  customerPhone: string;
  cardLast4?: string;
  cardHolder?: string;
  manualReference?: string;
}

export interface ElectronicPaymentResult {
  success: boolean;
  transactionReference: string;
  paymentStatus: PaymentStatusType;
  gatewayProvider: string;
  timestamp: string;
  receiptSummary: string;
}

/**
 * Modular Payment Gateway Adapter Executor.
 * Processes current bank transfers/cash and simulates/initializes electronic card,
 * link, and digital wallet transactions with structured transaction IDs so a live API
 * endpoint can be swapped in without changing checkout components.
 */
export async function executePaymentGatewayTransaction(
  request: ElectronicPaymentRequest,
  gateways: PaymentGatewayConfig[] = DEFAULT_PAYMENT_GATEWAYS
): Promise<ElectronicPaymentResult> {
  const gateway =
    gateways.find((g) => g.id === request.method) || DEFAULT_PAYMENT_GATEWAYS[0];

  const formattedAmount = formatCurrency(
    request.amountInCordobas,
    request.currency,
    request.exchangeRate
  );

  // Brief realistic processing delay for electronic methods
  if (request.method === 'card_online' || request.method === 'mobile_wallet') {
    await new Promise((resolve) => setTimeout(resolve, 650));
  }

  const randomCode = Math.floor(100000 + Math.random() * 900000);
  const nowIso = new Date().toISOString();

  switch (request.method) {
    case 'card_online': {
      const last4 = (request.cardLast4 || '4242').replace(/\D/g, '').slice(-4) || '4242';
      const ref = request.manualReference?.trim() || `AUTH-CARD-${last4}-${randomCode}`;
      return {
        success: true,
        transactionReference: ref,
        paymentStatus: 'verificando',
        gatewayProvider: gateway.providerName,
        timestamp: nowIso,
        receiptSummary: `Pre-autorización Electrónica Tarjeta **** ${last4} (${formattedAmount}) • Ref: ${ref}`
      };
    }

    case 'payment_link': {
      const ref = request.manualReference?.trim() || `LINK-${randomCode}`;
      return {
        success: true,
        transactionReference: ref,
        paymentStatus: request.manualReference?.trim() ? 'verificando' : 'pendiente',
        gatewayProvider: gateway.providerName,
        timestamp: nowIso,
        receiptSummary: `Link de Pago Electrónico (${formattedAmount}) • Ref: ${ref}`
      };
    }

    case 'mobile_wallet': {
      const ref = request.manualReference?.trim() || `QR-WALLET-${randomCode}`;
      return {
        success: true,
        transactionReference: ref,
        paymentStatus: 'verificando',
        gatewayProvider: gateway.providerName,
        timestamp: nowIso,
        receiptSummary: `Pago Billetera Digital / QR (${formattedAmount}) • Ref: ${ref}`
      };
    }

    case 'cash_on_delivery': {
      const ref = `EFECTIVO-${randomCode}`;
      return {
        success: true,
        transactionReference: ref,
        paymentStatus: 'pendiente',
        gatewayProvider: gateway.providerName,
        timestamp: nowIso,
        receiptSummary: `Pago en Efectivo Contra Entrega (${formattedAmount})`
      };
    }

    case 'lafise_transfer':
    default: {
      const ref = request.manualReference?.trim() || `LAFISE-PEND-${randomCode}`;
      return {
        success: true,
        transactionReference: ref,
        paymentStatus: request.manualReference?.trim() ? 'verificando' : 'pendiente',
        gatewayProvider: gateway.providerName,
        timestamp: nowIso,
        receiptSummary: `Transferencia Bancaria LAFISE (${formattedAmount}) • Ref: ${ref}`
      };
    }
  }
}

export function getPaymentMethodLabel(method?: PaymentMethodType): string {
  switch (method) {
    case 'card_online':
      return 'Tarjeta Crédito / Débito';
    case 'payment_link':
      return 'Link de Pago Electrónico';
    case 'mobile_wallet':
      return 'Billetera Digital / QR';
    case 'cash_on_delivery':
      return 'Pago Contra Entrega';
    case 'lafise_transfer':
    default:
      return 'Transferencia LAFISE';
  }
}

export function getPaymentStatusLabel(status?: PaymentStatusType): {
  label: string;
  colorClass: string;
} {
  switch (status) {
    case 'pagado':
      return {
        label: 'Pago Verificado',
        colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200'
      };
    case 'verificando':
      return {
        label: 'En Verificación',
        colorClass: 'text-sky-800 bg-sky-50 border-sky-200'
      };
    case 'reembolsado':
      return {
        label: 'Reembolsado',
        colorClass: 'text-rose-800 bg-rose-50 border-rose-200'
      };
    case 'pendiente':
    default:
      return {
        label: 'Pago Pendiente',
        colorClass: 'text-amber-900 bg-amber-50 border-amber-200'
      };
  }
}

export function getPaymentMethodBadge(method?: PaymentMethodType): {
  label: string;
  icon: string;
  colorClass: string;
} {
  switch (method) {
    case 'card_online':
    case 'tarjeta_credito_debito':
      return {
        label: 'Tarjeta en Línea',
        icon: '💳',
        colorClass: 'text-violet-800 bg-violet-50 border-violet-200'
      };
    case 'payment_link':
    case 'link_pago_electronico':
      return {
        label: 'Link de Pago',
        icon: '🔗',
        colorClass: 'text-indigo-800 bg-indigo-50 border-indigo-200'
      };
    case 'mobile_wallet':
    case 'billetera_movil_qr':
      return {
        label: 'Billetera / QR',
        icon: '📱',
        colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200'
      };
    case 'cash_on_delivery':
    case 'efectivo_contra_entrega':
      return {
        label: 'Contra Entrega',
        icon: '💵',
        colorClass: 'text-amber-800 bg-amber-50 border-amber-200'
      };
    case 'lafise_transfer':
    case 'transferencia_lafise':
    default:
      return {
        label: 'Transferencia LAFISE',
        icon: '🏦',
        colorClass: 'text-blue-800 bg-blue-50 border-blue-200'
      };
  }
}

export function getPaymentStatusBadge(status?: PaymentStatusType): {
  label: string;
  icon: string;
  colorClass: string;
} {
  switch (status) {
    case 'pagado':
      return {
        label: 'Pago Verificado',
        icon: '✅',
        colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200'
      };
    case 'verificando':
    case 'en_verificacion':
      return {
        label: 'En Verificación',
        icon: '⏳',
        colorClass: 'text-sky-800 bg-sky-50 border-sky-200'
      };
    case 'reembolsado':
      return {
        label: 'Reembolsado',
        icon: '↩️',
        colorClass: 'text-rose-800 bg-rose-50 border-rose-200'
      };
    case 'pendiente':
    default:
      return {
        label: 'Pago Pendiente',
        icon: '⚠️',
        colorClass: 'text-amber-900 bg-amber-50 border-amber-200'
      };
  }
}

export function getActivePaymentGateways(gateways?: PaymentGatewayConfig[]): PaymentGatewayConfig[] {
  const list = gateways && gateways.length > 0 ? gateways : DEFAULT_PAYMENT_GATEWAYS;
  return list.filter((g) => g.enabled);
}

