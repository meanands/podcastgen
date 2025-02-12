'use client';

import { useState } from 'react';
import { ScriptList } from '@/components/ScriptList';
import { AudioPlayer } from '@/components/AudioPlayer';

export default function Home() {
  const [selectedScript, setSelectedScript] = useState<string>();

  return (
    <main className="flex min-h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-80 border-r">
        <ScriptList 
          onScriptSelect={setSelectedScript}
          selectedScript={selectedScript}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <AudioPlayer scriptFile={selectedScript} />
      </div>
    </main>
  );
}
