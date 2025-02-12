import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Script {
    filename: string;
    timestamp: number;
}

interface ScriptListProps {
    onScriptSelect: (filename: string) => void;
    selectedScript?: string;
}

export function ScriptList({ onScriptSelect, selectedScript }: ScriptListProps) {
    const [scripts, setScripts] = useState<Script[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('http://localhost:3000/scripts')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setScripts(data.scripts);
                } else {
                    setError(data.error || 'Failed to load scripts');
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-4">Loading scripts...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

    return (
        <ScrollArea className="h-[calc(100vh-2rem)] w-full rounded-md border">
            <div className="p-4 space-y-4">
                <h2 className="text-xl font-bold mb-4">Available Scripts</h2>
                {scripts.map((script) => (
                    <Card 
                        key={script.filename}
                        className={`cursor-pointer transition-colors hover:bg-accent ${
                            selectedScript === script.filename ? 'bg-accent' : ''
                        }`}
                        onClick={() => onScriptSelect(script.filename)}
                    >
                        <CardContent className="p-4">
                            <div className="font-medium">{script.filename}</div>
                            <div className="text-sm text-muted-foreground">
                                {new Date(script.timestamp).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </ScrollArea>
    );
} 