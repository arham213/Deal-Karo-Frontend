import { io } from "socket.io-client";

// Use your computer's IP address (same as API)
const SOCKET_URL = 'https://deal-karo-backend.onrender.com';

const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
})

export const connectSocket = (user: any) => {
    console.log('user:', user);
    socket.auth = {
        userId: user._id,
        username: user.name,
    };

    if (!socket.connected) {
        console.log('user found, connecting socket...', user);
        socket.connect();

        socket.once('connect', () => {
            console.log('Socket connected on connectSocket call with id:', socket.id);
        });
    }
}

export const disconnectSocket = () => {
    if (socket.connected) {
        console.log('disconnecting socket...');
        socket.disconnect()

        socket.once('disconnect', (reason: any) => {
            console.log('Socket disconnected on disconnectSocket call. Reason:', reason);
        });
    }
}

export const joinChat = (chatId: string) => {
    console.log('Joining chat with id:', chatId);
    if (socket.connected) {
        console.log('Socket connected, emitting join_chat for chatId:', chatId);
        socket.emit('join_chat', chatId);
    } else {
        console.log('Socket not connected, waiting for connection to join chat:', chatId);
        socket.once('connect', () => {
            console.log('Socket connected, now emitting join_chat for chatId:', chatId);
            socket.emit('join_chat', chatId);
        });
    }
}

export const sendMessage = (chatId: string, message: string, type: string) => {
    console.log('Sending message to chatId:', chatId, 'Message:', message);
    if (socket.connected) {
        socket.emit('send_message', { chatId, content: message, type });
    } else {
        console.error('Socket not connected. Cannot send message.');
        socket.once('connect', () => {
            console.log('Socket connected, now sending message to chatId:', chatId);
            socket.emit('send_message', { chatId, content: message, type });
        });
    }
}

export const sendTypingEvent = (chatId: string, isTyping: boolean) => {
    console.log('Sending typing event to chatId:', chatId, 'isTyping:', isTyping);
    if (socket.connected) {
        console.log('Socket connected, emitting typing event for chatId:', chatId);
        socket.emit('typing', { chatId, isTyping });
    } else {
        console.log('Socket not connected, waiting for connection to send typing event for chatId:', chatId);
        socket.once('connect', () => {
            console.log('Socket connected, now emitting typing event for chatId:', chatId);
            socket.emit('typing', { chatId, isTyping });
        })
    }
}

export const markMessagesAsRead = (chatId: string) => {
    console.log('Marking messages as read for chatId:', chatId);
    if (socket.connected) {
        console.log('Socket connected, emitting mark_read for chatId:', chatId);
        socket.emit('mark_read', { chatId });
    } else {
        console.log('Socket not connected, waiting for connection to mark messages as read for chatId:', chatId);
        socket.once('connect', () => {
            console.log('Socket connected, now emitting mark_read for chatId:', chatId);
            socket.emit('mark_read', { chatId })
        })
    }
}

export const sendVoiceMessage = (chatId: string, voiceUrl: string, duration: number) => {
    console.log('Sending voice message to chatId:', chatId, 'URL:', voiceUrl, 'Duration:', duration);
    if (socket.connected) {
        socket.emit('send_voice', { chatId, voiceUrl, duration });
    } else {
        console.error('Socket not connected. Cannot send voice message.');
        socket.once('connect', () => {
            console.log('Socket connected, now sending voice message to chatId:', chatId);
            socket.emit('send_voice', { chatId, voiceUrl, duration });
        });
    }
}

socket.on('connect', () => {
    console.log('Connected to server with socket id, auth:', socket.id, socket.auth);
})

socket.on('disconnect', (reason: any) => {
    console.log('Disconnected from server. Reason:', reason);
})

socket.on('connect_error', (error: any) => {
    console.error('Socket connection error:', error.message);
    console.error('Full error:', error);
})

socket.on('error', (error: any) => {
    console.error('Socket error:', error);
})

export default socket;
