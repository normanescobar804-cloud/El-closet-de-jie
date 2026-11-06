import { CustomerChatMessage, CustomerChatConversation } from '../types';
import { generateSyntheticVoiceNote } from './audioNotes';

const CHAT_STORAGE_KEY = 'closet_jie_customer_chat_v1';

// Pre-seeded initial conversations between customers with authentic audio voice notes
function getInitialSampleMessages(): CustomerChatMessage[] {
  const now = Date.now();
  const voiceNote1 = generateSyntheticVoiceNote('pregunta_talla');
  const voiceNote2 = generateSyntheticVoiceNote('consulta_envio');
  const voiceNote3 = generateSyntheticVoiceNote('saludo');

  return [
    {
      id: 'msg-demo-1',
      conversationId: 'comunidad',
      conversationTitle: 'Mercadillo & Preguntas de Clientes',
      senderId: 'user-nicole-m',
      senderName: 'Nicole Morales',
      senderRole: 'customer',
      senderAvatar: '👗',
      recipientId: 'all',
      text: '¡Hola a todos! 👋 ¿Alguien sabe si el Vestido Floral todavía está disponible en Talla M? Me gustaría probármelo.',
      productId: 'prod-1',
      productName: 'Vestido Floral de Verano',
      productPrice: 650,
      productImage: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
      createdAt: new Date(now - 1000 * 60 * 55).toISOString(),
      likes: 3,
      read: true
    },
    {
      id: 'msg-demo-2',
      conversationId: 'comunidad',
      conversationTitle: 'Mercadillo & Preguntas de Clientes',
      senderId: 'user-jie-admin',
      senderName: 'El Clóset de Jié (Tienda)',
      senderRole: 'admin',
      senderAvatar: '✨',
      recipientId: 'all',
      text: '¡Hola Nicole! Sí, nos queda 1 disponible en Talla M. Escucha este audio con los detalles de las medidas de cintura y busto:',
      audioUrl: voiceNote1.audioUrl,
      audioDuration: voiceNote1.duration,
      createdAt: new Date(now - 1000 * 60 * 42).toISOString(),
      likes: 5,
      read: true
    },
    {
      id: 'msg-demo-3',
      conversationId: 'comunidad',
      conversationTitle: 'Mercadillo & Preguntas de Clientes',
      senderId: 'user-carlos-seller',
      senderName: 'Carlos Moda Urbana',
      senderRole: 'seller',
      senderAvatar: '🧢',
      recipientId: 'all',
      text: 'Buenas tardes a la comunidad. Acabo de publicar unas chaquetas denim oversize en perfecto estado, acepto pago por transferencia LAFISE o entrega personal.',
      productId: 'prod-4',
      productName: 'Chaqueta Denim Oversize',
      productPrice: 850,
      productImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
      createdAt: new Date(now - 1000 * 60 * 25).toISOString(),
      likes: 2,
      read: true
    },
    {
      id: 'msg-demo-4',
      conversationId: 'comunidad',
      conversationTitle: 'Mercadillo & Preguntas de Clientes',
      senderId: 'user-sofia-granada',
      senderName: 'Sofía Rivas',
      senderRole: 'customer',
      senderAvatar: '🛍️',
      recipientId: 'all',
      text: '¡Excelente! Les mando nota de voz consultando si hacen envíos por inDrive o mandan por encomienda fuera de Managua:',
      audioUrl: voiceNote2.audioUrl,
      audioDuration: voiceNote2.duration,
      createdAt: new Date(now - 1000 * 60 * 12).toISOString(),
      likes: 4,
      read: false
    },
    // Direct chat demo: Nicole <-> Tienda Jié
    {
      id: 'msg-dm-1',
      conversationId: 'dm_user-nicole-m',
      conversationTitle: 'Chat con Nicole Morales',
      senderId: 'user-nicole-m',
      senderName: 'Nicole Morales',
      senderRole: 'customer',
      senderAvatar: '👗',
      recipientId: 'admin',
      recipientName: 'El Clóset de Jié',
      text: 'Hola, me encanta la blusa de lino. ¿La tienen en color beige?',
      productId: 'prod-2',
      productName: 'Blusa de Lino Blanca',
      productPrice: 420,
      productImage: 'https://images.unsplash.com/photo-1534126511673-b6899657816a?auto=format&fit=crop&w=600&q=80',
      createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
      read: true
    },
    {
      id: 'msg-dm-2',
      conversationId: 'dm_user-nicole-m',
      conversationTitle: 'Chat con Nicole Morales',
      senderId: 'admin',
      senderName: 'El Clóset de Jié',
      senderRole: 'admin',
      senderAvatar: '✨',
      recipientId: 'user-nicole-m',
      recipientName: 'Nicole Morales',
      text: '¡Hola Nicole! Sí la tenemos en beige y en blanco. Te grabé esta nota de voz explicándote cómo pedirla con envío inDrive:',
      audioUrl: voiceNote3.audioUrl,
      audioDuration: voiceNote3.duration,
      createdAt: new Date(now - 1000 * 60 * 18).toISOString(),
      read: false
    }
  ];
}

export function getSavedChatMessages(): CustomerChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSampleMessages();
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = getInitialSampleMessages();
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch (error) {
    console.warn('Error reading chat messages from storage:', error);
    return getInitialSampleMessages();
  }
}

export function saveChatMessage(message: CustomerChatMessage): CustomerChatMessage[] {
  const current = getSavedChatMessages();
  const updated = [message, ...current];
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving chat message:', err);
  }
  return updated;
}

export function deleteChatMessage(messageId: string): CustomerChatMessage[] {
  const current = getSavedChatMessages();
  const updated = current.filter((m) => m.id !== messageId);
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting chat message:', err);
  }
  return updated;
}

export function toggleLikeMessage(messageId: string): CustomerChatMessage[] {
  const current = getSavedChatMessages();
  const updated = current.map((m) => {
    if (m.id === messageId) {
      return { ...m, likes: (m.likes || 0) + 1 };
    }
    return m;
  });
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error liking chat message:', err);
  }
  return updated;
}

export function markConversationRead(conversationId: string): CustomerChatMessage[] {
  const current = getSavedChatMessages();
  const updated = current.map((m) => {
    if (m.conversationId === conversationId && !m.read) {
      return { ...m, read: true };
    }
    return m;
  });
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error marking conversation read:', err);
  }
  return updated;
}

export function getUnreadChatCount(): number {
  const messages = getSavedChatMessages();
  return messages.filter((m) => !m.read).length;
}
