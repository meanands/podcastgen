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
    
                this.stream(nextDialog.conversation, this.voice[nextDialog.from]);
            }
        });
    }

    stream(text: string, voice="lessac/en_US-lessac-high"){
        
        const command = "source ~/.zshrc && pyenv activate myenv && piper --model "+path.join(__dirname, "..", "resources", "voice",voice+".onnx")+" --output-raw";

        const piper = spawn("/bin/bash", ["-c", command]);

        piper.stdin.write(text + "\n");
        piper.stdin.end();

        piper.stdout.on("data", (data) => {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(data);
            }
        });

        piper.on("close", () => {
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