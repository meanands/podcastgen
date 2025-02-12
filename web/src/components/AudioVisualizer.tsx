import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    analyserNode: AnalyserNode | null;
    isPlaying: boolean;
}

export function AudioVisualizer({ analyserNode, isPlaying }: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!canvasRef.current || !analyserNode) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isPlaying) {
                // Clear canvas when not playing
                ctx.fillStyle = 'rgb(23, 23, 23)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                return;
            }

            animationFrameRef.current = requestAnimationFrame(draw);

            analyserNode.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgb(23, 23, 23)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;

                // Create gradient
                const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
                gradient.addColorStop(0, '#22c55e');  // Green
                gradient.addColorStop(1, '#4ade80');  // Lighter green

                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        if (isPlaying) {
            draw();
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            // Clear canvas
            ctx.fillStyle = 'rgb(23, 23, 23)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, analyserNode]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-32 rounded-lg bg-neutral-900"
            width={800}
            height={128}
        />
    );
} 