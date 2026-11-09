import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Mic,
  MicOff,
  Trash2,
  Smile,
  Store,
  Sparkles,
  ShoppingBag,
  Volume2,
  Heart,
  MessageCircle,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Radio,
  Play,
  RotateCcw,
  Check,
  Package
} from 'lucide-react';
import { CustomerChatMessage, Product, StoreSettings, UserAccount } from '../types';
import {
  getSavedChatMessages,
  saveChatMessage,
  deleteChatMessage,
  toggleLikeMessage,
  markConversationRead
} from '../utils/chatStorage';
import { AudioRecorder, generateSyntheticVoiceNote, formatAudioDuration } from '../utils/audioNotes';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { formatCurrency } from '../utils/storage';

interface CustomerChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  storeSettings: StoreSettings;
  products?: Product[];
  initialProduct?: Product | null;
  initialConversationId?: string;
  onOpenProductDetail?: (product: Product) => void;
  onOpenAuth?: () => void;
}

export const CustomerChatModal: React.FC<CustomerChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  storeSettings,
  products = [],
  initialProduct = null,
  initialConversationId = 'comunidad',
  onOpenProductDetail,
  onOpenAuth
}) => {
  // Always declare hooks unconditionally at top level
  const [messages, setMessages] = useState<CustomerChatMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<string>(initialConversationId);
  const [inputText, setInputText] = useState<string>('');
  const [attachedProduct, setAttachedProduct] = useState<Product | null>(initialProduct);
  const [guestName, setGuestName] = useState<string>('');
  const [isEditingGuestName, setIsEditingGuestName] = useState<boolean>(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recorderError, setRecorderError] = useState<string | null>(null);
  const [liveVolume, setLiveVolume] = useState<number>(10);
  const [pendingAudioPreview, setPendingAudioPreview] = useState<{
    audioUrl: string;
    duration: number;
  } | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const volumeIntervalRef = useRef<any>(null);

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Pre-seed and load messages
  useEffect(() => {
    if (isOpen) {
      const saved = getSavedChatMessages();
      setMessages(saved);
      markConversationRead(activeConversation);
      if (initialProduct) {
        setAttachedProduct(initialProduct);
      }
      if (initialConversationId) {
        setActiveConversation(initialConversationId);
      }
    }
  }, [isOpen, activeConversation, initialProduct, initialConversationId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeConversation]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
      if (recorderRef.current) recorderRef.current.cancel();
    };
  }, []);

  // Determine effective user name and role
  const effectiveSenderName =
    currentUser?.name ||
    guestName.trim() ||
    'Cliente ' + (currentUser?.phone ? currentUser.phone.slice(-4) : 'Comunidad');

  const effectiveSenderId = currentUser?.uid || currentUser?.phone || 'guest-user';
  const effectiveSenderRole = currentUser?.role || 'customer';

  // Start Voice Recording with 48kHz original voice preservation
  const handleStartRecording = async () => {
    setRecorderError(null);
    setPendingAudioPreview(null);
    try {
      const recorder = new AudioRecorder();
      await recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      volumeIntervalRef.current = setInterval(() => {
        if (recorderRef.current) {
          const vol = recorderRef.current.getVolumeLevel();
          setLiveVolume(vol);
        }
      }, 100);
    } catch (err: any) {
      console.warn('Microphone start error:', err);
      setRecorderError(
        'No se pudo acceder al micrófono. Por favor permite el acceso o usa el botón "Nota de Voz Demo" para probar.'
      );
      setIsRecording(false);
    }
  };

  // Cancel Recording
  const handleCancelRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    setRecorderError(null);
    setPendingAudioPreview(null);
  };

  // Stop Recording and open Preview (Allows hearing authentic vocal timbre)
  const handleStopAndPreviewAudio = async () => {
    if (!recorderRef.current) return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);

    try {
      const result = await recorderRef.current.stop();
      recorderRef.current = null;
      setIsRecording(false);
      setRecordingSeconds(0);
      setPendingAudioPreview(result);
    } catch (err) {
      console.error('Error stopping recorder:', err);
      setRecorderError('Error al procesar el audio.');
      setIsRecording(false);
    }
  };

  // Finish Recording & Send Audio Note Immediately
  const handleFinishAndSendAudio = async () => {
    if (!recorderRef.current) return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);

    try {
      const result = await recorderRef.current.stop();
      recorderRef.current = null;
      setIsRecording(false);
      setRecordingSeconds(0);
      commitSendAudioNote(result.audioUrl, result.duration);
    } catch (err) {
      console.error('Error stopping recorder:', err);
      setRecorderError('Error al guardar el audio.');
      setIsRecording(false);
    }
  };

  // Commit sending of previewed audio note
  const handleSendPendingPreviewAudio = () => {
    if (!pendingAudioPreview) return;
    commitSendAudioNote(pendingAudioPreview.audioUrl, pendingAudioPreview.duration);
    setPendingAudioPreview(null);
  };

  const commitSendAudioNote = (audioUrl: string, duration: number) => {
    const newMessage: CustomerChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      conversationId: activeConversation,
      senderId: effectiveSenderId,
      senderName: effectiveSenderName,
      senderRole: effectiveSenderRole,
      senderAvatar: currentUser?.photoURL || (effectiveSenderRole === 'admin' ? '👑' : effectiveSenderRole === 'seller' ? '🏪' : '🛍️'),
      recipientId: activeConversation === 'comunidad' ? 'all' : 'admin',
      text: inputText.trim() || '🎙️ Nota de voz con voz original',
      audioUrl,
      audioDuration: duration,
      productId: attachedProduct?.id,
      productName: attachedProduct?.name,
      productPrice: attachedProduct?.price,
      productImage: attachedProduct?.images?.[0],
      createdAt: new Date().toISOString(),
      likes: 0,
      read: true
    };

    const updated = saveChatMessage(newMessage);
    setMessages(updated);
    setInputText('');
    setAttachedProduct(null);
  };

  // Send a quick synthetic voice note (great for instant testing without mic permissions)
  const handleSendSyntheticVoiceNote = (type: 'saludo' | 'pregunta_talla' | 'consulta_envio' | 'oferta' = 'saludo') => {
    const synthetic = generateSyntheticVoiceNote(type);

    let defaultText = '🎙️ Nota de voz: Consulta sobre disponibilidad';
    if (type === 'pregunta_talla') defaultText = '🎙️ Nota de voz: Preguntando medidas y talla';
    if (type === 'consulta_envio') defaultText = '🎙️ Nota de voz: Consulta sobre envío con inDrive';
    if (type === 'oferta') defaultText = '🎙️ Nota de voz: Negociación de oferta';

    const newMessage: CustomerChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      conversationId: activeConversation,
      senderId: effectiveSenderId,
      senderName: effectiveSenderName,
      senderRole: effectiveSenderRole,
      senderAvatar: currentUser?.photoURL || (effectiveSenderRole === 'admin' ? '👑' : effectiveSenderRole === 'seller' ? '🏪' : '🛍️'),
      recipientId: activeConversation === 'comunidad' ? 'all' : 'admin',
      text: inputText.trim() || defaultText,
      audioUrl: synthetic.audioUrl,
      audioDuration: synthetic.duration,
      productId: attachedProduct?.id,
      productName: attachedProduct?.name,
      productPrice: attachedProduct?.price,
      productImage: attachedProduct?.images?.[0],
      createdAt: new Date().toISOString(),
      likes: 0,
      read: true
    };

    const updated = saveChatMessage(newMessage);
    setMessages(updated);
    setInputText('');
    setAttachedProduct(null);
    setRecorderError(null);
  };

  // Send Text Message
  const handleSendTextMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedProduct) return;

    const newMessage: CustomerChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      conversationId: activeConversation,
      senderId: effectiveSenderId,
      senderName: effectiveSenderName,
      senderRole: effectiveSenderRole,
      senderAvatar: currentUser?.photoURL || (effectiveSenderRole === 'admin' ? '👑' : effectiveSenderRole === 'seller' ? '🏪' : '🛍️'),
      recipientId: activeConversation === 'comunidad' ? 'all' : 'admin',
      text: inputText.trim(),
      productId: attachedProduct?.id,
      productName: attachedProduct?.name,
      productPrice: attachedProduct?.price,
      productImage: attachedProduct?.images?.[0],
      createdAt: new Date().toISOString(),
      likes: 0,
      read: true
    };

    const updated = saveChatMessage(newMessage);
    setMessages(updated);
    setInputText('');
    setAttachedProduct(null);
  };

  const handleLike = (id: string) => {
    const updated = toggleLikeMessage(id);
    setMessages(updated);
  };

  const handleDelete = (id: string) => {
    const updated = deleteChatMessage(id);
    setMessages(updated);
  };

  // Filter messages for current conversation
  const displayedMessages = messages
    .filter((m) => {
      if (activeConversation === 'comunidad') {
        return m.conversationId === 'comunidad' || !m.conversationId;
      }
      return m.conversationId === activeConversation;
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Quick suggestion chips
  const SUGGESTION_CHIPS = [
    '👋 ¡Hola! ¿Sigue disponible?',
    '📏 ¿Cuáles son las medidas exactas?',
    '💵 ¿Aceptan transferencia LAFISE o PayPal?',
    '🛵 ¿Hacen envíos con inDrive en Managua?',
    '✨ ¿Tiene algún detalle la prenda?'
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-chat-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-2xl h-[92vh] max-h-[790px] shadow-2xl flex flex-col overflow-hidden border border-stone-200">
        {/* 1. Header */}
        <div className="bg-gradient-to-r from-violet-950 via-indigo-950 to-stone-900 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <MessageCircle className="w-5 h-5 text-amber-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="customer-chat-title" className="font-serif font-black text-sm sm:text-base text-white truncate">
                  Mensajes & Chat de Clientes
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Audio HD 48kHz</span>
                </span>
              </div>
              <p className="text-[11px] text-stone-300 truncate">
                Comunícate con otros clientes y vendedores con texto y notas de audio en tu voz original.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar ventana de mensajes"
              aria-label="Cerrar chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Channel Selector Tabs & User Badge */}
        <div className="bg-stone-50 border-b border-stone-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-xl border border-stone-300/70 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveConversation('comunidad')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeConversation === 'comunidad' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-violet-600" />
              <span>💬 Comunidad de Clientes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveConversation('dm_tienda')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeConversation === 'dm_tienda' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>🏪 Vendedores & Boutique</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveConversation('dm_pedidos')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeConversation === 'dm_pedidos' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-sky-600" />
              <span>📦 Pedidos & Soporte</span>
            </button>
          </div>

          {/* User Identifier */}
          <div className="flex items-center gap-1.5 text-[11px] text-stone-600">
            <span>Tú eres:</span>
            {isEditingGuestName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Tu nombre..."
                  className="px-2 py-0.5 bg-white border border-stone-300 rounded text-xs w-28"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsEditingGuestName(false)}
                  className="text-[10px] bg-stone-900 text-white px-1.5 py-0.5 rounded font-bold"
                >
                  OK
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (currentUser?.isLoggedIn) {
                    if (onOpenAuth) onOpenAuth();
                  } else {
                    setIsEditingGuestName(true);
                  }
                }}
                className="font-bold text-violet-700 underline underline-offset-2 hover:text-violet-900 cursor-pointer"
                title="Haz clic para cambiar tu nombre en el chat"
              >
                {effectiveSenderName} {currentUser?.isLoggedIn ? '✓' : '✏️'}
              </button>
            )}
          </div>
        </div>

        {/* 3. Messages Feed */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-stone-50/60 scrollbar-thin scrollbar-thumb-stone-300">
          {displayedMessages.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <MessageCircle className="w-10 h-10 mx-auto text-stone-300 stroke-[1.5]" />
              <p className="text-xs font-semibold">¡Aún no hay mensajes en este canal!</p>
              <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                Sé la primera en escribir o grabar una nota de voz con tu voz original para platicar con clientes o el vendedor.
              </p>
            </div>
          ) : (
            displayedMessages.map((msg) => {
              const isMe = msg.senderId === effectiveSenderId;

              return (
                <div key={msg.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}>
                  {/* Sender Header */}
                  <div className="flex items-center gap-1.5 text-[11px] px-1 text-stone-500">
                    {msg.senderAvatar?.startsWith('data:') || msg.senderAvatar?.startsWith('http') ? (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-4 h-4 rounded-full object-cover border border-violet-300 shrink-0"
                      />
                    ) : (
                      <span className="text-xs">{msg.senderAvatar || '👤'}</span>
                    )}
                    <span className="font-bold text-stone-700">{isMe ? 'Tú' : msg.senderName}</span>
                    {msg.senderRole === 'admin' && (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded font-mono">
                        DUEÑO / TIENDA
                      </span>
                    )}
                    {msg.senderRole === 'seller' && (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded font-mono">
                        VENDEDOR
                      </span>
                    )}
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Attached Product Card (if applicable) */}
                  {msg.productName && (
                    <div
                      onClick={() => {
                        if (msg.productId && onOpenProductDetail) {
                          const prod = products.find((p) => p.id === msg.productId);
                          if (prod) onOpenProductDetail(prod);
                        }
                      }}
                      className="bg-white rounded-xl border border-violet-200/90 p-2 flex items-center gap-2.5 max-w-xs sm:max-w-sm shadow-2xs hover:border-violet-400 cursor-pointer transition-all"
                    >
                      {msg.productImage && (
                        <img
                          src={msg.productImage}
                          alt={msg.productName}
                          className="w-12 h-12 object-cover rounded-lg shrink-0 border border-stone-100"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider block">
                          Prenda en Consulta
                        </span>
                        <div className="text-xs font-black text-stone-900 truncate">{msg.productName}</div>
                        {msg.productPrice !== undefined && (
                          <div className="text-xs font-extrabold text-stone-900 font-mono">C$ {msg.productPrice}</div>
                        )}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    </div>
                  )}

                  {/* Message Bubble: Audio vs Text */}
                  {msg.audioUrl ? (
                    <div className="space-y-1">
                      {msg.text && msg.text !== '🎙️ Nota de voz con voz original' && msg.text !== '🎙️ Nota de voz enviada' && (
                        <div
                          className={`p-2.5 rounded-2xl text-xs ${
                            isMe
                              ? 'bg-violet-700 text-white rounded-br-xs'
                              : 'bg-white border border-stone-200 text-stone-900 rounded-bl-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      )}
                      <VoiceNotePlayer audioUrl={msg.audioUrl} duration={msg.audioDuration} variant={isMe ? 'outgoing' : 'incoming'} />
                    </div>
                  ) : (
                    <div
                      className={`p-3 rounded-2xl text-xs max-w-sm sm:max-w-md shadow-2xs leading-relaxed ${
                        isMe
                          ? 'bg-gradient-to-r from-violet-700 to-indigo-800 text-white rounded-br-xs'
                          : 'bg-white border border-stone-200 text-stone-900 rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}

                  {/* Actions / Reactions */}
                  <div className="flex items-center gap-2 px-1 text-[10px] text-stone-400">
                    <button
                      type="button"
                      onClick={() => handleLike(msg.id)}
                      className="hover:text-rose-600 flex items-center gap-0.5 cursor-pointer transition-colors"
                      title="Dar me gusta"
                    >
                      <Heart className={`w-3 h-3 ${(msg.likes || 0) > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                      {(msg.likes || 0) > 0 && <span>{msg.likes}</span>}
                    </button>

                    {(isMe || currentUser?.role === 'admin') && (
                      <button
                        type="button"
                        onClick={() => handleDelete(msg.id)}
                        className="hover:text-red-600 transition-colors cursor-pointer"
                        title="Eliminar mensaje"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 4. Attached Garment Notice Bar (if any) */}
        {attachedProduct && (
          <div className="bg-violet-50/80 border-t border-violet-200 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs">👗</span>
              <span className="text-xs font-semibold text-violet-950 truncate">
                Adjuntando: <strong>{attachedProduct.name}</strong> ({formatCurrency(attachedProduct.price, 'cordobas', storeSettings.exchangeRate)})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedProduct(null)}
              className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              title="Quitar prenda adjunta"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 5. Quick Suggestion Chips */}
        <div className="bg-white border-t border-stone-100 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {SUGGESTION_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText((prev) => (prev ? `${prev} ${chip}` : chip))}
              className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-violet-50 hover:text-violet-700 text-stone-600 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer shrink-0 border border-stone-200/80"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* 6. Active Voice Recorder Bar (When Recording) */}
        {isRecording ? (
          <div className="p-3 bg-rose-50 border-t border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-rose-700 text-sm">
                    Grabando: {formatAudioDuration(recordingSeconds)}
                  </span>
                  <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.2 rounded-full font-bold">
                    Voz Original HD (48kHz)
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 block">
                  Sin distorsión robótica ni filtros metálicos.
                </span>
              </div>

              {/* Dynamic Sound Wave Visualizer based on real volume */}
              <div className="flex items-center gap-0.5 h-6 px-2">
                {[12, 28, 42, 65, 80, 50, 30, 20].map((h, i) => {
                  const dynamicHeight = Math.max(4, Math.min(26, Math.round((h * liveVolume) / 40)));
                  return (
                    <span
                      key={i}
                      style={{ height: `${dynamicHeight}px` }}
                      className="w-1 bg-rose-500 rounded-full transition-all duration-75"
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCancelRecording}
                className="px-3 py-1.5 rounded-xl bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Cancelar</span>
              </button>

              <button
                type="button"
                onClick={handleStopAndPreviewAudio}
                className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                title="Escucha tu voz antes de enviar"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>Escuchar Previa</span>
              </button>

              <button
                type="button"
                onClick={handleFinishAndSendAudio}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Directo</span>
              </button>
            </div>
          </div>
        ) : pendingAudioPreview ? (
          /* Preview Drawer: Hear your original voice before sending */
          <div className="p-3.5 bg-gradient-to-r from-violet-50 to-indigo-50 border-t border-violet-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shrink-0">
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
              <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold shrink-0">
                🎙️
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-violet-950 text-xs">Previa de Audio ({formatAudioDuration(pendingAudioPreview.duration)})</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
                    ✓ Voz Natural Verificada
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 truncate">
                  Presiona reproducir para verificar la fidelidad de tu voz.
                </p>
                <div className="pt-1">
                  <VoiceNotePlayer audioUrl={pendingAudioPreview.audioUrl} duration={pendingAudioPreview.duration} variant="incoming" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setPendingAudioPreview(null)}
                className="px-3 py-2 rounded-xl bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                <span>Descartar</span>
              </button>

              <button
                type="button"
                onClick={handleSendPendingPreviewAudio}
                className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar mi Voz</span>
              </button>
            </div>
          </div>
        ) : (
          /* 7. Standard Message Composer */
          <div className="p-2.5 sm:p-3 bg-white border-t border-stone-200 flex flex-col gap-2 shrink-0">
            {recorderError && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{recorderError}</span>
                </div>
                <button type="button" onClick={() => setRecorderError(null)} className="text-stone-400 hover:text-stone-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleSendTextMessage} className="flex items-center gap-2">
              {/* Voice Record Button */}
              <button
                type="button"
                id="btn-record-voice-note"
                onClick={handleStartRecording}
                className="w-10 h-10 rounded-2xl bg-violet-100 hover:bg-violet-200 text-violet-800 flex items-center justify-center transition-transform active:scale-95 cursor-pointer shrink-0 relative group"
                title="Grabar nota de audio con tu voz original"
                aria-label="Grabar audio"
              >
                <Mic className="w-5 h-5 text-violet-700" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
              </button>

              {/* Text Input */}
              <input
                type="text"
                id="input-customer-chat-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe un mensaje o presiona el micrófono para hablar..."
                className="flex-1 px-3.5 py-2.5 bg-stone-100 hover:bg-stone-100/80 focus:bg-white border border-stone-200 focus:border-violet-500 rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none transition-colors"
              />

              {/* Send Button */}
              <button
                type="submit"
                id="btn-send-chat-message"
                disabled={!inputText.trim() && !attachedProduct}
                className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md shrink-0"
                title="Enviar mensaje"
                aria-label="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Voice Note Trigger (for testing & instant voice notes) */}
            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5 px-1">
              <span className="flex items-center gap-1">
                <span>🎙️</span>
                <span className="font-medium text-stone-700">Audio 48kHz HD (Voz Original)</span>
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-stone-400">¿Sin micrófono?</span>
                <button
                  type="button"
                  onClick={() => handleSendSyntheticVoiceNote('pregunta_talla')}
                  className="text-[10px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded-lg border border-violet-200 cursor-pointer transition-colors"
                  title="Simula una nota de audio con sonido melódico sintetizado para probar el reproductor"
                >
                  + Enviar Audio Demo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
