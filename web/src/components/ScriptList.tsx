import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchScripts = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:3000/scripts');
            const data = await res.json();
            if (data.success) {
                setScripts(data.scripts);
                setError(null);
            } else {
                setError(data.error || 'Failed to load scripts');
            }
        } catch (err) {
            setError('Failed to fetch scripts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScripts();
    }, []);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        // Check if file is PDF
        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file');
            return;
        }

        const formData = new FormData();
        formData.append('pdf', file);

        try {
            setUploading(true);
            setError(null);

            const response = await fetch('http://localhost:3000/upload-pdf', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            // Refresh the script list
            await fetchScripts();
        } catch (err: any) {
            setError(err.message || 'Failed to upload PDF');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b">
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                />
                <Button 
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing PDF...
                        </>
                    ) : (
                        'Upload PDF'
                    )}
                </Button>
                {uploading && (
                    <div className="mt-2 text-sm text-muted-foreground text-center">
                        This may take several minutes...
                    </div>
                )}
                {error && (
                    <div className="mt-2 text-sm text-red-500">
                        {error}
                    </div>
                )}
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    <h2 className="text-xl font-bold mb-4">Available Scripts</h2>
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : scripts.length > 0 ? (
                        scripts.map((script) => (
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
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground">
                            No scripts available
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
} 