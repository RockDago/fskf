// src/components/FloatingChatBubble.jsx
import React, { useState, useRef, useEffect } from "react";
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
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

const FloatingChatBubble = ({
                                onOpenFullChat,
                                autoOpen,
                                targetReference,
                                onAutoOpenHandled
                            }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [message, setMessage] = useState("");
    const [showChatMenu, setShowChatMenu] = useState(false);
    const [showChatList, setShowChatList] = useState(true);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    // ✅ États pour la prévisualisation et l'upload (COPIÉ de FloatingChatSupport)
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // ✅ États pour la visionneuse d'images
    const [imageViewer, setImageViewer] = useState({
        isOpen: false,
        currentImage: null,
        currentIndex: 0,
        images: [],
    });

    const textareaRef = useRef(null);
    const menuRef = useRef(null);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const previousMessageCountRef = useRef(0);
    const previousUnreadCountRef = useRef(0);
    const notificationSoundRef = useRef(null);

    // ✅ OUVERTURE AUTOMATIQUE QUAND autoOpen EST TRUE
    useEffect(() => {
        if (autoOpen && !isOpen) {
            console.log("🔓 Ouverture automatique du chat demandée");
            handleOpen();
            if (onAutoOpenHandled) {
                onAutoOpenHandled();
            }
        }
    }, [autoOpen]);

    // ✅ REMPLACE l'useEffect existant "Auto-sélectionner chat par référence"
    useEffect(() => {
        if (!isOpen || !targetReference || !chats.length) return;

        console.log("🔍 Recherche du chat pour référence:", targetReference);
        const foundChat = chats.find((chat) => chat.reference === targetReference);

        if (foundChat) {
            console.log("✅ Chat trouvé:", foundChat.id, foundChat.reference);
            setSelectedChatId(foundChat.id);
            setShowChatList(false);
            loadChatDetails(foundChat.id);
        } else {
            // ✅ NOUVEAU: Créer automatiquement le chat si inexistant
            console.log("❌ Aucun chat trouvé, création automatique...");
            createChatForReference(targetReference);
        }
    }, [isOpen, targetReference, chats]);

    // ✅ NOUVELLE FONCTION: Créer un chat pour une référence
    const createChatForReference = async (reference) => {
        try {
            setLoading(true);
            setError(null);

            console.log("🆕 Création du chat pour:", reference);

            // Appel API pour créer/initier une conversation admin -> référence
            const response = await ChatService.createAdminChat({
                reference: reference,
                message: `Bonjour, nous souhaitons vous contacter concernant votre dossier ${reference}.`
            });

            if (response.success) {
                console.log("✅ Chat créé avec succès:", response.chat.id);

                // Recharger la liste des chats
                await loadChats();

                // Sélectionner automatiquement le nouveau chat
                setSelectedChatId(response.chat.id);
                setShowChatList(false);
                loadChatDetails(response.chat.id);

            } else {
                setError("Impossible de créer la conversation pour cette référence");
            }
        } catch (err) {
            console.error("❌ Erreur création chat:", err);
            setError(err.message || "Erreur lors de la création de la conversation");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Helper: forcer l'URL fichier chat vers la nouvelle route
    const resolveChatFileUrl = (fileinfo) => {
        if (!fileinfo) return null;
        const candidate = fileinfo.url || fileinfo.name || fileinfo.filename;
        if (!candidate) return null;
        return ChatService.getChatFileUrl(candidate);
    };

    // ✅ Helper: normaliser fileinfo (Bubble reçoit parfois fileinfo ou file_info)
    const getMsgFileInfo = (msg) => msg?.fileinfo || msg?.file_info || null;

    // ✅ Initialiser le son de notification
    useEffect(() => {
        notificationSoundRef.current = new Audio(
            "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuEzvLaizsIHGS57N+LMgcZacLx6ZZEEA1Qt+PwtmMdBjiR1/LMeSwEJHfH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuEzvLaizsIHGS57N+LMgcZacLx6ZZEEA1Qt+PwtmMdBjiR1/LMeSwEJHfH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuEzvLaizsIHGS57N+LMgcZacLx6ZZEEA1Qt+PwtmMdBjiR1/LMeSwEJHfH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuEzvLaizsIHGS57N+LMgcZacLx6ZZEEA1Qt+PwtmMdBjiR1/LMeSwEJHfH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuEzvLaizsIHGS57N+LMgcZacLx6ZZEEA1Qt+PwtmMdBjiR1/LMeSwEJHfH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuEzvLaizsIHGS57N+LMgcZacLx6ZZEEA1Qt+PwtmMdBjiR1/LMeSwEJHfH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuEzvLaizsIHGS57N+LMgcZacLx6ZZEEAwQqOLty"
        );
    }, []);

    // ✅ Fonction pour jouer le son de notification
    const playNotificationSound = () => {
        try {
            if (notificationSoundRef.current) {
                notificationSoundRef.current.volume = 0.5;
                notificationSoundRef.current.play().catch((e) => {
                    console.log("Impossible de jouer le son:", e);
                });
            }
        } catch (error) {
            console.log("Erreur son notification:", error);
        }
    };

    // Charger les conversations au premier clic
    useEffect(() => {
        if (isOpen && !isMinimized) {
            loadChats();
        }
    }, [isOpen, isMinimized]);

    // ✅ POLLING AUTOMATIQUE - Rafraîchir la liste des chats toutes les 15 secondes
    useEffect(() => {
        if (isOpen && !isMinimized && showChatList) {
            const interval = setInterval(() => {
                loadChatsInBackground();
            }, 15000);

            return () => clearInterval(interval);
        }
    }, [isOpen, isMinimized, showChatList]);

    // ✅ POLLING AUTOMATIQUE - Rafraîchir les messages du chat actif toutes les 8 secondes
    useEffect(() => {
        if (selectedChatId && isOpen && !isMinimized && !showChatList) {
            loadChatDetails(selectedChatId);

            const interval = setInterval(() => {
                loadChatDetailsInBackground(selectedChatId);
            }, 8000);

            return () => clearInterval(interval);
        }
    }, [selectedChatId, isOpen, isMinimized, showChatList]);

    // ✅ POLLING EN ARRIÈRE-PLAN - Vérifier les nouveaux messages même quand fermé
    useEffect(() => {
        const interval = setInterval(() => {
            loadChatsInBackground(true);
        }, 10000);

        loadChatsInBackground(true);

        return () => clearInterval(interval);
    }, []);

    // ✅ Auto-resize textarea (comme WhatsApp/Facebook)
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height =
                Math.min(textareaRef.current.scrollHeight, 120) + "px";
        }
    }, [message]);

    // ✅ Scroller vers le bas seulement si nouveaux messages
    useEffect(() => {
        if (activeChat?.messages && messagesEndRef.current) {
            const currentMessageCount = activeChat.messages.length;

            if (currentMessageCount !== previousMessageCountRef.current) {
                const container = chatContainerRef.current;
                const isNearBottom = container
                    ? container.scrollHeight - container.scrollTop - container.clientHeight <
                    100
                    : true;

                if (isNearBottom) {
                    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                }

                previousMessageCountRef.current = currentMessageCount;
            }
        }
    }, [activeChat?.messages]);

    // Gestion des clics en dehors des menus
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowChatMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadChats = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await ChatService.getUserChats();

            if (response.success) {
                setChats(response.chats || []);

                if (response.chats.length > 0 && !selectedChatId) {
                    setSelectedChatId(response.chats[0].id);
                }
            }
        } catch (err) {
            setError(err.message || "Erreur lors du chargement des conversations");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Charger les chats en arrière-plan avec détection de nouveaux messages
    const loadChatsInBackground = async (checkForNewMessages = false) => {
        try {
            const response = await ChatService.getUserChats();

            if (response.success) {
                const newChats = response.chats || [];

                const newUnreadChatsCount = newChats.filter(
                    (chat) => (chat.unread_count || chat.unread || 0) > 0
                ).length;

                if (
                    checkForNewMessages &&
                    newUnreadChatsCount > previousUnreadCountRef.current
                ) {
                    playNotificationSound();
                }

                previousUnreadCountRef.current = newUnreadChatsCount;

                setChats(newChats);
            }
        } catch (err) {
            console.error("Erreur chargement arrière-plan:", err);
        }
    };

    const loadChatDetails = async (chatId) => {
        try {
            const response = await ChatService.getChatDetails(chatId);

            if (response.success) {
                setActiveChat(response.chat);
                previousMessageCountRef.current = response.chat.messages?.length || 0;

                await ChatService.markAsRead(chatId);
                await loadChatsInBackground();
            }
        } catch (err) {
            console.error("Erreur lors du chargement des détails du chat:", err);
        }
    };

    const loadChatDetailsInBackground = async (chatId) => {
        try {
            const response = await ChatService.getChatDetails(chatId);

            if (response.success) {
                const currentCount = activeChat?.messages?.length || 0;
                const newCount = response.chat.messages?.length || 0;

                if (newCount > currentCount) {
                    setActiveChat(response.chat);
                    playNotificationSound();

                    await ChatService.markAsRead(chatId);
                    await loadChatsInBackground();
                }
            }
        } catch (err) {
            console.error("Erreur chargement détails arrière-plan:", err);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        setIsMinimized(false);
        setShowChatList(true);
        setError(null); // Réinitialiser les erreurs
    };

    const handleClose = () => {
        setIsOpen(false);
        setIsMinimized(false);
        setShowChatList(true);
        setSelectedChatId(null);
        setActiveChat(null);
        setMessage("");
        setError(null);
        setSelectedFile(null);
        setFilePreview(null);
    };

    const handleMinimize = () => {
        setIsMinimized(true);
    };

    const handleBackToList = () => {
        setShowChatList(true);
        setSelectedChatId(null);
        setActiveChat(null);
        setMessage("");
        setError(null);
        setSelectedFile(null);
        setFilePreview(null);
        previousMessageCountRef.current = 0;
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedChatId) return;

        try {
            setSendingMessage(true);

            const response = await ChatService.sendMessage(selectedChatId, {
                content: message,
                type: "text",
            });

            if (response.success) {
                setMessage("");
                await loadChatDetails(selectedChatId);
            }
        } catch (err) {
            setError(err.message || "Erreur lors de l'envoi du message");
        } finally {
            setSendingMessage(false);
        }
    };

    // ✅ Gérer la sélection d'image avec prévisualisation (COPIÉ de FloatingChatSupport)
    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!selectedChatId) {
            setError(
                "Veuillez d'abord sélectionner une conversation"
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

    // ✅ Gérer la sélection de fichier (COPIÉ de FloatingChatSupport)
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!selectedChatId) {
            setError(
                "Veuillez d'abord sélectionner une conversation"
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

    // ✅ Envoyer le fichier avec progression (COPIÉ de FloatingChatSupport)
    const handleSendFile = async () => {
        if (!selectedFile || !selectedChatId) return;

        try {
            setUploadingFile(true);
            setError(null);

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
                await loadChatDetails(selectedChatId);
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
                await loadChatsInBackground();
                if (activeChat && activeChat.id === chatId) {
                    setActiveChat((prev) => ({
                        ...prev,
                        is_important: response.is_important,
                    }));
                }
            }
        } catch (err) {
            setError(err.message || "Erreur lors de la modification");
        }
    };

    const handleSelectChat = (chatId) => {
        setSelectedChatId(chatId);
        setShowChatList(false);
        setError(null);
        setSelectedFile(null);
        setFilePreview(null);
        previousMessageCountRef.current = 0;
    };

    const handleMaximize = () => {
        if (onOpenFullChat && selectedChatId) {
            onOpenFullChat(selectedChatId);
        }
        handleClose();
    };

    const formatTime = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            return format(date, "HH:mm", { locale: fr });
        } catch (e) {
            return dateString;
        }
    };

    const formatRelativeTime = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            return formatDistanceToNow(date, {
                addSuffix: true,
                locale: fr,
            });
        } catch (e) {
            return dateString;
        }
    };

    // ✅ CORRIGÉ: utilise getMsgFileInfo au lieu de m.file_info
    const openImageViewer = (imageUrl) => {
        const allImages =
            activeChat?.messages
                ?.filter((m) => m.type === "image" && resolveChatFileUrl(getMsgFileInfo(m)))
                .map((m) => ({
                    url: resolveChatFileUrl(getMsgFileInfo(m)),
                    name: getMsgFileInfo(m)?.name,
                    originalIndex: activeChat.messages.indexOf(m),
                })) || [];

        const currentImageIndex = allImages.findIndex((img) => img.url === imageUrl);

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

    const handleFileView = (fileInfo) => {
        const url = resolveChatFileUrl(fileInfo);
        if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
        }
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
            if (chat.is_anonymous) {
                return {
                    mainName: "Anonyme",
                    subName: chat.reference,
                };
            }
            return {
                mainName: chat.visitor_name || chat.name || "Visiteur",
                subName: chat.reference,
            };
        }
        return {
            mainName: chat.name || "Utilisateur",
            subName: chat.role || null,
        };
    };

    const getLastMessage = (chat) => {
        if (chat.last_message) {
            return chat.last_message;
        }

        if (chat.messages && chat.messages.length > 0) {
            const lastMsg = chat.messages[chat.messages.length - 1];
            return lastMsg.content || lastMsg.text || "Nouveau message";
        }

        return chat.lastMessage || "Nouveau message";
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

    const MessageStatusIcon = ({ status }) => {
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
    };

    const unreadChatsCount = chats.filter(
        (chat) => (chat.unread_count || chat.unread || 0) > 0
    ).length;

    return (
        <>
            {/* Inputs cachés pour les fichiers */}
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

            {/* ✅ VISIONNEUSE D'IMAGES Modal */}
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

            {/* Bulle Flottante */}
            {!isOpen && (
                <button
                    onClick={handleOpen}
                    className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 z-50"
                    title="Ouvrir le chat"
                >
                    <MessageCircle className="w-7 h-7" />
                    {unreadChatsCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.5rem] h-6 px-1.5 flex items-center justify-center animate-pulse">
              {unreadChatsCount > 99 ? "99+" : unreadChatsCount}
            </span>
                    )}
                </button>
            )}

            {/* Fenêtre de chat */}
            {isOpen && !isMinimized && (
                <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {!showChatList && (
                                <button
                                    onClick={handleBackToList}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                                    title="Retour"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            )}
                            <MessageCircle className="w-6 h-6 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-sm truncate">
                                    {showChatList
                                        ? "Messages"
                                        : (() => {
                                            const displayInfo = getVisitorDisplayName(
                                                activeChat || {}
                                            );
                                            return displayInfo.mainName;
                                        })()}
                                </h3>
                                <p className="text-xs opacity-90 truncate">
                                    {showChatList
                                        ? `${chats.length} conversation${chats.length > 1 ? "s" : ""}`
                                        : (() => {
                                            const displayInfo = getVisitorDisplayName(
                                                activeChat || {}
                                            );
                                            return (
                                                displayInfo.subName || activeChat?.role || "Support"
                                            );
                                        })()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                            {!showChatList && (
                                <button
                                    onClick={handleMaximize}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    title="Agrandir"
                                >
                                    <Maximize2 className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={handleMinimize}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title="Réduire"
                            >
                                <Minus className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title="Fermer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Contenu */}
                    {showChatList ? (
                        /* Liste des conversations */
                        <div className="flex-1 overflow-y-auto">
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
                            ) : chats.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                                    <MessageCircle className="w-12 h-12 mb-3" />
                                    <p className="text-sm">Aucune conversation</p>
                                    <p className="text-xs mt-1 text-center">
                                        Lorsqu'un utilisateur vous contactera, vos conversations
                                        apparaîtront ici.
                                    </p>
                                </div>
                            ) : (
                                chats.map((chat) => {
                                    const displayInfo = getVisitorDisplayName(chat);
                                    const chatUnreadCount = chat.unread_count || chat.unread || 0;

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
                                                                chat.is_anonymous,
                                                                chat.visitor_name || chat.name
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
                                                {chatUnreadCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                          </span>
                                                )}
                                                {chat.reference && (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                                        {chat.is_anonymous ? (
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
                                chat.last_message_time || chat.time
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
                                                        📋 {chat.dossierTitre}
                                                    </p>
                                                )}

                                                <p
                                                    className={`text-xs truncate ${
                                                        chatUnreadCount > 0
                                                            ? "text-gray-900 font-medium"
                                                            : "text-gray-500"
                                                    }`}
                                                >
                                                    {getLastMessage(chat)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        /* Vue de conversation active */
                        <>
                            {activeChat && activeChat.reference && (
                                <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5">
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

                            {/* Messages */}
                            <div
                                ref={chatContainerRef}
                                className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3"
                            >
                                {error && !selectedFile && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                {activeChat?.messages?.length > 0 ? (
                                    activeChat.messages.map((msg) => {
                                        const isVisitor =
                                            msg.sender === "visitor" || msg.sender_type === "visitor";
                                        const isMe =
                                            msg.sender === "me" || msg.sender_type === "support";

                                        // ✅ CORRIGÉ: utilise getMsgFileInfo au lieu de msg.file_info
                                        const fileUrl = resolveChatFileUrl(getMsgFileInfo(msg));

                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                            >
                                                <div className={`max-w-[80%] ${!isMe ? "flex gap-2" : ""}`}>
                                                    {!isMe && (
                                                        <div className="flex flex-col items-center flex-shrink-0">
                                                            <img
                                                                src={
                                                                    msg.avatar ||
                                                                    getVisitorAvatar(
                                                                        activeChat.is_anonymous,
                                                                        activeChat.visitor_name || activeChat.name
                                                                    )
                                                                }
                                                                alt="Avatar"
                                                                className="w-8 h-8 rounded-full"
                                                                onError={(e) => {
                                                                    e.target.src = getVisitorAvatar(
                                                                        activeChat.is_anonymous,
                                                                        activeChat.visitor_name
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        {!isMe && (
                                                            <div className="mb-1 px-2">
                                                                <div className="flex items-center gap-1">
                                                                    {activeChat.is_anonymous ? (
                                                                        <UserX className="w-3 h-3 text-gray-400" />
                                                                    ) : (
                                                                        <User className="w-3 h-3 text-blue-500" />
                                                                    )}
                                                                    <p className="text-[10px] font-semibold text-gray-700">
                                                                        {activeChat.is_anonymous
                                                                            ? "Anonyme"
                                                                            : activeChat.visitor_name ||
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
                                                            {/* ✅ IMAGES */}
                                                            {msg.type === "image" && fileUrl ? (
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
                                                            ) : msg.type === "video" && fileUrl ? (
                                                                /* ✅ VIDÉOS */
                                                                <div className="relative bg-black rounded-lg overflow-hidden max-w-xs">
                                                                    <video
                                                                        controls
                                                                        className="w-full"
                                                                        style={{ maxHeight: "250px" }}
                                                                        preload="metadata"
                                                                        onError={() =>
                                                                            console.error("Erreur chargement vidéo:", fileUrl)
                                                                        }
                                                                    >
                                                                        <source
                                                                            src={fileUrl}
                                                                            type={getMsgFileInfo(msg)?.type || "video/mp4"}
                                                                        />
                                                                        Votre navigateur ne supporte pas la lecture vidéo.
                                                                    </video>
                                                                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                                        <Play className="w-3 h-3" />
                                                                        Vidéo
                                                                    </div>
                                                                </div>
                                                            ) : msg.type === "file" && fileUrl ? (
                                                                /* ✅ FICHIERS */
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
                                                                                        isMe ? "text-blue-100" : "text-gray-500"
                                                                                    }`}
                                                                                >
                                                                                    {formatFileSize(getMsgFileInfo(msg).filesize)}
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
                                                                /* ✅ TEXTE avec retour à la ligne (CORRIGÉ) */
                                                                <div className="px-4 py-3">
                                                                    <p className="text-sm whitespace-pre-wrap break-words">
                                                                        {msg.text || msg.content}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* ✅ Heure + Statut */}
                                                        <div
                                                            className={`px-4 pb-2 flex items-center ${
                                                                isMe ? "justify-end" : "justify-start"
                                                            } gap-1 text-[10px] ${
                                                                isMe ? "text-blue-100" : "text-gray-400"
                                                            }`}
                                                        >
                                                            <span>{formatTime(msg.time || msg.created_at)}</span>
                                                            {isMe && <MessageStatusIcon status={msg.status} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <MessageCircle className="w-12 h-12 mb-2" />
                                        <p className="text-sm">Aucun message</p>
                                        <p className="text-xs">En attente du premier message</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* ✅ Prévisualisation fichier sélectionné (COPIÉ de FloatingChatSupport) */}
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
                                            ) : filePreview && selectedFile.type.startsWith("video/") ? (
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
                                                        />
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

                            {/* Zone de saisie */}
                            <div className="border-t border-gray-200 p-3 bg-white">
                                <div className="flex items-end gap-2">
                                    <div className="flex gap-1">
                                        <button
                                            onClick={handleFileAttach}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Joindre un fichier"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleImageAttach}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Joindre une image"
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
                                        disabled={
                                            sendingMessage || uploadingFile || !message.trim()
                                        }
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
            )}
        </>
    );
};

export default FloatingChatBubble;