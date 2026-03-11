import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VideoContextType {
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
    toggleMute: () => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: React.ReactNode }) {
    const [isMuted, setMuted] = useState(false);

    useEffect(() => {
        loadMuteState();
    }, []);

    const loadMuteState = async () => {
        try {
            const saved = await AsyncStorage.getItem('video_muted');
            if (saved !== null) {
                setMuted(saved === 'true');
            }
        } catch (e) {
            // Ignore
        }
    };

    const setIsMuted = async (muted: boolean) => {
        setMuted(muted);
        try {
            await AsyncStorage.setItem('video_muted', String(muted));
        } catch (e) {
            // Ignore
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    return (
        <VideoContext.Provider value={{ isMuted, setIsMuted, toggleMute }}>
            {children}
        </VideoContext.Provider>
    );
}

export function useVideo() {
    const context = useContext(VideoContext);
    if (context === undefined) {
        throw new Error('useVideo must be used within a VideoProvider');
    }
    return context;
}
