import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Minus,
  Paperclip,
  Image as ImageIcon,
  Maximize2,
  MoreVertical,
  Flag,
  FileText,
  Loader2,
  AlertCircle,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  UserX,
  Check,
  CheckCheck,
  ZoomIn,
  Play,
} from "lucide-react";
import ChatService from "../services/chatService";
import {
  formatDistanceToNow,
  format,
  isToday,
  isYesterday,
  isSameDay,
  differenceInCalendarDays,
} from "date-fns";
import { fr } from "date-fns/locale";

const FloatingChatBubble = ({
  onOpenFullChat,
  autoOpen,
  targetReference,
  onAutoOpenHandled,
}) => {
  // ===== ÉTATS UI =====
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showChatList, setShowChatList] = useState(true);

  // ===== ÉTATS DONNÉES =====
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ===== ÉTATS ACTIONS =====
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const [pendingReference, setPendingReference] = useState(null);

  // ===== ÉTATS FICHIERS =====
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ===== ÉTAT VISIONNEUSE D'IMAGES =====
  const [imageViewer, setImageViewer] = useState({
    isOpen: false,
    currentImage: null,
    currentIndex: 0,
    images: [],
  });

  // ===== REFS =====
  const textareaRef = useRef(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const previousMessageCountRef = useRef(0);

  // ===== FONCTIONS HELPER =====

  const resolveChatFileUrl = (fileinfo) => {
    if (!fileinfo) return null;
    const candidate = fileinfo.url || fileinfo.name || fileinfo.filename;
    if (!candidate) return null;
    return ChatService.getChatFileUrl(candidate);
  };

  const getMsgFileInfo = (msg) => {
    if (!msg) return null;
    return msg?.fileinfo || (msg?.fileinfo ? JSON.parse(msg.fileinfo) : null);
  };

  const getMessageDateLabel = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
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

  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return format(date, "HH:mm", { locale: fr });
    } catch (e) {
      return "";
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    } catch (e) {
      return "";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getVisitorAvatar = (isAnonymous, name) => {
    if (isAnonymous) {
      return `https://ui-avatars.com/api/?name=Anonyme&background=94a3b8&color=fff`;
    }
    const displayName = name || "Visiteur";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&background=3b82f6&color=fff`;
  };

  const getVisitorDisplayName = (chat) => {
    if (!chat) return { mainName: "Chargement...", subName: "" };

    if (chat.reference) {
      if (chat.isanonymous) {
        return { mainName: "Anonyme", subName: chat.reference };
      }
      return {
        mainName: chat.visitorname || chat.name || "Visiteur",
        subName: chat.reference,
      };
    }
    return {
      mainName: chat.name || "Utilisateur",
      subName: chat.role || null,
    };
  };

  // ✅ FONCTION AMÉLIORÉE pour récupérer le dernier message
  const getLastMessage = (chat) => {
    // Priorité 1: Vérifier s'il y a des messages dans le chat
    if (chat.messages && chat.messages.length > 0) {
      const lastMsg = chat.messages[chat.messages.length - 1];

      // Afficher selon le type de message
      if (lastMsg.type === "image") {
        return "📷 Image";
      } else if (lastMsg.type === "video") {
        return "🎥 Vidéo";
      } else if (lastMsg.type === "file") {
        return "📎 Fichier";
      } else {
        return lastMsg.content || lastMsg.text || "Message";
      }
    }

    // Priorité 2: Vérifier lastmessage ou lastMessage
    if (chat.lastmessage) {
      return chat.lastmessage;
    }

    if (chat.lastMessage) {
      return chat.lastMessage;
    }

    // Par défaut
    return "Nouvelle conversation";
  };

  // ===== CHARGEMENT DES DONNÉES =====

  const loadChats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const response = await ChatService.getUserChats();
      if (response.success) {
        // ✅ TRIER par date du dernier message (plus récent en premier)
        const sortedChats = response.chats.sort((a, b) => {
          const dateA = new Date(
            a.lastmessageat || a.lastMessageAt || a.createdat || 0
          );
          const dateB = new Date(
            b.lastmessageat || b.lastMessageAt || b.createdat || 0
          );
          return dateB - dateA; // Plus récent en premier
        });

        setChats(sortedChats);
      }
    } catch (err) {
      console.error("Erreur chargement chats:", err);
      if (!silent)
        setError(err.message || "Erreur lors du chargement des conversations");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadChatDetails = useCallback(
    async (chatId, silent = false) => {
      if (!chatId) return;

      if (!silent) setLoading(true);

      try {
        const response = await ChatService.getChatDetails(chatId);
        if (response.success) {
          setActiveChat((prev) => {
            const prevString = JSON.stringify(prev);
            const newString = JSON.stringify(response.chat);

            if (prevString !== newString) {
              previousMessageCountRef.current =
                response.chat.messages?.length || 0;
              return response.chat;
            }
            return prev;
          });

          ChatService.markAsRead(chatId).catch(() => {});

          if (!silent) {
            loadChats(true);
          }
        }
      } catch (err) {
        console.error("Erreur chargement détails chat:", err);
        if (!silent)
          setError(err.message || "Erreur lors du chargement du chat");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [loadChats]
  );

  // ===== EFFECTS =====

  useEffect(() => {
    if (autoOpen && !isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      if (onAutoOpenHandled) onAutoOpenHandled();
    }
  }, [autoOpen, isOpen, onAutoOpenHandled]);

  useEffect(() => {
    if (!isOpen || !targetReference || chats.length === 0) return;

    const foundChat = chats.find((chat) => chat.reference === targetReference);

    if (foundChat) {
      setSelectedChatId(foundChat.id);
      setShowChatList(false);
      loadChatDetails(foundChat.id);
      setIsCreatingNewChat(false);
      setPendingReference(null);
    } else {
      setIsCreatingNewChat(true);
      setPendingReference(targetReference);
      setShowChatList(false);
      setActiveChat(null);
      setSelectedChatId(null);
      setError(null);
      setMessage("");
    }
  }, [isOpen, targetReference, chats, loadChatDetails]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      loadChats(true);
    }
  }, [isOpen, isMinimized, loadChats]);

  useEffect(() => {
    if (isOpen && !isMinimized && showChatList) {
      const interval = setInterval(() => {
        loadChats(true);
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [isOpen, isMinimized, showChatList, loadChats]);

  useEffect(() => {
    if (selectedChatId && isOpen && !isMinimized && !showChatList) {
      const interval = setInterval(() => {
        loadChatDetails(selectedChatId, true);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [selectedChatId, isOpen, isMinimized, showChatList, loadChatDetails]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [message]);

  useEffect(() => {
    if (activeChat?.messages) {
      const currentMessageCount = activeChat.messages.length;

      if (currentMessageCount !== previousMessageCountRef.current) {
        const container = chatContainerRef.current;

        if (container) {
          const isNearBottom =
            container.scrollHeight -
              container.scrollTop -
              container.clientHeight <
            150;

          if (isNearBottom || currentMessageCount === 1) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }
        }

        previousMessageCountRef.current = currentMessageCount;
      }
    }
  }, [activeChat?.messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowChatMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ===== GESTIONNAIRES D'ÉVÉNEMENTS =====

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setShowChatList(true);
    setError(null);
    loadChats();
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setShowChatList(true);
    resetChatState();
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleBackToList = () => {
    setShowChatList(true);
    resetChatState();
    loadChats(true);
  };

  const resetChatState = () => {
    setSelectedChatId(null);
    setActiveChat(null);
    setMessage("");
    setError(null);
    setSelectedFile(null);
    setFilePreview(null);
    setIsCreatingNewChat(false);
    setPendingReference(null);
    previousMessageCountRef.current = 0;
  };

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
    setShowChatList(false);
    setError(null);
    setSelectedFile(null);
    setFilePreview(null);
    setIsCreatingNewChat(false);
    setPendingReference(null);
    previousMessageCountRef.current = 0;
    loadChatDetails(chatId);
  };

  const handleSendMessage = async () => {
    if (!message || !message.trim()) {
      setMessage("");
      return;
    }

    const messageText = message.trim();
    setMessage("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setSendingMessage(true);
    setError(null);

    try {
      if (isCreatingNewChat && pendingReference) {
        const response = await ChatService.createAdminChat({
          reference: pendingReference,
          message: messageText,
        });

        if (response.success) {
          setIsCreatingNewChat(false);
          setPendingReference(null);

          const newChatId = response.chat.id;
          setSelectedChatId(newChatId);
          setShowChatList(false);

          setActiveChat(response.chat);

          loadChats(true);

          setTimeout(() => {
            loadChatDetails(newChatId, true);
          }, 500);
        } else {
          throw new Error(
            response.message || "Impossible de créer la conversation"
          );
        }
      } else if (selectedChatId) {
        const tempMessage = {
          id: "temp-" + Date.now(),
          content: messageText,
          text: messageText,
          sender: "admin",
          sendertype: "admin",
          createdat: new Date().toISOString(),
          status: "sending",
          type: "text",
        };

        setActiveChat((prev) => ({
          ...prev,
          messages: [...(prev?.messages || []), tempMessage],
        }));

        const response = await ChatService.sendMessage(selectedChatId, {
          content: messageText,
          type: "text",
        });

        if (response.success) {
          setTimeout(() => {
            loadChatDetails(selectedChatId, true);
          }, 300);
        } else {
          throw new Error(
            response.message || "Erreur lors de l'envoi du message"
          );
        }
      } else {
        setError("Veuillez sélectionner une conversation");
        setMessage(messageText);
      }
    } catch (err) {
      console.error("Erreur envoi message:", err);
      setError(err.message || "Échec de l'envoi. Veuillez réessayer.");
      setMessage(messageText);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedChatId && !isCreatingNewChat) {
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
      setError("Format d'image non supporté. Utilisez JPG, PNG, GIF ou WEBP");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
      setSelectedFile(file);
      setError(null);
    };
    reader.readAsDataURL(file);

    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedChatId && !isCreatingNewChat) {
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
      setError(
        "Format non supporté. Utilisez PDF, DOC, XLS, TXT ou vidéo (MP4, MOV, AVI, WMV)"
      );
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

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendFile = async () => {
    if (!selectedFile || !selectedChatId) return;

    setUploadingFile(true);
    setError(null);

    try {
      let fileType = "file";
      if (selectedFile.type.startsWith("image/")) {
        fileType = "image";
      } else if (selectedFile.type.startsWith("video/")) {
        fileType = "video";
      }

      const response = await ChatService.uploadFile(
        selectedChatId,
        selectedFile,
        fileType,
        (progress) => setUploadProgress(progress)
      );

      if (response.success) {
        setSelectedFile(null);
        setFilePreview(null);
        setUploadProgress(0);

        await loadChatDetails(selectedChatId, true);
      } else {
        throw new Error(
          response.message || "Erreur lors de l'envoi du fichier"
        );
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

  const handleToggleImportant = async (chatId) => {
    try {
      const response = await ChatService.toggleImportant(chatId);

      if (response.success) {
        if (activeChat?.id === chatId) {
          setActiveChat((prev) => ({
            ...prev,
            isimportant: response.isimportant,
          }));
        }

        await loadChats(true);
      }
    } catch (err) {
      console.error("Erreur toggle important:", err);
    }
  };

  const handleMaximize = () => {
    if (onOpenFullChat && selectedChatId) {
      onOpenFullChat(selectedChatId);
      handleClose();
    }
  };

  // ===== VISIONNEUSE D'IMAGES =====

  const openImageViewer = (imageUrl) => {
    const allImages =
      activeChat?.messages
        ?.filter(
          (m) => m.type === "image" && resolveChatFileUrl(getMsgFileInfo(m))
        )
        .map((m) => ({
          url: resolveChatFileUrl(getMsgFileInfo(m)),
          name: getMsgFileInfo(m)?.name || "Image",
          originalIndex: activeChat.messages.indexOf(m),
        })) || [];

    const currentImageIndex = allImages.findIndex(
      (img) => img.url === imageUrl
    );

    setImageViewer({
      isOpen: true,
      currentImage: imageUrl,
      currentIndex: currentImageIndex >= 0 ? currentImageIndex : 0,
      images: allImages,
    });
  };

  const closeImageViewer = () => {
    setImageViewer({
      isOpen: false,
      currentImage: null,
      currentIndex: 0,
      images: [],
    });
  };

  const navigateImage = (direction) => {
    const { currentIndex, images } = imageViewer;
    let newIndex;

    if (direction === "next") {
      newIndex = (currentIndex + 1) % images.length;
    } else {
      newIndex = (currentIndex - 1 + images.length) % images.length;
    }

    setImageViewer((prev) => ({
      ...prev,
      currentIndex: newIndex,
      currentImage: images[newIndex].url,
    }));
  };

  const MessageStatusIcon = ({ status }) => {
    if (!status || status === "sent") {
      return <Check className="w-3 h-3" />;
    }
    if (status === "delivered") {
      return <CheckCheck className="w-3 h-3" />;
    }
    if (status === "read") {
      return <CheckCheck className="w-3 h-3 text-blue-400" />;
    }
    return null;
  };

  // ===== RENDU =====

  const hiddenInputs = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.mp4,.mov,.avi,.wmv"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleImageSelect}
        className="hidden"
      />
    </>
  );

  const imageViewerModal = imageViewer.isOpen && (
    <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center">
      <button
        onClick={closeImageViewer}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <X className="w-8 h-8" />
      </button>

      <div className="absolute top-4 left-4 text-white z-10">
        <p className="text-sm font-medium">
          {imageViewer.images[imageViewer.currentIndex]?.name || "Image"}
        </p>
        <p className="text-xs text-gray-300">
          {imageViewer.currentIndex + 1} / {imageViewer.images.length}
        </p>
      </div>

      {imageViewer.images.length > 1 && (
        <>
          <button
            onClick={() => navigateImage("prev")}
            className="absolute left-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-3 z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => navigateImage("next")}
            className="absolute right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-3 z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <img
        src={imageViewer.currentImage}
        alt="Aperçu"
        className="max-w-[90vw] max-h-[90vh] object-contain"
      />
    </div>
  );

  if (!isOpen) {
    return (
      <>
        {hiddenInputs}
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 z-50"
          title="Ouvrir les conversations"
        >
          <MessageCircle className="w-7 h-7" />
          {chats.filter((c) => (c.unreadcount || c.unread || 0) > 0).length >
            0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {chats.filter((c) => (c.unreadcount || c.unread || 0) > 0).length}
            </span>
          )}
        </button>
      </>
    );
  }

  if (isMinimized) {
    return (
      <>
        {hiddenInputs}
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 z-50"
        >
          <MessageCircle className="w-7 h-7" />
          {chats.filter((c) => (c.unreadcount || c.unread || 0) > 0).length >
            0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {chats.filter((c) => (c.unreadcount || c.unread || 0) > 0).length}
            </span>
          )}
        </button>
      </>
    );
  }

  return (
    <>
      {hiddenInputs}
      {imageViewerModal}

      <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
        {/* ===== EN-TÊTE ===== */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!showChatList && (
              <button
                onClick={handleBackToList}
                className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">
                {showChatList
                  ? `${chats.length} conversation${chats.length > 1 ? "s" : ""}`
                  : isCreatingNewChat && pendingReference
                  ? `Nouveau chat - ${pendingReference}`
                  : getVisitorDisplayName(activeChat).mainName}
              </h3>
              <p className="text-xs text-blue-100 truncate">
                {showChatList
                  ? "Support & Assistance"
                  : isCreatingNewChat
                  ? "Nouvelle conversation"
                  : getVisitorDisplayName(activeChat).subName ||
                    activeChat?.role ||
                    "Support"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!showChatList && (
              <>
                <button
                  onClick={handleMaximize}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                  title="Ouvrir en plein écran"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                {!isCreatingNewChat && selectedChatId && (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowChatMenu(!showChatMenu)}
                      className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {showChatMenu && (
                      <div className="absolute top-full right-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl py-2 w-48 z-10">
                        <button
                          onClick={() => {
                            handleToggleImportant(selectedChatId);
                            setShowChatMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Flag
                            className={`w-4 h-4 ${
                              activeChat?.isimportant
                                ? "text-yellow-500 fill-yellow-500"
                                : ""
                            }`}
                          />
                          {activeChat?.isimportant
                            ? "Retirer l'importance"
                            : "Marquer comme important"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <button
              onClick={handleMinimize}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              title="Réduire"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ===== CONTENU ===== */}
        {showChatList ? (
          /* LISTE DES CONVERSATIONS */
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <span className="ml-2 text-gray-500">Chargement...</span>
              </div>
            ) : chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6">
                <MessageCircle className="w-16 h-16 mb-3" />
                <p className="text-sm text-center font-medium">
                  Aucune conversation
                </p>
                <p className="text-xs text-center mt-1">
                  Lorsqu'un utilisateur vous contactera, vos conversations
                  apparaîtront ici.
                </p>
              </div>
            ) : (
              chats.map((chat) => {
                const displayInfo = getVisitorDisplayName(chat);
                const unreadCount = chat.unreadcount || chat.unread || 0;

                return (
                  <div
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedChatId === chat.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <img
                          src={getVisitorAvatar(
                            chat.isanonymous,
                            chat.visitorname || chat.name
                          )}
                          alt="Avatar"
                          className="w-12 h-12 rounded-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {displayInfo.mainName}
                            </h4>
                            {chat.isimportant && (
                              <Flag className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          {chat.lastmessageat && (
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {formatRelativeTime(chat.lastmessageat)}
                            </span>
                          )}
                        </div>

                        {displayInfo.subName && (
                          <p className="text-xs text-blue-600 mb-1 truncate">
                            {displayInfo.subName}
                          </p>
                        )}

                        {chat.dossierTitre && (
                          <p className="text-xs text-gray-500 mb-1 truncate">
                            {chat.dossierTitre}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <p
                            className={`text-sm truncate ${
                              unreadCount > 0
                                ? "text-gray-900 font-medium"
                                : "text-gray-500"
                            }`}
                          >
                            {getLastMessage(chat)}
                          </p>
                          {unreadCount > 0 && (
                            <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* CONVERSATION ACTIVE */
          <>
            {activeChat && !isCreatingNewChat && (
              <div className="border-b border-gray-200 p-3 bg-gray-50">
                <div className="flex items-center gap-3">
                  <img
                    src={getVisitorAvatar(
                      activeChat.isanonymous,
                      activeChat.visitorname || activeChat.name
                    )}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {activeChat.isanonymous
                          ? "Anonyme"
                          : activeChat.visitorname ||
                            activeChat.name ||
                            "Visiteur"}
                      </p>
                      {activeChat.isimportant && (
                        <Flag className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    {activeChat.reference && (
                      <p className="text-xs text-blue-600 truncate">
                        {activeChat.reference}
                        {activeChat.dossierTitre && (
                          <span className="text-gray-500 ml-1">
                            • {activeChat.dossierTitre}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isCreatingNewChat && pendingReference && (
              <div className="border-b border-blue-200 p-3 bg-blue-50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Nouvelle conversation
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Référence: <strong>{pendingReference}</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Écrivez votre message ci-dessous pour démarrer la
                      conversation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3"
            >
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {activeChat?.messages?.length > 0 ? (
                activeChat.messages.map((msg, index) => {
                  const sender = msg.sender;
                  const senderType = msg.sendertype || msg.sendertype;
                  const isVisitor =
                    sender === "visitor" || senderType === "visitor";
                  const isMe =
                    sender === "me" ||
                    senderType === "support" ||
                    senderType === "admin" ||
                    !isVisitor;
                  const fileUrl = resolveChatFileUrl(getMsgFileInfo(msg));
                  const messageContent = msg.text || msg.content;

                  const currentDateStr =
                    msg.createdat || msg.createdat || msg.time;
                  let dateLabel = null;

                  if (currentDateStr) {
                    const prevM = activeChat.messages[index - 1];
                    const prevD = prevM
                      ? prevM.createdat || prevM.createdat || prevM.time
                      : null;

                    try {
                      const currDate = new Date(currentDateStr);
                      const prevDate = prevD ? new Date(prevD) : null;

                      if (
                        !isNaN(currDate.getTime()) &&
                        (!prevDate ||
                          !isSameDay(currDate, prevDate) ||
                          isNaN(prevDate.getTime()))
                      ) {
                        dateLabel = getMessageDateLabel(currentDateStr);
                      }
                    } catch (e) {
                      // Ignorer erreur
                    }
                  }

                  return (
                    <React.Fragment key={msg.id || index}>
                      {dateLabel && (
                        <div className="flex justify-center my-3">
                          <span className="bg-white text-gray-500 text-xs font-medium px-3 py-1 rounded-lg shadow-sm border border-gray-200">
                            {dateLabel}
                          </span>
                        </div>
                      )}

                      <div
                        className={`flex ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isMe && (
                          <div className="flex-shrink-0 self-end mb-1">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {activeChat.isanonymous ||
                              !activeChat.visitorname ||
                              activeChat.visitorname === "Anonyme" ? (
                                <User className="w-5 h-5 text-gray-500" />
                              ) : (
                                <span className="text-xs font-bold text-gray-600">
                                  {(activeChat.visitorname || "V")
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className={`max-w-[75%] ${!isMe ? "ml-2" : ""}`}>
                          <div
                            className={`rounded-2xl shadow-sm overflow-hidden ${
                              isMe
                                ? "bg-blue-600 text-white rounded-br-sm"
                                : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                            }`}
                          >
                            {msg.type === "image" && fileUrl && (
                              <div className="relative group">
                                <img
                                  src={fileUrl}
                                  alt={getMsgFileInfo(msg)?.name || "Image"}
                                  className="w-full max-w-xs cursor-pointer rounded-lg"
                                  style={{
                                    maxHeight: "300px",
                                    objectFit: "cover",
                                  }}
                                  onClick={() => openImageViewer(fileUrl)}
                                  onError={(e) => {
                                    console.error(
                                      "Erreur chargement image:",
                                      fileUrl
                                    );
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
                            )}

                            {msg.type === "video" && fileUrl && (
                              <div className="relative bg-black rounded-lg overflow-hidden max-w-xs">
                                <video
                                  controls
                                  className="w-full"
                                  style={{ maxHeight: "250px" }}
                                  preload="metadata"
                                  onError={() =>
                                    console.error(
                                      "Erreur chargement vidéo:",
                                      fileUrl
                                    )
                                  }
                                >
                                  <source
                                    src={fileUrl}
                                    type={
                                      getMsgFileInfo(msg)?.type || "video/mp4"
                                    }
                                  />
                                  Votre navigateur ne supporte pas la lecture
                                  vidéo.
                                </video>
                                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <Play className="w-3 h-3" />
                                  Vidéo
                                </div>
                              </div>
                            )}

                            {msg.type === "file" && fileUrl && (
                              <div
                                className={`p-3 ${
                                  isMe ? "bg-blue-700" : "bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`p-2 rounded-lg ${
                                      isMe
                                        ? "bg-blue-800"
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
                                      className={`text-sm font-medium truncate ${
                                        isMe ? "text-white" : "text-gray-800"
                                      }`}
                                    >
                                      {getMsgFileInfo(msg)?.name || "Fichier"}
                                    </p>
                                    {getMsgFileInfo(msg)?.filesize && (
                                      <p
                                        className={`text-xs ${
                                          isMe
                                            ? "text-blue-100"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        {formatFileSize(
                                          getMsgFileInfo(msg).filesize
                                        )}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                                      isMe
                                        ? "bg-blue-800 hover:bg-blue-900 text-white"
                                        : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                                    }`}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Voir
                                  </a>
                                  <a
                                    href={fileUrl}
                                    download
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                                      isMe
                                        ? "bg-white/20 hover:bg-white/30 text-white"
                                        : "bg-green-600 hover:bg-green-700 text-white"
                                    }`}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Télécharger
                                  </a>
                                </div>
                              </div>
                            )}

                            {messageContent && (
                              <div className="px-4 py-3">
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {messageContent}
                                </p>
                              </div>
                            )}

                            <div
                              className={`px-4 pb-2 flex items-center ${
                                isMe ? "justify-end" : "justify-start"
                              } gap-1 text-[10px] ${
                                isMe ? "text-blue-100" : "text-gray-400"
                              }`}
                            >
                              <span>{formatTime(currentDateStr)}</span>
                              {isMe && (
                                <MessageStatusIcon status={msg.status} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageCircle className="w-12 h-12 mb-2" />
                  <p className="text-sm">
                    {isCreatingNewChat
                      ? "Aucun message pour le moment"
                      : "Aucun message"}
                  </p>
                  <p className="text-xs">
                    {isCreatingNewChat
                      ? "Écrivez le premier message"
                      : "En attente du premier message"}
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {selectedFile && (
              <div className="border-t border-gray-200 p-3 bg-white">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {filePreview && selectedFile.type.startsWith("image/") ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                      />
                    ) : filePreview &&
                      selectedFile.type.startsWith("video/") ? (
                      <video
                        src={filePreview}
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    {uploadingFile && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelFile}
                      disabled={uploadingFile}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Annuler"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSendFile}
                      disabled={uploadingFile}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      title="Envoyer"
                    >
                      {uploadingFile ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 p-3 bg-white">
              <div className="flex items-end gap-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Joindre un fichier"
                    disabled={!selectedChatId && !isCreatingNewChat}
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Joindre une image"
                    disabled={!selectedChatId && !isCreatingNewChat}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Écrivez un message..."
                    className="w-full resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-[120px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendingMessage || uploadingFile}
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || uploadingFile || !message.trim()}
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          </>
        )}
      </div>
    </>
  );
};

export default FloatingChatBubble;
