import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AudioVisualizer } from "@/components/AudioVisualizer";

interface AudioPlayerProps {
    scriptFile?: string;
}

export function AudioPlayer({ scriptFile }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const wsRef = useRef<WebSocket | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<Int16Array[]>([]);
    const isProcessingRef = useRef(false);
    const isPlayingRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    
    const clearPendingTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            clearPendingTimeout();
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    const initializeAudioContext = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 22050
            });
            // Create analyzer node
            analyserRef.current = audioCtxRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            analyserRef.current.connect(audioCtxRef.current.destination);
        }
        return audioCtxRef.current;
    };

    const playNextChunk = async () => {
        console.log('playNextChunk called, isPlaying:', isPlayingRef.current, 'queue length:', audioQueueRef.current.length);
        
        if (!audioCtxRef.current || !isPlayingRef.current) {
            console.log('Returning early - no audioCtx or not playing');
            return;
        }
        
        if (audioQueueRef.current.length === 0) {
            console.log('Queue empty, requesting next chunk');
            if (wsRef.current?.readyState === WebSocket.OPEN && !isProcessingRef.current) {
                isProcessingRef.current = true;
                wsRef.current.send("next");
                checkForEndOfPodcast();
            }
            return;
        }

        try {
            clearPendingTimeout(); // Clear any pending timeout when we start playing a chunk
            isProcessingRef.current = true;
            const rawPCM = audioQueueRef.current.shift()!;
            console.log('Processing chunk, length:', rawPCM.length);

            // Resume the AudioContext if it's suspended
            if (audioCtxRef.current.state === 'suspended') {
                console.log('Resuming AudioContext');
                await audioCtxRef.current.resume();
            }

            const buffer = audioCtxRef.current.createBuffer(1, rawPCM.length, 22050);
            const channelData = buffer.getChannelData(0);

            // Convert Int16 PCM to normalized float (-1 to 1 range)
            for (let i = 0; i < rawPCM.length; i++) {
                channelData[i] = rawPCM[i] / 32768.0;
            }

            const source = audioCtxRef.current.createBufferSource();
            source.buffer = buffer;
            
            // Connect to analyzer first, then to destination
            if (analyserRef.current) {
                source.connect(analyserRef.current);
            } else {
                source.connect(audioCtxRef.current.destination);
            }
            
            await new Promise<void>((resolve) => {
                source.onended = () => {
                    console.log('Chunk playback ended');
                    resolve();
                };
                console.log('Starting playback of chunk');
                source.start(0);
            });

            // Only after the current chunk has finished playing
            isProcessingRef.current = false;
            if (isPlayingRef.current) {
                // Request next chunk if queue is empty
                if (audioQueueRef.current.length === 0) {
                    console.log('Queue empty after chunk played, requesting next');
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send("next");
                        checkForEndOfPodcast();
                    }
                } else {
                    // Play next chunk if we have one in queue
                    console.log('Playing next chunk from queue');
                    await playNextChunk();
                }
            }
        } catch (error) {
            console.error('Error playing chunk:', error);
            isProcessingRef.current = false;
            throw error;
        }
    };

    const handlePlay = async () => {
        clearPendingTimeout(); // Clear any existing timeout when starting playback
        if (!scriptFile) {
            setError('Please select a script first');
            return;
        }

        try {
            const ctx = initializeAudioContext();
            // Ensure AudioContext is running
            if (ctx.state === 'suspended') {
                console.log('Resuming AudioContext in handlePlay');
                await ctx.resume();
            }
            
            setIsPlaying(true);
            isPlayingRef.current = true;
            
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                console.log('Creating new WebSocket connection');
                const wsUrl = `ws://localhost:3000?scriptFile=${encodeURIComponent(scriptFile)}`;
                wsRef.current = new WebSocket(wsUrl);
                wsRef.current.binaryType = "arraybuffer";

                wsRef.current.onopen = () => {
                    console.log('WebSocket connected');
                    setIsConnected(true);
                    setError(null);
                    wsRef.current?.send("next");
                    checkForEndOfPodcast();
                };

                wsRef.current.onmessage = async (event) => {
                    console.log('Received audio chunk');
                    clearPendingTimeout(); // Clear timeout when we receive data
                    const rawPCM = new Int16Array(event.data);
                    audioQueueRef.current.push(rawPCM);
                    
                    if (!isProcessingRef.current) {
                        console.log('Starting playback chain');
                        await playNextChunk();
                    } else {
                        console.log('Already processing, queued chunk');
                    }
                };

                wsRef.current.onclose = () => {
                    console.log('WebSocket closed');
                    setIsConnected(false);
                    setIsPlaying(false);
                    isPlayingRef.current = false;
                    isProcessingRef.current = false;
                    clearPendingTimeout();
                };

                wsRef.current.onerror = () => {
                    console.error('WebSocket error occurred');
                    setError('WebSocket connection failed');
                    setIsConnected(false);
                    setIsPlaying(false);
                    isPlayingRef.current = false;
                    isProcessingRef.current = false;
                    clearPendingTimeout();
                };
            } else {
                console.log('Using existing WebSocket connection');
                wsRef.current.send("next");
                checkForEndOfPodcast();
            }
        } catch (err: any) {
            console.error('Error in handlePlay:', err);
            setError(err.message);
        }
    };

    const handleStop = () => {
        clearPendingTimeout();
        if (wsRef.current) {
            wsRef.current.close();
        }
        setIsPlaying(false);
        isPlayingRef.current = false;
        isProcessingRef.current = false;
        audioQueueRef.current = [];
    };

    const checkForEndOfPodcast = () => {
        clearPendingTimeout();
        timeoutRef.current = setTimeout(() => {
            console.log('No more data received - podcast finished');
            handleStop();
        }, 5000); // Wait 2 seconds for new data before assuming it's finished
    };

    return (
        <Card className="w-full h-full">
            <CardContent className="p-6">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Audio Player</h2>
                    {error && (
                        <div className="text-red-500 mb-4">{error}</div>
                    )}
                    {scriptFile ? (
                        <div className="space-y-4">
                            <div className="text-lg">Playing: {scriptFile}</div>
                            <div className="mb-4">
                                <AudioVisualizer 
                                    analyserNode={analyserRef.current}
                                    isPlaying={isPlaying}
                                />
                            </div>
                            <div className="flex space-x-4">
                                <Button
                                    onClick={isPlaying ? handleStop : handlePlay}
                                    variant={isPlaying ? "destructive" : "default"}
                                >
                                    {isPlaying ? "Stop" : "Play"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-muted-foreground">
                            Select a script from the sidebar to play
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 