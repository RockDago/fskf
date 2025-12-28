import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  MapPin,
  Mail,
  FileText,
  Image as ImageIcon,
  Filter,
  Maximize2,
  Minimize2,
  Flag,
  X,
  Info,
  Phone,
  PanelLeftClose,
  PanelLeftOpen,
  AlertCircle,
  Loader2,
  MessageCircle,
  Download,
  Eye,
  User,
  UserX,
  Check,
  CheckCheck,
  ZoomIn,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ChatService from "../../services/chatService";
import {
  formatDistanceToNow,
  format,
  isToday,
  isYesterday,
  isSameDay,
  differenceInCalendarDays,
} from "date-fns";
import { fr } from "date-fns/locale";

const ChatView = () => {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ all: 0, unread: 0, important: 0 });
  const [visitorOnlineStatus, setVisitorOnlineStatus] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageViewer, setImageViewer] = useState({
    isOpen: false,
    currentImage: null,
    currentIndex: 0,
    images: [],
  });

  const textareaRef = useRef(null);
  const menuRef = useRef(null);
  const filterMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousMessageCountRef = useRef(0);

  const loadingChatRef = useRef(false);
  const pollingIntervalRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  // ✅ CORRECTION TIMEZONE: Fonction pour convertir UTC -> Madagascar (EAT = UTC+3)
  const convertToMadagascarTime = (utcDateString) => {
    if (!utcDateString) return null;
    try {
      const date = new Date(utcDateString);
      if (isNaN(date.getTime())) return null;

      // Ajouter 3 heures pour Madagascar (UTC+3)
      const madagascarTime = new Date(date.getTime() + 3 * 60 * 60 * 1000);
      return madagascarTime;
    } catch (e) {
      return null;
    }
  };

  // Helpers
  const resolveChatFileUrl = (fileinfo) => {
    if (!fileinfo) return null;
    const candidate = fileinfo.url || fileinfo.name || fileinfo.filename;
    if (!candidate) return null;
    return ChatService.getChatFileUrl(candidate);
  };

  const getMsgFileInfo = (msg) => msg?.fileinfo || msg?.fileinfo || null;

  const getMessageDateLabel = (dateStr) => {
    if (!dateStr) return null;
    try {
      // ✅ Conversion vers Madagascar
      const date = convertToMadagascarTime(dateStr);
      if (!date) return null;

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

  const loadChats = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        setError(null);
        const response = await ChatService.getUserChats(filterType);

        if (response.success) {
          setChats(response.chats);
          setFilters(response.filters || { all: 0, unread: 0, important: 0 });
          if (response.chats.length > 0 && !selectedChatId) {
            setSelectedChatId(response.chats[0].id);
          }
        }
      } catch (err) {
        if (!silent) {
          setError(
            err.message || "Erreur lors du chargement des conversations"
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filterType, selectedChatId]
  );

  // ✅ CORRECTION: Chargement instantané sans loader visible
  const loadChatDetails = useCallback(
    async (chatId, silent = false) => {
      if (loadingChatRef.current) return;

      try {
        loadingChatRef.current = true;
        const response = await ChatService.getChatDetails(chatId);

        if (response.success) {
          const newMessages = response.chat.messages || [];
          const lastMessageId =
            newMessages.length > 0
              ? newMessages[newMessages.length - 1].id
              : null;

          // ✅ Mise à jour immédiate
          setActiveChat(response.chat);
          lastMessageIdRef.current = lastMessageId;
          previousMessageCountRef.current = newMessages.length;

          if (!silent) {
            await ChatService.markAsRead(chatId);
            await loadChats(true);
          }
        }
      } catch (err) {
        console.error("Erreur chargement détails:", err);
      } finally {
        loadingChatRef.current = false;
      }
    },
    [loadChats]
  );

  useEffect(() => {
    if (!selectedChatId) return;

    loadChatDetails(selectedChatId);

    pollingIntervalRef.current = setInterval(() => {
      loadChatDetails(selectedChatId, true);
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [selectedChatId, loadChatDetails]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadChats(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [loadChats]);

  const checkVisitorOnlineStatus = useCallback(async (chatId) => {
    try {
      const response = await ChatService.getVisitorOnlineStatus(chatId);
      if (response.success) {
        setVisitorOnlineStatus((prev) => ({
          ...prev,
          [chatId]: {
            isOnline: response.isonline,
            lastSeen: response.lastseen,
          },
        }));
      }
    } catch (err) {
      console.error("Erreur vérification statut visiteur:", err);
    }
  }, []);

  useEffect(() => {
    if (activeChat?.reference && activeChat?.id) {
      checkVisitorOnlineStatus(activeChat.id);
      const interval = setInterval(() => {
        checkVisitorOnlineStatus(activeChat.id);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [activeChat?.id, activeChat?.reference, checkVisitorOnlineStatus]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowChatMenu(false);
      }
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target)
      ) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeChat?.messages && messagesEndRef.current) {
      const currentMessageCount = activeChat.messages.length;
      if (currentMessageCount !== previousMessageCountRef.current) {
        const container = messagesContainerRef.current;
        const isNearBottom = container
          ? container.scrollHeight -
              container.scrollTop -
              container.clientHeight <
            100
          : true;

        if (isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
        previousMessageCountRef.current = currentMessageCount;
      }
    }
  }, [activeChat?.messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChatId) return;

    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: message.trim(),
      text: message.trim(),
      type: "text",
      sender: "me",
      sendertype: "support",
      createdat: new Date().toISOString(),
      status: "sending",
      time: new Date().toISOString(),
    };

    setActiveChat((prev) => ({
      ...prev,
      messages: [...(prev?.messages || []), tempMessage],
    }));

    const messageToSend = message;
    setMessage("");
    setSendingMessage(true);

    try {
      const response = await ChatService.sendMessage(selectedChatId, {
        content: messageToSend,
        type: "text",
      });

      if (response.success) {
        setActiveChat((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === tempMessage.id ? { ...response.message, sender: "me" } : m
          ),
        }));

        loadChats(true);
      } else {
        setActiveChat((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => m.id !== tempMessage.id),
        }));
        setError("Erreur lors de l'envoi du message");
      }
    } catch (err) {
      setActiveChat((prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => m.id !== tempMessage.id),
      }));
      setError(err.message || "Erreur lors de l'envoi du message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedChatId) {
      setError("Veuillez d'abord sélectionner une conversation");
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

    if (!selectedChatId) {
      setError("Veuillez d'abord sélectionner une conversation");
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
      setError("Format non supporté. Utilisez PDF, DOC, XLS, TXT ou vidéo");
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
    if (!selectedFile || !selectedChatId) return;

    const tempMessage = {
      id: `temp-file-${Date.now()}`,
      content: selectedFile.type.startsWith("image/")
        ? "📷 Image"
        : selectedFile.type.startsWith("video/")
        ? "🎥 Vidéo"
        : "📎 Fichier",
      type: selectedFile.type.startsWith("image/")
        ? "image"
        : selectedFile.type.startsWith("video/")
        ? "video"
        : "file",
      sender: "me",
      sendertype: "support",
      createdat: new Date().toISOString(),
      status: "uploading",
      fileinfo: {
        name: selectedFile.name,
        size: selectedFile.size,
        filesize: selectedFile.size,
      },
    };

    setActiveChat((prev) => ({
      ...prev,
      messages: [...(prev?.messages || []), tempMessage],
    }));

    setUploadingFile(true);
    setError(null);

    try {
      let fileType = "file";
      if (selectedFile.type.startsWith("image/")) fileType = "image";
      else if (selectedFile.type.startsWith("video/")) fileType = "video";

      const response = await ChatService.uploadFile(
        selectedChatId,
        selectedFile,
        fileType,
        (progress) => setUploadProgress(progress)
      );

      if (response.success) {
        setActiveChat((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === tempMessage.id ? { ...response.message, sender: "me" } : m
          ),
        }));

        setSelectedFile(null);
        setFilePreview(null);
        setUploadProgress(0);
        loadChats(true);
      } else {
        setActiveChat((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => m.id !== tempMessage.id),
        }));
        setError("Erreur lors de l'envoi du fichier");
      }
    } catch (err) {
      console.error("Erreur envoi fichier:", err);
      setActiveChat((prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => m.id !== tempMessage.id),
      }));
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
        await loadChats(true);
        if (activeChat && activeChat.id === chatId) {
          setActiveChat((prev) => ({
            ...prev,
            isimportant: response.isimportant,
          }));
        }
      }
    } catch (err) {
      setError(err.message || "Erreur lors de la modification");
    }
  };

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
    setShowContactInfo(false);
    setSelectedFile(null);
    setFilePreview(null);
    setUploadProgress(0);
    previousMessageCountRef.current = 0;
    lastMessageIdRef.current = null;
  };

  // ✅ CORRECTION: formatTime avec timezone Madagascar
  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = convertToMadagascarTime(dateString);
      if (!date) return "";
      return format(date, "HH:mm", { locale: fr });
    } catch (e) {
      return "";
    }
  };

  // ✅ CORRECTION: formatRelativeTime avec timezone Madagascar
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = convertToMadagascarTime(dateString);
      if (!date) return "";
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

  const handleFileAttach = () => {
    if (!selectedChatId) {
      setError("Veuillez d'abord sélectionner une conversation");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleImageAttach = () => {
    if (!selectedChatId) {
      setError("Veuillez d'abord sélectionner une conversation");
      return;
    }
    imageInputRef.current?.click();
  };

  const handleFileDownload = async (fileInfo) => {
    const url = resolveChatFileUrl(fileInfo);
    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileInfo.name || "fichier";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      window.open(url, "_blank");
    }
  };

  const handleFileView = (fileInfo) => {
    const url = resolveChatFileUrl(fileInfo);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const openImageViewer = (imageUrl) => {
    const allImages = activeChat?.messages
      ?.filter(
        (m) => m.type === "image" && resolveChatFileUrl(getMsgFileInfo(m))
      )
      .map((m) => ({
        url: resolveChatFileUrl(getMsgFileInfo(m)),
        name: getMsgFileInfo(m)?.name,
        originalIndex: activeChat.messages.indexOf(m),
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

  const getVisitorAvatar = (isAnonymous, name) => {
    if (isAnonymous) {
      return "https://ui-avatars.com/api/?name=Anonyme&background=94a3b8&color=fff";
    }
    const displayName = name || "Visiteur";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&background=3b82f6&color=fff`;
  };

  const getVisitorDisplayName = (chat) => {
    if (chat.reference) {
      if (chat.isanonymous) {
        return { mainName: "Anonyme", subName: chat.reference };
      }
      return {
        mainName: chat.visitorname || chat.name || "Visiteur",
        subName: chat.reference,
      };
    }
    return { mainName: chat.name || "Utilisateur", subName: chat.role || null };
  };

  const MessageStatusIcon = ({ status }) => {
    if (!status || status === "sent" || status === "sending") {
      return <Check className="w-3.5 h-3.5 text-gray-400" />;
    }
    if (status === "delivered") {
      return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
    }
    if (status === "read") {
      return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
    }
    return null;
  };

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = (chat.visitorname || chat.name || "").toLowerCase();
    const reference = (chat.reference || "").toLowerCase();
    const message = (chat.lastmessage || "").toLowerCase();

    return (
      name.includes(query) ||
      reference.includes(query) ||
      message.includes(query)
    );
  });

  return (
    // ✅ CORRECTION PLEIN ÉCRAN: Conteneur flexible qui s'adapte
    <div
      className={`flex bg-gray-50 w-full ${
        isFullscreen ? "fixed inset-0 z-50" : "h-screen"
      }`}
      style={{ overflow: "hidden" }}
    >
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

      {/* Visionneuse d'images */}
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
              title="Télécharger l'image"
              type="button"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      {showSidebar && (
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Messages</h2>
              <div className="flex items-center gap-2">
                <div className="relative" ref={filterMenuRef}>
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                    title="Filtres"
                  >
                    <Filter className="w-5 h-5 text-gray-600" />
                    {filterType !== "all" && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </button>

                  {showFilterMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      <button
                        onClick={() => {
                          setFilterType("all");
                          setShowFilterMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                          filterType === "all"
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        <span>Tous</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                          {filters.all}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setFilterType("unread");
                          setShowFilterMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                          filterType === "unread"
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        <span>Non lus</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                          {filters.unread}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setFilterType("important");
                          setShowFilterMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                          filterType === "important"
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        <span>Importants</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                          {filters.important}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-sm text-gray-500">Chargement...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-red-600 p-4">
                <AlertCircle className="w-8 h-8 mb-3" />
                <p className="text-sm text-center">{error}</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                <MessageCircle className="w-12 h-12 mb-3" />
                <p className="text-sm">Aucune conversation</p>
                <p className="text-xs mt-1 text-center">
                  {searchQuery.trim()
                    ? "Aucun résultat pour votre recherche"
                    : "Lorsqu'un utilisateur vous contactera, vos conversations apparaîtront ici."}
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const displayInfo = getVisitorDisplayName(chat);
                const chatUnreadCount = chat.unreadcount || chat.unread || 0;
                return (
                  <div
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={`flex items-start gap-3 p-4 cursor-pointer border-b border-gray-100 transition-all hover:bg-gray-50 ${
                      selectedChatId === chat.id
                        ? "bg-blue-50 border-l-4 border-l-blue-600"
                        : ""
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          chat.reference
                            ? getVisitorAvatar(
                                chat.isanonymous,
                                chat.visitorname || chat.name
                              )
                            : chat.avatar ||
                              "https://ui-avatars.com/api/?name=Utilisateur&background=3b82f6&color=fff"
                        }
                        alt={displayInfo.mainName}
                        className="w-12 h-12 rounded-full"
                        onError={(e) => {
                          e.target.src =
                            "https://ui-avatars.com/api/?name=Utilisateur&background=3b82f6&color=fff";
                        }}
                      />
                      {chatUnreadCount > 0 && chat.reference && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                        </span>
                      )}
                      {chat.reference && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          {chat.isanonymous ? (
                            <UserX className="w-3 h-3 text-gray-400" />
                          ) : (
                            <User className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                      )}
                      {chat.important && (
                        <Flag className="absolute top-0 -right-1 w-4 h-4 text-orange-500 fill-orange-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                          {displayInfo.mainName}
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatRelativeTime(
                            chat.lastmessagetime || chat.time
                          )}
                        </span>
                      </div>
                      {displayInfo.subName && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <FileText className="w-3 h-3 text-blue-600" />
                          <p className="text-[10px] font-mono text-blue-700 font-semibold truncate">
                            {displayInfo.subName}
                          </p>
                        </div>
                      )}
                      {chat.dossierTitre && (
                        <p className="text-[11px] text-gray-600 mb-1 truncate">
                          {chat.dossierTitre}
                        </p>
                      )}
                      <p
                        className={`text-xs truncate ${
                          chatUnreadCount > 0
                            ? "text-gray-900 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {chat.lastmessage ||
                          chat.lastMessage ||
                          "Nouveau message"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Zone chat principale */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {activeChat ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {!showSidebar && (
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden flex-shrink-0"
                    title="Afficher la liste"
                  >
                    <PanelLeftOpen className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                <img
                  src={
                    activeChat.reference
                      ? getVisitorAvatar(
                          activeChat.isanonymous,
                          activeChat.visitorname || activeChat.name
                        )
                      : activeChat.avatar ||
                        "https://ui-avatars.com/api/?name=Utilisateur&background=3b82f6&color=fff"
                  }
                  alt="Avatar"
                  className="w-10 h-10 rounded-full flex-shrink-0"
                  onError={(e) => {
                    e.target.src =
                      "https://ui-avatars.com/api/?name=Utilisateur&background=3b82f6&color=fff";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {activeChat.reference &&
                      (activeChat.isanonymous ? (
                        <UserX className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      ))}
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {activeChat.reference
                        ? activeChat.isanonymous
                          ? "Anonyme"
                          : activeChat.visitorname ||
                            activeChat.name ||
                            "Visiteur"
                        : activeChat.name || "Support FOSIKA"}
                    </h3>
                    {visitorOnlineStatus[activeChat.id]?.isOnline && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 ml-2 flex-shrink-0">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span>En ligne</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 truncate">
                    {!visitorOnlineStatus[activeChat.id]?.isOnline &&
                    visitorOnlineStatus[activeChat.id]?.lastSeen ? (
                      <>
                        Vu{" "}
                        <span className="font-medium">
                          {formatRelativeTime(
                            visitorOnlineStatus[activeChat.id].lastSeen
                          )}
                        </span>
                      </>
                    ) : activeChat.role || activeChat.status ? (
                      <>
                        {!visitorOnlineStatus[activeChat.id]?.isOnline && (
                          <>
                            <span className="mx-1 text-gray-300">•</span>
                            <span>{activeChat.status}</span>
                          </>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowContactInfo(!showContactInfo)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Informations"
                >
                  <Info className="w-5 h-5 text-gray-600" />
                </button>

                {showSidebar && (
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                    title="Masquer la liste"
                  >
                    <PanelLeftClose className="w-5 h-5 text-gray-600" />
                  </button>
                )}

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isFullscreen ? "Réduire" : "Plein écran"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Maximize2 className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowChatMenu(!showChatMenu)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Options"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>

                  {showChatMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      <button
                        onClick={() => {
                          handleToggleImportant(activeChat.id);
                          setShowChatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                      >
                        <Flag
                          className={`w-4 h-4 ${
                            activeChat.isimportant
                              ? "text-orange-500 fill-orange-500"
                              : ""
                          }`}
                        />
                        <span>
                          {activeChat.isimportant
                            ? "Retirer important"
                            : "Marquer important"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info dossier */}
            {activeChat.reference && (
              <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-semibold text-blue-700 truncate">
                      {activeChat.reference}
                    </p>
                    {activeChat.dossierTitre && (
                      <p className="text-[11px] text-gray-600 truncate">
                        {activeChat.dossierTitre}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Zone messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-gray-50 space-y-3 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {error && !selectedFile && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {activeChat.messages && activeChat.messages.length > 0 ? (
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
                      const currDate = convertToMadagascarTime(currentDateStr);
                      const prevDate = prevD
                        ? convertToMadagascarTime(prevD)
                        : null;

                      if (
                        currDate &&
                        (!prevDate || !isSameDay(currDate, prevDate))
                      ) {
                        dateLabel = getMessageDateLabel(currentDateStr);
                      }
                    } catch (e) {
                      // Ignore
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
                        <div
                          className={`max-w-[70%] ${!isMe ? "flex gap-2" : ""}`}
                        >
                          {!isMe && (
                            <div className="flex flex-col items-center flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {activeChat.isanonymous ||
                                !activeChat.visitorname ||
                                activeChat.visitorname === "Anonyme" ? (
                                  <User className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <span className="text-xs font-bold text-gray-600">
                                    {activeChat.visitorname
                                      ? activeChat.visitorname
                                          .charAt(0)
                                          .toUpperCase()
                                      : "V"}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            {!isMe && (
                              <div className="mb-1 px-2">
                                <div className="flex items-center gap-1">
                                  {activeChat.isanonymous ? (
                                    <UserX className="w-3 h-3 text-gray-400" />
                                  ) : (
                                    <User className="w-3 h-3 text-blue-500" />
                                  )}
                                  <p className="text-[10px] font-semibold text-gray-700">
                                    {activeChat.isanonymous
                                      ? "Anonyme"
                                      : activeChat.visitorname ||
                                        activeChat.name ||
                                        "Visiteur"}
                                  </p>
                                </div>
                                {activeChat.reference && (
                                  <p className="text-[9px] font-mono text-gray-500">
                                    {activeChat.reference}
                                  </p>
                                )}
                              </div>
                            )}

                            <div
                              className={`rounded-2xl shadow-sm overflow-hidden ${
                                isMe
                                  ? "bg-blue-600 text-white rounded-br-sm"
                                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                              }`}
                            >
                              {msg.type === "image" && fileUrl ? (
                                <div className="relative group">
                                  <img
                                    src={fileUrl}
                                    alt={getMsgFileInfo(msg)?.name || "Image"}
                                    className="w-full max-w-md cursor-pointer rounded-lg"
                                    style={{
                                      maxHeight: "400px",
                                      objectFit: "cover",
                                    }}
                                    onClick={() => openImageViewer(fileUrl)}
                                    onError={(e) => {
                                      console.error(
                                        "Erreur chargement image:",
                                        fileUrl
                                      );
                                      e.target.src =
                                        "https://via.placeholder.com/400x300?text=Image+non+disponible";
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
                                <div className="relative bg-black rounded-lg overflow-hidden max-w-md">
                                  <video
                                    controls
                                    className="w-full"
                                    style={{ maxHeight: "350px" }}
                                    preload="metadata"
                                    onError={() => {
                                      console.error(
                                        "Erreur chargement vidéo:",
                                        fileUrl
                                      );
                                    }}
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
                              ) : msg.type === "file" && fileUrl ? (
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
                              ) : (
                                <div className="px-4 py-3">
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {messageContent}
                                  </p>
                                </div>
                              )}
                              <div
                                className={`px-4 pb-2 flex items-center ${
                                  isMe ? "justify-end" : "justify-start"
                                } gap-1 text-[10px] text-gray-400`}
                              >
                                <span>{formatTime(currentDateStr)}</span>
                                {isMe && msg.status && (
                                  <MessageStatusIcon status={msg.status} />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageCircle className="w-16 h-16 mb-3" />
                  <p className="text-sm font-medium">
                    Aucun message dans cette conversation
                  </p>
                  <p className="text-xs mt-1">
                    Envoyez un message pour commencer la conversation
                  </p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Prévisualisation fichier */}
            {selectedFile && (
              <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0">
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
                  <div className="flex gap-2 flex-shrink-0">
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

            {/* Zone de saisie */}
            <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
              <div className="flex items-end gap-2">
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={handleFileAttach}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Joindre un fichier"
                    disabled={uploadingFile}
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleImageAttach}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Joindre une image"
                    disabled={uploadingFile}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
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
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 h-full">
            {loading ? (
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Chargement des conversations...</p>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <MessageCircle className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">
                  Sélectionnez une conversation
                </h3>
                <p className="text-sm">
                  Choisissez une conversation dans la liste pour commencer à
                  discuter
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panneau info */}
      {showContactInfo && activeChat && (
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto h-full flex-shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="p-6">
            <div className="text-center mb-6">
              <img
                src={
                  activeChat.reference
                    ? getVisitorAvatar(
                        activeChat.isanonymous,
                        activeChat.visitorname || activeChat.name
                      )
                    : activeChat.avatar ||
                      "https://ui-avatars.com/api/?name=Utilisateur&background=3b82f6&color=fff"
                }
                alt="Avatar"
                className="w-24 h-24 rounded-full mx-auto mb-3"
                onError={(e) => {
                  e.target.src =
                    "https://ui-avatars.com/api/?name=Utilisateur&background=3b82f6&color=fff";
                }}
              />
              <h3 className="text-lg font-semibold text-gray-900">
                {activeChat.isanonymous
                  ? "Anonyme"
                  : activeChat.visitorname || activeChat.name || "Visiteur"}
              </h3>
              <p className="text-sm text-gray-500">
                {activeChat.role || "Support"}
                {activeChat.location && (
                  <span className="block text-xs mt-1">
                    {activeChat.location}
                  </span>
                )}
              </p>
            </div>

            {activeChat.reference && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Référence
                  </label>
                  <p className="text-sm text-gray-900 mt-1 font-mono">
                    {activeChat.reference}
                  </p>
                </div>
                {activeChat.dossierTitre && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Type
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {activeChat.dossierTitre || "Signalement"}
                    </p>
                  </div>
                )}
              </div>
            )}

            <hr className="my-4" />

            <div className="space-y-4">
              {activeChat.visitorname && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Nom complet
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {activeChat.visitorname}
                  </p>
                </div>
              )}
              {activeChat.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Email
                    </label>
                    <p className="text-sm text-gray-900 mt-1 break-all">
                      {activeChat.email}
                    </p>
                  </div>
                </div>
              )}
              {activeChat.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Téléphone
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {activeChat.phone}
                    </p>
                  </div>
                </div>
              )}
              {(activeChat.address ||
                activeChat.city ||
                activeChat.province ||
                activeChat.region) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Localisation
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {[
                        activeChat.address,
                        activeChat.city,
                        activeChat.province && activeChat.city
                          ? activeChat.province
                          : null,
                        activeChat.city || activeChat.province
                          ? activeChat.region
                          : activeChat.region,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Non renseigné"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatView;
