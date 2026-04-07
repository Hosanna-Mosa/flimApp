import React, { useState, createContext, useContext } from 'react';

interface MediaContextType {
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
    toggleMute: () => void;
    currentPlayingAudioId: string | null;
    setCurrentPlayingAudioId: (id: string | null) => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export function MediaProvider({ children }: { children: React.ReactNode }) {
    const [isMuted, setIsMuted] = useState(false);
    const [currentPlayingAudioId, setCurrentPlayingAudioId] = useState<string | null>(null);

    const toggleMute = () => {
        setIsMuted(prev => !prev);
    };

    return (
        <MediaContext.Provider value={{ 
            isMuted, 
            setIsMuted, 
            toggleMute,
            currentPlayingAudioId,
            setCurrentPlayingAudioId
        }}>
            {children}
        </MediaContext.Provider>
    );
}

export function useMedia() {
    const context = useContext(MediaContext);
    if (context === undefined) {
        throw new Error('useMedia must be used within a MediaProvider');
    }
    return context;
}
