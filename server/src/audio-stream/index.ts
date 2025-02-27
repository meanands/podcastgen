import { spawn } from "child_process";
import { Script } from "../types";
import { readFileSync } from "fs";
import {WebSocket, RawData} from "ws"
import path from "path";

export class AudioStream{


    private script: Script;
    private dialogIndex = 0;
    private voice = {
        host: "lessac/medium/en_US-lessac-medium",
        expert: "kusal/en_US-kusal-medium"
    }
    
    ws: WebSocket

    constructor(config:{
        scriptFile: string
        ws: WebSocket
    }){
        const scriptPath = path.join(__dirname, "..", "generated-files", "scripts", config.scriptFile);
        const fileBody = readFileSync(scriptPath, "utf-8");
        this.script = JSON.parse(fileBody);
        this.ws = config.ws
    }

    init(){
        this.ws.on("message", (message: RawData) => {
            const text = message.toString('utf-8');
            
            if(text === "next"){
                console.log("getting nextDialog");
                const nextDialog = this.getNextDialog();
                console.log("nextDialog is",nextDialog);
                
                if(!nextDialog) return;
    
                // Send subtitle data before streaming audio
                const subtitleData = {
                    type: 'subtitle',
                    index: this.dialogIndex - 1, // -1 because getNextDialog already incremented it
                    text: nextDialog.conversation,
                    speaker: nextDialog.from
                };
                console.log('Sending subtitle data:', subtitleData);
                this.ws.send(JSON.stringify(subtitleData));
    
                this.stream(nextDialog.conversation, this.voice[nextDialog.from]);
            }
        });
    }

    stream(text: string, voice="lessac/en_US-lessac-high"){
        // Use piper from virtual environment
        const piperPath = '/opt/venv/bin/piper';
        console.log('Executing piper from:', piperPath);

        const piper = spawn(piperPath, [
            '--model', `/app/voices/${voice}.onnx`,
            '--output-raw'
        ]);

        piper.stdin.write(text + "\n");
        piper.stdin.end();

        piper.stdout.on("data", (data) => {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(data);
            }
        });

        piper.on("close", (code) => {
            console.log(`Piper process exited with code ${code}`);
        });

        piper.stderr.on("data", (err) => {
            console.error("Piper Error:", err.toString());
        });
    }

    getNextDialog(){

        const dialog = this.script[this.dialogIndex];
    
        if(!dialog){
            return false
        }
    
        this.dialogIndex++;
    
        return dialog;
    }

}