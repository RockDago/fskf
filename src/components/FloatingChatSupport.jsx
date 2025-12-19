// src/components/FloatingChatSupport.jsx
import React, { useState, useRef, useEffect } from "react";
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
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

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

    // États pour la prévisualisation et l'upload
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // États pour la visionneuse d'images
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

    // Refs
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const onlineStatusIntervalRef = useRef(null);
    const supportStatusIntervalRef = useRef(null);
    const previousMessageCountRef = useRef(0);
    const previousUnreadCountRef = useRef(0);
    const notificationSoundRef = useRef(null);

    // Helper: forcer l'URL fichier chat vers la nouvelle route /api/chat-files/public/{filename}
    const resolveChatFileUrl = (fileinfo) => {
        if (!fileinfo) return null;
        const candidate = fileinfo.url || fileinfo.name || fileinfo.filename;
        if (!candidate) return null;
        return ChatService.getChatFileUrl(candidate);
    };

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

    // Détecter si on est sur mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Charger l'historique des messages existants à l'ouverture du chat
    useEffect(() => {
        if (reference && isOpen && !chatId && !loading) {
            checkExistingChat();
        }
    }, [reference, isOpen, chatId]);

    // POLLING AUTOMATIQUE - Quand le chat est ouvert
    useEffect(() => {
        if (chatId && isOpen && !isMinimized) {
            loadChatMessages(chatId);
            const interval = setInterval(() => loadChatMessages(chatId), 5000);
            return () => clearInterval(interval);
        }
    }, [chatId, isOpen, isMinimized]);

    // ✅ POLLING EN ARRIÈRE-PLAN - TOUJOURS ACTIF
    useEffect(() => {
        const interval = setInterval(() => loadChatMessagesInBackground(true), 10000);
        loadChatMessagesInBackground(true);
        return () => clearInterval(interval);
    }, []);

    // Vérifier le statut en ligne du support toutes les 30 secondes
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

    // Auto-resize du textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(
                textareaRef.current.scrollHeight,
                120
            )}px`;
        }
    }, [message]);

    // Mettre à jour le statut en ligne du visiteur toutes les 30 secondes
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

    // Scroller vers le bas des messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Vérifier le statut en ligne du support
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

    // Vérifier si un chat existe déjà pour cette référence
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
            }
        } catch (err) {
            console.error("Erreur vérification chat existant", err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Charger en arrière-plan avec détection de nouveaux messages (COMME FloatingChatBubble)
    const loadChatMessagesInBackground = async (checkForNewMessages = false) => {
        if (!chatId) return;

        try {
            const response = await ChatService.getPublicConversation(chatId);

            if (response.success && response.chat) {
                const newMessages = response.chat.messages || [];

                // ✅ Compter les messages du support non lus
                const supportUnreadCount = newMessages.filter(
                    (msg) => msg.sender === "support" && !msg.readat
                ).length;

                // ✅ Si de nouveaux messages non lus sont détectés, jouer le son
                if (
                    checkForNewMessages &&
                    supportUnreadCount > 0 &&
                    supportUnreadCount > previousUnreadCountRef.current
                ) {
                    playNotificationSound();
                }

                // ✅ Mettre à jour la référence du compteur
                previousUnreadCountRef.current = supportUnreadCount;

                // ✅ Afficher badge uniquement si chat fermé ou minimisé
                if (!isOpen || isMinimized) {
                    setUnreadCount(supportUnreadCount > 0 ? 1 : 0);
                }

                if (!isOpen) {
                    const formattedMessages = newMessages.map((msg) => ({
                        id: msg.id,
                        text: msg.text || msg.content,
                        sender: msg.sender,
                        time: msg.time || msg.createdat,
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
                const formattedMessages =
                    response.chat.messages?.map((msg) => ({
                        id: msg.id,
                        text: msg.text || msg.content,
                        sender: msg.sender,
                        time: msg.time || msg.createdat,
                        sendername: msg.sendername,
                        senderreference: msg.senderreference,
                        isanonymous: msg.isanonymous,
                        status: msg.status,
                        readat: msg.readat,           // ✅ IMPORTANT
                        deliveredat: msg.deliveredat,  // ✅ IMPORTANT
                        type: msg.type,
                        fileinfo: msg.fileinfo,
                        avatar:
                            msg.sender === "support"
                                ? "https://ui-avatars.com/api?name=Support+FOSIKA&background=4c7026&color=fff"
                                : getVisitorAvatar(msg.isanonymous, msg.sendername),
                    })) || [];

                const currentCount = messages.length;
                const newCount = formattedMessages.length;

                if (newCount > currentCount && currentCount > 0) {
                    const lastMessage = formattedMessages[formattedMessages.length - 1];
                    if (lastMessage && lastMessage.sender === "support") {
                        playNotificationSound();
                    }
                }

                setMessages(formattedMessages);
                previousMessageCountRef.current = newCount;

                // ✅ Marquer les messages du support comme lus
                await ChatService.markPublicAsRead(chatIdToLoad);

                setUnreadCount(0);
                previousUnreadCountRef.current = 0;
            }
        } catch (err) {
            console.error("Erreur chargement messages", err);
        }
    };


    const getVisitorAvatar = (isAnonymous, name) => {
        if (isAnonymous) {
            return "https://ui-avatars.com/api?name=Anonyme&background=94a3b8&color=fff";
        }
        const displayName = name || "Visiteur";
        return `https://ui-avatars.com/api?name=${encodeURIComponent(
            displayName
        )}&background=3b82f6&color=fff`;
    };

    const getVisitorDisplayName = (isAnonymous, name, reference) => {
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
    };

    const formatRelativeTime = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            return formatDistanceToNow(date, { addSuffix: true, locale: fr });
        } catch (e) {
            return dateString;
        }
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

    // Ouvrir la visionneuse d'images
    const openImageViewer = (imageUrl) => {
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
    };

    // Fermer la visionneuse
    const closeImageViewer = () => {
        setImageViewer({
            isOpen: false,
            currentImage: null,
            currentIndex: 0,
            images: [],
        });
    };

    // Navigation dans la visionneuse
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

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        const messageToSend = message.trim();
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
                await loadChatMessages(chatId || response.chatid);
            }
        } catch (err) {
            console.error("Erreur envoi message", err);
            setError(err.message || "Erreur lors de l'envoi du message");
            setMessage(messageToSend);
        } finally {
            setSendingMessage(false);
        }
    };

    // Gérer la sélection d'image avec prévisualisation
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

    // Gérer la sélection de fichier
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

    // Envoyer le fichier avec progression
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

    // ✅ Réinitialiser le badge quand on ouvre le chat
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

    const formatTime = (timeString) => {
        if (!timeString) return "";
        try {
            if (typeof timeString === "string" && timeString.includes(":")) {
                return timeString;
            }
            const time = new Date(timeString);
            return format(time, "HH:mm", { locale: fr });
        } catch (e) {
            return timeString;
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

            {/* VISIONNEUSE D'IMAGES Modal */}
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

            {/* ✅ Bulle Flottante AVEC BADGE */}
            {!isOpen && (
                <button
                    onClick={handleOpen}
                    className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 z-50 group"
                    title="Ouvrir le support"
                >
                    <MessageCircle className="w-7 h-7" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
        {unreadCount}  {/* ✅ Affiche le nombre réel */}
      </span>
                    )}
                    <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-800 text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <p className="font-semibold">Support dossier</p>
                        <p className="text-[10px] text-gray-600">{reference}</p>
                    </div>
                </button>
            )}

            {/* Fenêtre de chat - Plein écran sur mobile */}
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
                                    Chargement de l'historique...
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
                                const displayInfo = getVisitorDisplayName(
                                    msg.isanonymous,
                                    msg.sendername,
                                    msg.senderreference
                                );

                                const fileUrl = resolveChatFileUrl(msg.fileinfo);

                                return (
                                    <div
                                        key={msg.id || index}
                                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                    >
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
                                                            Équipe d'assistance
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
                                                                    type={msg.fileinfo?.type || "video/mp4"}
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
                                                                isMe ? "bg-green-700" : "bg-gray-50"
                                                            }`}
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
                                                                        className={`text-sm font-medium truncate ${
                                                                            isMe ? "text-white" : "text-gray-800"
                                                                        }`}
                                                                    >
                                                                        {msg.fileinfo?.name || "Fichier"}
                                                                    </p>
                                                                    {msg.fileinfo?.filesize && (
                                                                        <p
                                                                            className={`text-xs ${
                                                                                isMe
                                                                                    ? "text-green-100"
                                                                                    : "text-gray-500"
                                                                            }`}
                                                                        >
                                                                            {formatFileSize(msg.fileinfo.filesize)}
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
                                                                            ? "bg-green-800 hover:bg-green-900 text-white"
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
                                                                {msg.text}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div
                                                        className={`px-4 pb-2 flex items-center justify-end gap-1 text-[10px] ${
                                                            isMe ? "text-green-100" : "text-gray-400"
                                                        }`}
                                                    >
                                                        <span>{formatTime(msg.time)}</span>
                                                        {isMe && <MessageStatusIcon status={msg.status} />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Prévisualisation fichier sélectionné */}
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
                                                    className="bg-green-600 h-2 rounded-full transition-all duration-200"
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
                                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
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
                    className="w-full resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent max-h-[120px]"
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
                                className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* ✅ Mode minimisé AVEC BADGE */}
            {isOpen && isMinimized && (
                <button
                    onClick={() => setIsMinimized(false)}
                    className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 z-50"
                    title="Ouvrir le support"
                >
                    <MessageCircle className="w-7 h-7" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
        {unreadCount}  {/* ✅ Affiche le nombre réel */}
      </span>
                    )}
                </button>
            )}

        </>
    );
};

export default FloatingChatSupport;
