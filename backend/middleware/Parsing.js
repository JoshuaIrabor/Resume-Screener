import fs from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

// Function to parse PDF
export const parsePdf = async (filePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist');
    }

    // Read the PDF file as a buffer
    const pdfBuffer = fs.readFileSync(filePath);

    // Parse the PDF content using pdf-parse
    const data = await pdf(pdfBuffer);

    // Return the extracted text, trimmed of any extra whitespace
    return data.text.trim();
  } catch (error) {
    console.error('Error parsing PDF:', error.message);
    throw error; // Rethrow error for further handling
  }
};

// Function to parse DOCX
export const parseDocx = async (filePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist');
    }

    // Read the DOCX file as a buffer
    const docBuffer = fs.readFileSync(filePath);

    // Parse the DOCX content using mammoth to extract raw text
    const result = await mammoth.extractRawText({ buffer: docBuffer });

    // Return the extracted text, trimmed of any extra whitespace
    return result.value.trim();
  } catch (error) {
    console.error('Error parsing DOCX:', error.message);
    throw error; // Rethrow error for further handling
  }
};
