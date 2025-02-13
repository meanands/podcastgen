import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubtitlesProps {
    text: string;
    speaker: string;
    isPlaying: boolean;
}

export function Subtitles({ text, speaker, isPlaying }: SubtitlesProps) {
    const [displayText, setDisplayText] = useState(text);

    useEffect(() => {
        setDisplayText(text);
    }, [text]);

    if (!text || !isPlaying) return null;

    return (
        <div className="w-full min-h-[100px] flex items-center justify-center">
            <AnimatePresence mode="wait">
                <motion.div
                    key={text} // This ensures animation triggers on text change
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                >
                    <div className="text-sm text-muted-foreground mb-2">
                        {speaker.charAt(0).toUpperCase() + speaker.slice(1)}
                    </div>
                    <div className="text-xl font-medium">
                        {displayText}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
} 