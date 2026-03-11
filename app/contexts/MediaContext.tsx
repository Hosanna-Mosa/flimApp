import React, { useState, createContext, useContext } from 'react';

interface MediaContextType {
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
    toggleMute: () => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export function MediaProvider({ children }: { children: React.ReactNode }) {
    const [isMuted, setIsMuted] = useState(false);

    const toggleMute = () => {
        setIsMuted(prev => !prev);
    };

    return (
        <MediaContext.Provider value={{ isMuted, setIsMuted, toggleMute }}>
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
