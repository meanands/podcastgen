import { writeFile, mkdir } from "fs/promises";
import { LLM } from "../llm";
import { pdf2Text } from "./pdf-to-text";
import { SYSTEM_PROMPT } from "./prompt";
import path from 'path';

export async function generateScript(config: {
    pdfPath: string,
    llm: LLM
}) {
    const timestampMs = Date.now();
    const scriptsDir = path.join(__dirname, '..', 'generated-files', 'scripts');    
    await mkdir(scriptsDir, { recursive: true });
     const outputPath = path.join(scriptsDir, `${timestampMs}.json`);

    console.log("reading pdf ", config.pdfPath);
    const text = await pdf2Text(config.pdfPath) || '';
    await writeFile(outputPath+".txt", text);


    try {
        const json = await config.llm.prompt(text, SYSTEM_PROMPT);
        
        
        // Write the file
        await writeFile(outputPath, json);
        
        return outputPath;
    } catch (error) {
        console.error("Error generating JSON from PDF:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
}

