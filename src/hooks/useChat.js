// src/hooks/useChat.js
import { useState, useEffect } from 'react';
import ChatService from '../services/chatService';

const useChat = () => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadChats = async (filter = 'all') => {
        try {
            setLoading(true);
            setError(null);

            const response = await ChatService.getUserChats(filter);

            if (response.success) {
                setChats(response.chats || []);
                return response.chats;
            }
        } catch (err) {
            setError(err.message || "Erreur lors du chargement des conversations");
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (chatId, content) => {
        try {
            const response = await ChatService.sendMessage(chatId, {
                content,
                type: 'text'
            });

            if (response.success) {
                await loadChats();
                return response.message;
            }
        } catch (err) {
            throw err;
        }
    };

    const toggleImportant = async (chatId) => {
        try {
            const response = await ChatService.toggleImportant(chatId);

            if (response.success) {
                await loadChats();
                return response.is_important;
            }
        } catch (err) {
            throw err;
        }
    };

    useEffect(() => {
        loadChats();
    }, []);

    return {
        chats,
        loading,
        error,
        loadChats,
        sendMessage,
        toggleImportant
    };
};

export default useChat;