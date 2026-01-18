import apiClient from "@/utils/axiosConfig";
import * as ImagePicker from "expo-image-picker";

export const getChats = async () => {
    const response = await apiClient.get('/chats');
    return response.data;
}

export const getAllUsers = async () => {
    const response = await apiClient.get('/users');
    return response.data;
}

export const createChat = async (participantId: string) => {
    const response = await apiClient.post('/chats/create', { participantId });
    return response.data;
}

export const getChatMessages = async (chatId: string) => {
    const response = await apiClient.get(`/chats/${chatId}/messages`);
    return response.data;
}

export const getChatById = async (chatId: string) => {
    // Get all chats and filter for the specific one
    const response = await apiClient.get('/chats');
    const chats = response.data?.data?.chats || [];
    const chat = chats.find((c: any) => c._id === chatId);
    return { data: chat };
}

export const uploadChatImage = async (image: ImagePicker.ImagePickerAsset) => {
    const formData = new FormData();

    // Create file object for React Native
    const imageFile = {
        uri: image.uri,
        type: image.mimeType || 'image/jpeg',
        name: image.fileName || `chat_image_${Date.now()}.jpg`,
    } as any;

    formData.append('image', imageFile);

    const response = await apiClient.post('/chats/uploadImage', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
}

export const uploadVoiceMessage = async (audioUri: string) => {
    try {
        const formData = new FormData();

        const audioFile = {
            uri: audioUri,
            type: 'audio/mp4',
            name: `voice_${Date.now()}.m4a`,
        } as any;

        formData.append('audio', audioFile);

        console.log("Uploading voice message", { uri: audioUri, type: audioFile.type, name: audioFile.name });

        const response = await apiClient.post('/chats/upload-voice', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log("Voice upload response", response.data);
        return response.data;
    } catch (error: any) {
        console.error("Voice upload error:", error?.message || error);
        console.error("Error details:", error?.response?.data);
        throw error;
    }
}
