import express from "express"
import {createServer} from "http"
import {WebSocket} from "ws"
import { AudioStream } from "./audio-stream";
import { URL } from 'url';
import multer from 'multer';
import path from 'path';
import { LLM } from "./llm";
import { generateScript } from "./script";
import { readdir } from 'fs/promises';
import * as dotenv from "dotenv"

dotenv.config()

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server, clientTracking: true });
const llm = new LLM({
    baseUrl: "https://api.openai.com/v1/",
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY
});

// Configure multer for PDF uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'tmp_data');
        console.log('Upload path:', uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.fieldname + '-' + uniqueSuffix + '.pdf';
        console.log('Generated filename:', filename);
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        console.log('Received file:', file);
        // Accept only PDF files
        if (file.mimetype === 'application/pdf') {
            console.log("File is PDF, accepting");
            cb(null, true);
        } else {
            console.log("File is not PDF, rejecting. Mimetype:", file.mimetype);
            cb(new Error('Only PDF files are allowed!'));
        }
    }
});

// Enable JSON body parsing
app.use(express.json());

// Add CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// PDF upload endpoint
app.post('/upload-pdf', (req, res) => {
    console.log('Received upload request');
    
    // Check if uploads are disabled
    if (process.env.DISABLE_PDF_UPLOADS === 'true') {
        return res.status(403).json({ 
            error: 'PDF uploads are disabled in demo version' 
        });
    }
    
    upload.single('pdf')(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ error: err.message });
        }

        try {
            console.log('File details:', req.file);
            
            if (!req.file) {
                console.error('No file in request');
                return res.status(400).json({ error: 'No PDF file uploaded' });
            }

            const filePath = path.join(req.file.destination, req.file.filename);
            console.log('Full file path:', filePath);

            const script = await generateScript({
                pdfPath: filePath,
                llm
            });

            res.json({ 
                success: true,
                filename: req.file.filename,
                path: req.file.path,
                script
            });
        } catch (error: any) {
            console.error('Error processing upload:', error);
            res.status(500).json({ error: 'Error processing file', details: error.message });
        }
    });
});

// Get list of available scripts
app.get('/scripts', async (req, res) => {
    try {
        const scriptsDir = path.join(__dirname, 'generated-files', 'scripts');
        const files = await readdir(scriptsDir);
        
        // Filter only JSON files
        const scriptFiles = files
            .filter(file => file.endsWith('.json'))
            .map(file => ({
                filename: file,
                timestamp: parseInt(file.split('.')[0]) // Extract timestamp from filename
            }))
            .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp, newest first

        res.json({
            success: true,
            scripts: scriptFiles
        });
    } catch (error: any) {
        console.error('Error reading scripts directory:', error);
        res.status(500).json({ 
            error: 'Error reading scripts directory', 
            details: error.message 
        });
    }
});

wss.on("connection", (ws, request) => {
    console.log("Client connected");

    // Parse the URL to get query parameters
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const scriptFile = url.searchParams.get('scriptFile');

    if (!scriptFile) {
        console.error("No scriptFile provided");
        ws.close(1008, "scriptFile parameter is required");
        return;
    }

    const audioStream = new AudioStream({
        scriptFile,
        ws
    });

    audioStream.init();
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
