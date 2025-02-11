import axios from "axios";
import { readFileSync } from "fs";
import pdf from "pdf-parse";

export async function pdf2Text(pdfPath: string){
    try {
        // Fetch the PDF file
        const pdfBuffer = readFileSync(pdfPath);

        // Extract text from PDF
        const data = await pdf(pdfBuffer);
        const extractedText = data.text;

        return extractedText;
    } catch (error) {
        console.error("Error processing PDF:", error);
    }
}