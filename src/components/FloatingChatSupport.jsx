// src/components/FloatingChatSupport.jsx
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  MessageCircle,
  X,
  Send,
  Minus,
  Paperclip,
  Image as ImageIcon,
  Maximize2,
  Loader2,
  AlertCircle,
  FileText,
  Eye,
  Download,
  Check,
  CheckCheck,
  User,
  UserX,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import ChatService from "../services/chatService";
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isSameDay,
  differenceInCalendarDays,
} from "date-fns";
import { fr } from "date-fns/locale";

// ============================================
// COMPOSANT MESSAGE MÉMOÏSÉ POUR PERFORMANCE
// ============================================
const MessageItem = React.memo(
  ({
    msg,
    index,
    messages,
    isMe,
    openImageViewer,
    resolveChatFileUrl,
    getVisitorDisplayName,
    formatTime,
    MessageStatusIcon,
  }) => {
    const displayInfo = getVisitorDisplayName(
      msg.isanonymous,
      msg.sendername,
      msg.senderreference
    );

    const fileUrl = resolveChatFileUrl(msg.fileinfo);

    // CALCUL DU SÉPARATEUR DE DATE
    const currentDateStr = msg.rawDate;
    let showDateSeparator = false;
    let dateLabel = null;

    const getMessageDateLabel = (dateStr) => {
      if (!dateStr) return null;
      try {
        let date;
        if (typeof dateStr === "string") {
          if (dateStr.length <= 5) return null;
          date = new Date(dateStr);
        } else {
          date = new Date(dateStr);
        }

        if (isNaN(date.getTime())) return null;

        if (isToday(date)) return "Aujourd'hui";
        if (isYesterday(date)) return "Hier";

        const diffDays = differenceInCalendarDays(new Date(), date);
        if (diffDays < 7) {
          const dayName = format(date, "EEEE", { locale: fr });
          return dayName.charAt(0).toUpperCase() + dayName.slice(1);
        }

        return format(date, "dd/MM/yyyy");
      } catch (e) {
        return null;
      }
    };

    if (currentDateStr) {
      if (index === 0) {
        showDateSeparator = true;
        dateLabel = getMessageDateLabel(currentDateStr);
      } else {
        const prevMsg = messages[index - 1];
        const prevDateStr = prevMsg?.rawDate;

        if (prevDateStr) {
          try {
            const currDate = new Date(currentDateStr);
            const prevDate = new Date(prevDateStr);

            if (!isNaN(currDate.getTime()) && !isNaN(prevDate.getTime())) {
              if (!isSameDay(currDate, prevDate)) {
                showDateSeparator = true;
                dateLabel = getMessageDateLabel(currentDateStr);
              }
            }
          } catch (e) {
            console.error("Erreur date:", e);
          }
        }
      }
    }

    return (
      <React.Fragment>
        {showDateSeparator && dateLabel && (
          <div className="flex justify-center my-3">
            <span className="bg-white text-gray-500 text-xs font-medium px-3 py-1 rounded-lg shadow-sm border border-gray-200">
              {dateLabel}
            </span>
          </div>
        )}

        <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[80%] ${!isMe ? "flex gap-2" : ""}`}>
            {!isMe && (
              <div className="flex flex-col items-center flex-shrink-0">
                <img
                  src={msg.avatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full"
                />
              </div>
            )}
            <div className="flex-1">
              {!isMe && (
                <div className="mb-1 px-2">
                  <p className="text-[10px] font-semibold text-gray-700">
                    {msg.sendername || "Support FOSIKA"}
                  </p>
                  <p className="text-[9px] text-gray-500">
                    Équipe d\'assistance
                  </p>
                </div>
              )}
              {isMe && (
                <div className="mb-1 px-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {msg.isanonymous ? (
                      <UserX className="w-3 h-3 text-gray-400" />
                    ) : (
                      <User className="w-3 h-3 text-blue-500" />
                    )}
                    <p className="text-[10px] font-semibold text-gray-700">
                      {displayInfo.mainName}
                    </p>
                  </div>
                  {displayInfo.subName && (
                    <p className="text-[9px] text-gray-500">
                      {displayInfo.subName}
                    </p>
                  )}
                </div>
              )}

              <div
                className={`rounded-2xl shadow-sm overflow-hidden ${
                  isMe
                    ? "bg-green-600 text-white rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                }`}
              >
                {msg.type === "image" && fileUrl ? (
                  <div className="relative group">
                    <img
                      src={fileUrl}
                      alt={msg.fileinfo?.name || "Image"}
                      className="w-full max-w-xs cursor-pointer rounded-lg"
                      style={{
                        maxHeight: "300px",
                        objectFit: "cover",
                      }}
                      onClick={() => openImageViewer(fileUrl)}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/300x200?text=Image+non+disponible";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center rounded-lg">
                      <button
                        onClick={() => openImageViewer(fileUrl)}
                        className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
                      >
                        <ZoomIn className="w-5 h-5 text-gray-800" />
                      </button>
                    </div>
                  </div>
                ) : msg.type === "video" && fileUrl ? (
                  <div className="relative bg-black rounded-lg overflow-hidden max-w-xs">
                    <video
                      controls
                      className="w-full"
                      style={{ maxHeight: "250px" }}
                      preload="metadata"
                    >
                      <source
                        src={fileUrl}
                        type={msg.fileinfo?.type || "video/mp4"}
                      />
                    </video>
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      Vidéo
                    </div>
                  </div>
                ) : msg.type === "file" && fileUrl ? (
                  <div
                    className={`p-3 ${isMe ? "bg-green-700" : "bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isMe
                            ? "bg-green-800"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        <Paperclip
                          className={`w-5 h-5 ${
                            isMe ? "text-white" : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-medium truncate ${
                            isMe ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {msg.fileinfo?.name || "Fichier"}
                        </p>
                        {msg.fileinfo?.size && (
                          <p
                            className={`text-[10px] ${
                              isMe ? "text-green-200" : "text-gray-500"
                            }`}
                          >
                            {(msg.fileinfo.size / 1024).toFixed(2)} KB
                          </p>
                        )}
                      </div>
                      <a
                        href={fileUrl}
                        download
                        className={`p-2 rounded-lg transition-colors ${
                          isMe
                            ? "bg-green-800 hover:bg-green-900"
                            : "bg-white hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        <Download
                          className={`w-4 h-4 ${
                            isMe ? "text-white" : "text-gray-600"
                          }`}
                        />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-3">
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                  </div>
                )}

                <div
                  className={`px-3 pb-2 flex items-center gap-2 justify-end text-[10px] ${
                    isMe ? "text-green-100" : "text-gray-500"
                  }`}
                >
                  <span>{formatTime(msg.time)}</span>
                  {isMe && <MessageStatusIcon status={msg.status} />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  },
  (prevProps, nextProps) => {
    // Comparer uniquement les props essentielles pour éviter les re-renders inutiles
    return (
      prevProps.msg.id === nextProps.msg.id &&
      prevProps.msg.status === nextProps.msg.status &&
      prevProps.msg.readat === nextProps.msg.readat &&
      prevProps.isMe === nextProps.isMe
    );
  }
);

const FloatingChatSupport = ({ reference, dossierInfo, onOpenFullChat }) => {
  // États
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [chatCreated, setChatCreated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // États pour la prévisualisation et l\'upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // États pour la visionneuse d\'images
  const [imageViewer, setImageViewer] = useState({
    isOpen: false,
    currentImage: null,
    currentIndex: 0,
    images: [],
  });

  // État pour le statut en ligne du support
  const [supportOnlineStatus, setSupportOnlineStatus] = useState({
    isOnline: false,
    lastSeen: null,
  });

  // WebSocket state
  const [ws, setWs] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Refs
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const onlineStatusIntervalRef = useRef(null);
  const supportStatusIntervalRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const previousUnreadCountRef = useRef(0);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Ref pour figer l\'heure du message d\'accueil
  const welcomeMessageTimeRef = useRef(new Date().toISOString());

  // ============================================
  // WEBSOCKET CONFIGURATION
  // ============================================
  const connectWebSocket = useCallback(() => {
    if (!chatId || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // Remplacer par votre URL WebSocket réelle
      const wsUrl = `ws://localhost:6001/chat/${chatId}`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("✅ WebSocket connecté");
        setWsConnected(true);

        // Authentifier la connexion
        socket.send(
          JSON.stringify({
            type: "auth",
            reference: reference,
            chatId: chatId,
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "new_message") {
            // Mise à jour instantanée des messages
            const newMessage = {
              id: data.message.id,
              text: data.message.text || data.message.content,
              sender: data.message.sender,
              time: data.message.time || data.message.createdat,
              rawDate:
                data.message.createdat ||
                data.message.created_at ||
                data.message.time,
              sendername: data.message.sendername,
              senderreference: data.message.senderreference,
              isanonymous: data.message.isanonymous,
              status: data.message.status,
              readat: data.message.readat,
              deliveredat: data.message.deliveredat,
              type: data.message.type,
              fileinfo: data.message.fileinfo,
              avatar:
                data.message.sender === "support"
                  ? "https://ui-avatars.com/api?name=Support+FOSIKA&background=4c7026&color=fff"
                  : getVisitorAvatar(
                      data.message.isanonymous,
                      data.message.sendername
                    ),
            };

            setMessages((prev) => {
              // Éviter les doublons
              if (prev.some((m) => m.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });

            // Notification sonore si le chat est fermé/minimisé
            if (!isOpen || isMinimized) {
              setUnreadCount((prev) => prev + 1);
              playNotificationSound();
            }
          } else if (data.type === "message_status_update") {
            // Mise à jour du statut (lu, délivré)
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === data.messageId
                  ? {
                      ...msg,
                      status: data.status,
                      readat: data.readat,
                      deliveredat: data.deliveredat,
                    }
                  : msg
              )
            );
          } else if (data.type === "support_typing") {
            // Afficher indicateur "en train d\'écrire"
            console.log("Support est en train d'écrire...");
          }
        } catch (err) {
          console.error("Erreur parsing WebSocket message:", err);
        }
      };

      socket.onerror = (error) => {
        console.error("❌ WebSocket erreur:", error);
        setWsConnected(false);
      };

      socket.onclose = () => {
        console.log("🔌 WebSocket déconnecté");
        setWsConnected(false);

        // Tentative de reconnexion après 3 secondes
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("🔄 Tentative de reconnexion WebSocket...");
          connectWebSocket();
        }, 3000);
      };

      wsRef.current = socket;
      setWs(socket);
    } catch (err) {
      console.error("Erreur création WebSocket:", err);
      setWsConnected(false);
    }
  }, [chatId, reference, isOpen, isMinimized]);

  // Fonction pour émettre un son de notification
  const playNotificationSound = () => {
    const audio = new Audio("/notification.mp3"); // Ajouter un fichier audio
    audio.volume = 0.5;
    audio.play().catch((e) => console.log("Notification sound blocked:", e));
  };

  // ============================================
  // HELPER FUNCTIONS (MÉMOÏSÉES)
  // ============================================
  const resolveChatFileUrl = useCallback((fileinfo) => {
    if (!fileinfo) return null;
    const candidate = fileinfo.url || fileinfo.name || fileinfo.filename;
    if (!candidate) return null;
    return ChatService.getChatFileUrl(candidate);
  }, []);

  const getWelcomeMessage = useCallback(() => {
    return {
      id: "auto-welcome",
      text: `Salama tompoko,\n\nVoaray soamantsara ny fitarainanao laharana: ${reference}.\n\nRaha mbola misy zavatra tianao ampiana, na raha manana fanontaniana ianao, dia afaka manoratra ato amin\'ity resaka ity foana.\n\nHamaly anao haingana araka izay tratra.`,
      sender: "support",
      sendername: "Support FOSIKA",
      time: welcomeMessageTimeRef.current,
      rawDate: welcomeMessageTimeRef.current,
      avatar:
        "https://ui-avatars.com/api?name=Support+FOSIKA&background=4c7026&color=fff",
      status: "read",
      readat: new Date().toISOString(),
      type: "text",
      isVirtual: true,
    };
  }, [reference]);

  const getVisitorAvatar = useCallback((isAnonymous, name) => {
    if (isAnonymous) {
      return "https://ui-avatars.com/api?name=Anonyme&background=94a3b8&color=fff";
    }
    const displayName = name || "Visiteur";
    return `https://ui-avatars.com/api?name=${encodeURIComponent(
      displayName
    )}&background=3b82f6&color=fff`;
  }, []);

  const getVisitorDisplayName = useCallback((isAnonymous, name, reference) => {
    if (isAnonymous) {
      return {
        mainName: "Anonyme",
        subName: reference || "Visiteur anonyme",
      };
    }
    return {
      mainName: name || "Visiteur",
      subName: reference || null,
    };
  }, []);

  const formatRelativeTime = useCallback((dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    } catch (e) {
      return dateString;
    }
  }, []);

  const formatTime = useCallback((timeString) => {
    if (!timeString) return "";
    try {
      if (typeof timeString === "string" && timeString.includes(":")) {
        return timeString;
      }
      const time = new Date(timeString);
      if (isNaN(time.getTime())) return "";
      return format(time, "HH:mm", { locale: fr });
    } catch (e) {
      return timeString;
    }
  }, []);

  const MessageStatusIcon = useCallback(({ status }) => {
    if (!status || status === "sent") {
      return <Check className="w-3.5 h-3.5 text-gray-400" />;
    }
    if (status === "delivered") {
      return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
    }
    if (status === "read") {
      return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
    }
    return null;
  }, []);

  // ============================================
  // EFFECTS
  // ============================================

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Charger l\'historique à l\'ouverture
  useEffect(() => {
    if (reference && isOpen && !chatId && !loading) {
      checkExistingChat();
    }
  }, [reference, isOpen, chatId]);

  // WEBSOCKET CONNECTION
  useEffect(() => {
    if (chatId && isOpen && !isMinimized) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [chatId, isOpen, isMinimized, connectWebSocket]);

  // Fallback: Polling léger si WebSocket non disponible
  useEffect(() => {
    if (chatId && isOpen && !isMinimized && !wsConnected) {
      // Polling réduit à 2 secondes en fallback
      const interval = setInterval(() => {
        loadChatMessages(chatId);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [chatId, isOpen, isMinimized, wsConnected]);

  // Polling en arrière-plan (uniquement pour le compteur de non-lus)
  useEffect(() => {
    const interval = setInterval(
      () => loadChatMessagesInBackground(true),
      15000 // Augmenté à 15s pour réduire la charge
    );
    loadChatMessagesInBackground(true);
    return () => clearInterval(interval);
  }, []);

  // Vérifier le statut en ligne du support
  useEffect(() => {
    if (chatId && isOpen && !isMinimized) {
      checkSupportOnlineStatus();
      supportStatusIntervalRef.current = setInterval(
        () => checkSupportOnlineStatus(),
        30000
      );

      return () => {
        if (supportStatusIntervalRef.current) {
          clearInterval(supportStatusIntervalRef.current);
        }
      };
    }
  }, [chatId, isOpen, isMinimized]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  // Mettre à jour le statut en ligne du visiteur
  useEffect(() => {
    if (chatId && reference && isOpen && !isMinimized) {
      ChatService.updateVisitorOnlineStatus(chatId, true, reference).catch(
        (err) => console.error("Erreur statut online", err)
      );

      onlineStatusIntervalRef.current = setInterval(() => {
        ChatService.updateVisitorOnlineStatus(chatId, true, reference).catch(
          (err) => console.error("Erreur statut online", err)
        );
      }, 30000);

      return () => {
        if (onlineStatusIntervalRef.current) {
          clearInterval(onlineStatusIntervalRef.current);
        }
        ChatService.updateVisitorOnlineStatus(chatId, false, reference).catch(
          (err) => console.error("Erreur statut offline", err)
        );
      };
    }
  }, [chatId, reference, isOpen, isMinimized]);

  // Scroller vers le bas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ============================================
  // API FUNCTIONS
  // ============================================

  const checkSupportOnlineStatus = async () => {
    if (!chatId) return;
    try {
      const response = await ChatService.getVisitorOnlineStatus(chatId);
      if (response.success) {
        setSupportOnlineStatus({
          isOnline: response.isonline,
          lastSeen: response.lastseen,
        });
      }
    } catch (err) {
      console.error("Erreur vérification statut support", err);
    }
  };

  const checkExistingChat = async () => {
    if (!reference) return;

    try {
      setLoading(true);
      setError(null);

      const response = await ChatService.checkChatByReference(reference);

      if (response.success && response.exists && response.chatid) {
        setChatId(response.chatid);
        setChatCreated(true);
        await loadChatMessages(response.chatid);
        await checkSupportOnlineStatus();
      } else {
        setMessages([getWelcomeMessage()]);
      }
    } catch (err) {
      console.error("Erreur vérification chat existant", err);
      setMessages([getWelcomeMessage()]);
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessagesInBackground = async (checkForNewMessages = false) => {
    if (!chatId) return;

    try {
      const response = await ChatService.getPublicConversation(chatId);

      if (response.success && response.chat) {
        const newMessages = response.chat.messages || [];

        const supportUnreadCount = newMessages.filter(
          (msg) => msg.sender === "support" && !msg.readat
        ).length;

        previousUnreadCountRef.current = supportUnreadCount;

        if (!isOpen || isMinimized) {
          setUnreadCount(supportUnreadCount > 0 ? 1 : 0);
        }

        if (!isOpen) {
          const formattedMessages = newMessages.map((msg) => ({
            id: msg.id,
            text: msg.text || msg.content,
            sender: msg.sender,
            time: msg.time || msg.createdat,
            rawDate: msg.createdat || msg.created_at || msg.time,
            sendername: msg.sendername,
            senderreference: msg.senderreference,
            isanonymous: msg.isanonymous,
            status: msg.status,
            readat: msg.readat,
            deliveredat: msg.deliveredat,
            type: msg.type,
            fileinfo: msg.fileinfo,
            avatar:
              msg.sender === "support"
                ? "https://ui-avatars.com/api?name=Support+FOSIKA&background=4c7026&color=fff"
                : getVisitorAvatar(msg.isanonymous, msg.sendername),
          }));

          setMessages(formattedMessages);
          previousMessageCountRef.current = formattedMessages.length;
        }
      }
    } catch (err) {
      console.error("Erreur chargement messages arrière-plan", err);
    }
  };

  const loadChatMessages = async (chatIdToLoad) => {
    try {
      const response = await ChatService.getPublicConversation(chatIdToLoad);

      if (response.success && response.chat) {
        const fetchedMessages = response.chat.messages || [];

        if (fetchedMessages.length === 0) {
          setMessages([getWelcomeMessage()]);
          previousMessageCountRef.current = 1;
        } else {
          const formattedMessages = fetchedMessages.map((msg) => ({
            id: msg.id,
            text: msg.text || msg.content,
            sender: msg.sender,
            time: msg.time || msg.createdat,
            rawDate: msg.createdat || msg.created_at || msg.time,
            sendername: msg.sendername,
            senderreference: msg.senderreference,
            isanonymous: msg.isanonymous,
            status: msg.status,
            readat: msg.readat,
            deliveredat: msg.deliveredat,
            type: msg.type,
            fileinfo: msg.fileinfo,
            avatar:
              msg.sender === "support"
                ? "https://ui-avatars.com/api?name=Support+FOSIKA&background=4c7026&color=fff"
                : getVisitorAvatar(msg.isanonymous, msg.sendername),
          }));

          setMessages(formattedMessages);
          previousMessageCountRef.current = formattedMessages.length;

          await ChatService.markPublicAsRead(chatIdToLoad);
          setUnreadCount(0);
          previousUnreadCountRef.current = 0;
        }
      }
    } catch (err) {
      console.error("Erreur chargement messages", err);
    }
  };

  // ============================================
  // MESSAGE HANDLING AVEC ENVOI OPTIMISTE
  // ============================================

  const handleSendMessage = async () => {
    if (!message || !message.trim()) {
      setMessage("");
      return;
    }

    const messageToSend = message.trim();
    const tempId = `temp-${Date.now()}`;

    // Envoi optimiste: afficher immédiatement
    const optimisticMessage = {
      id: tempId,
      text: messageToSend,
      sender: "visitor",
      sendername: dossierInfo?.name || "Visiteur",
      time: new Date().toISOString(),
      rawDate: new Date().toISOString(),
      status: "sending",
      type: "text",
      isanonymous: false,
      avatar: getVisitorAvatar(false, dossierInfo?.name || "Visiteur"),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessage("");

    try {
      setSendingMessage(true);
      setError(null);

      const response = await ChatService.createSupportChat({
        reference: reference,
        message: messageToSend,
        name: dossierInfo?.name || "Visiteur",
      });

      if (!chatId && response.chatid) {
        setChatId(response.chatid);
        setChatCreated(true);
      }

      if (response.success) {
        // Remplacer le message optimiste par le message réel
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  id: response.message?.id || msg.id,
                  status: "sent",
                  time: response.message?.createdat || msg.time,
                }
              : msg
          )
        );

        // Envoyer via WebSocket si connecté
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "message_sent",
              messageId: response.message?.id,
              chatId: chatId || response.chatid,
            })
          );
        }
      }
    } catch (err) {
      console.error("Erreur envoi message", err);
      setError(err.message || "Erreur lors de l'envoi du message");

      // Marquer le message comme échoué
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: "failed" } : msg
        )
      );
    } finally {
      setSendingMessage(false);
    }
  };

  // ============================================
  // FILE HANDLING
  // ============================================

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!chatId) {
      setError(
        "Veuillez d'abord envoyer un message pour démarrer la conversation"
      );
      return;
    }

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("L'image ne doit pas dépasser 25 MB");
      return;
    }

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      setError(
        "Format d'image non supporté. Utilisez JPG, JPEG, PNG, GIF ou WEBP"
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
      setSelectedFile(file);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!chatId) {
      setError(
        "Veuillez d'abord envoyer un message pour démarrer la conversation"
      );
      return;
    }

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Le fichier ne doit pas dépasser 25 MB");
      return;
    }

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-ms-wmv",
    ];

    if (!validTypes.includes(file.type)) {
      setError("Format non supporté. Utilisez JPG, JPEG, PNG, MP4 ou PDF");
      return;
    }

    const isVideo = file.type.startsWith("video/");

    if (isVideo) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
        setSelectedFile(file);
        setError(null);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(file);
      setFilePreview(null);
      setError(null);
    }
  };

  const handleSendFile = async () => {
    if (!selectedFile || !chatId) return;

    try {
      setUploadingFile(true);
      setError(null);

      let fileType = "file";
      if (selectedFile.type.startsWith("image/")) {
        fileType = "image";
      } else if (selectedFile.type.startsWith("video/")) {
        fileType = "video";
      }

      const response = await ChatService.sendPublicMessageWithFile(
        chatId,
        {
          file: selectedFile,
          type: fileType,
          sendername: dossierInfo?.name || "Visiteur",
          senderemail: dossierInfo?.email || null,
          content: null,
        },
        (progress) => setUploadProgress(progress)
      );

      if (response.success) {
        setSelectedFile(null);
        setFilePreview(null);
        setUploadProgress(0);

        // Notification WebSocket
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "file_sent",
              chatId: chatId,
            })
          );
        }

        await loadChatMessages(chatId);
      }
    } catch (err) {
      console.error("Erreur envoi fichier:", err);
      setError(err.message || "Erreur lors de l'envoi du fichier");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadProgress(0);
    setError(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileAttach = () => {
    if (!chatId) {
      setError(
        "Veuillez d'abord envoyer un message pour démarrer la conversation"
      );
      return;
    }
    fileInputRef.current?.click();
  };

  const handleImageAttach = () => {
    if (!chatId) {
      setError(
        "Veuillez d'abord envoyer un message pour démarrer la conversation"
      );
      return;
    }
    imageInputRef.current?.click();
  };

  // ============================================
  // IMAGE VIEWER
  // ============================================

  const openImageViewer = useCallback(
    (imageUrl) => {
      const allImages = messages
        .filter((m) => m.type === "image" && resolveChatFileUrl(m.fileinfo))
        .map((m) => ({
          url: resolveChatFileUrl(m.fileinfo),
          name: m.fileinfo?.name,
          originalIndex: messages.indexOf(m),
        }));

      const currentImageIndex = allImages.findIndex(
        (img) => img.url === imageUrl
      );

      setImageViewer({
        isOpen: true,
        currentImage: imageUrl,
        currentIndex: currentImageIndex >= 0 ? currentImageIndex : 0,
        images: allImages,
      });
    },
    [messages, resolveChatFileUrl]
  );

  const closeImageViewer = () => {
    setImageViewer({
      isOpen: false,
      currentImage: null,
      currentIndex: 0,
      images: [],
    });
  };

  const navigateImage = (direction) => {
    const newIndex =
      direction === "next"
        ? (imageViewer.currentIndex + 1) % imageViewer.images.length
        : (imageViewer.currentIndex - 1 + imageViewer.images.length) %
          imageViewer.images.length;

    setImageViewer((prev) => ({
      ...prev,
      currentIndex: newIndex,
      currentImage: prev.images[newIndex].url,
    }));
  };

  // ============================================
  // UI HANDLERS
  // ============================================

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setError(null);
    setUnreadCount(0);
    previousUnreadCountRef.current = 0;
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    if (onOpenFullChat && chatId) {
      onOpenFullChat(chatId);
      handleClose();
    }
  };

  // Gestion du clavier
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!reference) return null;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.mp4,.mov,.avi,.wmv,video/*"
      />
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        onChange={handleImageSelect}
        accept=".jpg,.jpeg,.png,.gif,.webp,image/*"
      />

      {/* VISIONNEUSE D\'IMAGES */}
      {imageViewer.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-[9999] flex items-center justify-center">
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent z-10">
            <div className="text-white">
              <p className="text-sm font-medium">
                {imageViewer.images[imageViewer.currentIndex]?.name || "Image"}
              </p>
              <p className="text-xs text-gray-300">
                {imageViewer.currentIndex + 1} / {imageViewer.images.length}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeImageViewer();
              }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              title="Fermer"
              type="button"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={imageViewer.currentImage}
              alt="Aperçu"
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/400x300?text=Image+non+disponible";
              }}
            />
          </div>

          {imageViewer.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigateImage("prev");
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                title="Image précédente"
                type="button"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigateImage("next");
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                title="Image suivante"
                type="button"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center gap-4 bg-gradient-to-t from-black/50 to-transparent z-10">
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const currentImage = imageViewer.currentImage;
                const imageName =
                  imageViewer.images[imageViewer.currentIndex]?.name ||
                  "image.jpg";

                try {
                  const response = await fetch(currentImage);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = imageName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                } catch (error) {
                  console.error("Erreur téléchargement:", error);
                  window.open(currentImage, "_blank");
                }
              }}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              title="Télécharger l\'image"
              type="button"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Bulle Flottante */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 z-50 group"
          title="Ouvrir le support"
        >
          <MessageCircle className="w-7 h-7" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
          <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-800 text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
            <p className="font-semibold">Support dossier</p>
            <p className="text-[10px] text-gray-600">{reference}</p>
          </div>
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && !isMinimized && (
        <div
          className={`${
            isMobile
              ? "fixed inset-0 w-full h-full rounded-none"
              : "fixed bottom-6 right-6 w-96 h-[32rem] rounded-xl"
          } bg-white shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-200`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  src="https://ui-avatars.com/api?name=Support+FOSIKA&background=4c7026&color=fff"
                  alt="Support"
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
                {supportOnlineStatus.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                )}
                {wsConnected && (
                  <span
                    className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                    title="Connexion temps réel active"
                  ></span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm truncate">Support FOSIKA</h3>
                {supportOnlineStatus.isOnline ? (
                  <p className="text-xs opacity-90 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    En ligne
                  </p>
                ) : (
                  <p className="text-xs opacity-90">
                    {supportOnlineStatus.lastSeen
                      ? `Vu ${formatRelativeTime(supportOnlineStatus.lastSeen)}`
                      : "Hors ligne"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!isMobile && chatId && onOpenFullChat && (
                <button
                  onClick={handleMaximize}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Agrandir"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              )}
              {!isMobile && (
                <button
                  onClick={handleMinimize}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Réduire"
                >
                  <Minus className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Info dossier */}
          <div className="bg-green-50 border-b border-green-100 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-xs text-gray-700 truncate">
                <span className="font-semibold">Dossier:</span>{" "}
                {dossierInfo?.titre || "Signalement"}
              </p>
            </div>
            <p className="text-[10px] text-gray-600 mt-0.5 font-mono">
              Réf: {reference}
            </p>
          </div>

          {/* Zone des messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-3" />
                <p className="text-sm text-gray-500">
                  Chargement de l\'historique...
                </p>
              </div>
            ) : error && !selectedFile ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageCircle className="w-16 h-16 mb-3" />
                <p className="text-sm font-medium">
                  Bienvenue sur le support FOSIKA
                </p>
                <p className="text-xs mt-1 text-center px-4">
                  Envoyez votre premier message pour commencer la conversation
                  avec notre équipe
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isVisitor = msg.sender === "visitor";
                const isMe = isVisitor;

                return (
                  <MessageItem
                    key={msg.id || index}
                    msg={msg}
                    index={index}
                    messages={messages}
                    isMe={isMe}
                    openImageViewer={openImageViewer}
                    resolveChatFileUrl={resolveChatFileUrl}
                    getVisitorDisplayName={getVisitorDisplayName}
                    formatTime={formatTime}
                    MessageStatusIcon={MessageStatusIcon}
                  />
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prévisualisation fichier */}
          {selectedFile && (
            <div className="border-t border-gray-200 p-3 bg-white">
              <div className="flex items-center gap-3">
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Paperclip className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                  {uploadingFile && (
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSendFile}
                    disabled={uploadingFile}
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploadingFile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCancelFile}
                    disabled={uploadingFile}
                    className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Zone de saisie */}
          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-end gap-2">
              <div className="flex gap-1">
                <button
                  onClick={handleImageAttach}
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Joindre une image"
                  disabled={!chatId}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleFileAttach}
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Joindre un fichier"
                  disabled={!chatId}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Écrivez votre message..."
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm max-h-[120px]"
                rows="1"
                disabled={sendingMessage}
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendingMessage}
                className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                title="Envoyer"
              >
                {sendingMessage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatSupport;
