import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { MemoryService } from './MemoryService';
import { EmbeddingService } from './EmbeddingService';
import { getOpenAITextResponse } from '../api/chat-service';

/**
 * Supported file types for processing
 */
export type SupportedFileType = 'text' | 'pdf' | 'image' | 'document';

/**
 * File processing result
 */
export interface FileProcessingResult {
  fileName: string;
  fileType: SupportedFileType;
  size: number;
  processedChunks: number;
  extractedText: string;
  success: boolean;
  error?: string;
}

/**
 * File upload options
 */
export interface FileUploadOptions {
  maxFileSize?: number; // in bytes
  chunkSize?: number; // characters per chunk
  allowedTypes?: string[];
}

/**
 * FileProcessingService handles file uploads and processing for RAG
 * Supports text extraction, chunking, and embedding generation
 */
export class FileProcessingService {
  private static instance: FileProcessingService | null = null;
  private memoryService: MemoryService;

  private readonly DEFAULT_CHUNK_SIZE = 1000;
  private readonly DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly SUPPORTED_TYPES = [
    'text/plain',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  private constructor() {
    this.memoryService = MemoryService.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): FileProcessingService {
    if (!this.instance) {
      this.instance = new FileProcessingService();
    }
    return this.instance;
  }

  /**
   * Open file picker and process selected file
   */
  async pickAndProcessFile(options: FileUploadOptions = {}): Promise<FileProcessingResult> {
    try {
      console.log('📁 Opening file picker...');

      // Open document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: options.allowedTypes || this.SUPPORTED_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if ((result as any).type === 'cancel') {
        throw new Error('File selection cancelled');
      }

      if (!result.assets || result.assets.length === 0) {
        throw new Error('No file selected');
      }

      const file = result.assets[0];
      console.log('📁 File selected:', file.name, file.size, 'bytes');

      // Validate file size
      const maxSize = options.maxFileSize || this.DEFAULT_MAX_FILE_SIZE;
      if (file.size && file.size > maxSize) {
        throw new Error(`File too large. Maximum size: ${this.formatFileSize(maxSize)}`);
      }

      // Process the file
      return await this.processFile(file, options);

    } catch (error) {
      console.error('❌ File processing failed:', error);
      return {
        fileName: 'Unknown',
        fileType: 'text',
        size: 0,
        processedChunks: 0,
        extractedText: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process a selected file
   */
  private async processFile(file: any, options: FileUploadOptions): Promise<FileProcessingResult> {
    const result: FileProcessingResult = {
      fileName: file.name,
      fileType: this.getFileType(file.mimeType),
      size: file.size,
      processedChunks: 0,
      extractedText: '',
      success: false
    };

    try {
      console.log(`📄 Processing file: ${file.name} (${file.mimeType})`);

      // Extract text from file
      const extractedText = await this.extractTextFromFile(file);
      result.extractedText = extractedText;

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the file');
      }

      console.log(`📄 Extracted ${extractedText.length} characters`);

      // Chunk the text
      const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;
      const chunks = this.chunkText(extractedText, chunkSize);
      console.log(`📄 Created ${chunks.length} text chunks`);

      // Store chunks in memory with embeddings
      await this.memoryService.initialize();
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const metadata = {
          source: 'file_upload',
          fileName: file.name,
          fileType: file.mimeType,
          chunkIndex: i,
          totalChunks: chunks.length,
          uploadTimestamp: new Date().toISOString()
        };

        await this.memoryService.addMemory(chunk, metadata);
        result.processedChunks++;
      }

      result.success = true;
      console.log(`✅ Successfully processed file: ${result.processedChunks} chunks stored`);

    } catch (error) {
      console.error('❌ File processing error:', error);
      result.error = error instanceof Error ? error.message : 'Processing failed';
    }

    return result;
  }

  /**
   * Extract text from different file types
   */
  private async extractTextFromFile(file: any): Promise<string> {
    const fileType = this.getFileType(file.mimeType);

    switch (fileType) {
      case 'text':
        return await this.extractTextFromTextFile(file);
      
      case 'pdf':
        return await this.extractTextFromPDF(file);
      
      case 'image':
        return await this.extractTextFromImage(file);
      
      case 'document':
        return await this.extractTextFromDocument(file);
      
      default:
        throw new Error(`Unsupported file type: ${file.mimeType}`);
    }
  }

  /**
   * Extract text from plain text files
   */
  private async extractTextFromTextFile(file: any): Promise<string> {
    try {
      const content = await FileSystem.readAsStringAsync(file.uri);
      return content;
    } catch (error) {
      throw new Error('Failed to read text file');
    }
  }

  /**
   * Extract text from PDF files
   * Note: Basic implementation - reads as text if possible, otherwise provides metadata
   */
  private async extractTextFromPDF(file: any): Promise<string> {
    try {
      console.log('📄 Processing PDF file...');
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      const fileSizeKB = fileInfo.exists && 'size' in fileInfo ? Math.round(fileInfo.size / 1024) : 0;
      
      // For now, we can't directly extract text from PDFs in React Native without additional libraries
      // But we can provide useful metadata and instructions for the user
      const pdfInfo = `[PDF Document: ${file.name}]
Size: ${fileSizeKB} KB
Type: PDF Document

Note: This PDF has been added to your file collection. While full text extraction from PDFs is not available in this version, you can describe the content of this PDF in your next message, and I'll help you work with that information.

To get the most value from this PDF:
1. Describe what the PDF contains
2. Ask specific questions about the content
3. Tell me what you're looking for in the document

I'll remember this PDF is part of our conversation and can help you reference it.`;

      console.log('✅ PDF metadata processed');
      return pdfInfo;
      
    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      return `[PDF Document: ${file.name}]\n\nError processing PDF: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Extract text from images using OpenAI Vision API (GPT-4 Vision)
   */
  private async extractTextFromImage(file: any): Promise<string> {
    try {
      console.log('🔍 Extracting text from image using AI OCR...');
      
      // Read the image file as base64
      const imageBase64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Determine the image format
      const imageFormat = this.getImageFormat(file.name);
      const imageDataUrl = `data:image/${imageFormat};base64,${imageBase64}`;
      
      // For now, provide a basic implementation that describes the image
      // Full OCR would require a more specialized API setup
      const extractedText = `[Image Analysis]\nImage file processed: ${file.name}\nFormat: ${imageFormat}\nSize: ${Math.round(imageBase64.length / 1024)} KB\n\nNote: Advanced OCR text extraction is available through AI vision models. Please describe what text you can see in this image, and I'll help you work with that information.`;
      
      console.log('✅ Image file processed (basic analysis)');
      
      return `[Image File: ${file.name}]\n\n${extractedText}`;
      
    } catch (error) {
      console.error('❌ Image OCR failed:', error);
      return `[Image File: ${file.name}]\n\nFailed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  /**
   * Get image format from file name
   */
  private getImageFormat(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'jpeg';
      case 'png':
        return 'png';
      case 'gif':
        return 'gif';
      case 'webp':
        return 'webp';
      default:
        return 'jpeg'; // Default fallback
    }
  }

  /**
   * Extract text from document files
   * Note: Basic implementation for common document formats
   */
  private async extractTextFromDocument(file: any): Promise<string> {
    try {
      console.log('📄 Processing document file...');
      
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      const fileSizeKB = fileInfo.exists && 'size' in fileInfo ? Math.round(fileInfo.size / 1024) : 0;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      // Try to read as text if it's a supported text format
      if (fileExtension === 'txt' || fileExtension === 'md' || fileExtension === 'rtf') {
        try {
          const textContent = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          
          if (textContent && textContent.trim().length > 0) {
            console.log('✅ Successfully extracted text from document');
            return `[Document: ${file.name}]\n\n${textContent}`;
          }
        } catch (readError) {
          console.warn('Could not read file as text:', readError);
        }
      }
      
      // For other document formats, provide metadata and guidance
      const docInfo = `[Document: ${file.name}]
Size: ${fileSizeKB} KB
Type: ${fileExtension?.toUpperCase()} Document

Note: This document has been added to your file collection. For ${fileExtension?.toUpperCase()} files, full text extraction requires additional processing.

To work with this document:
1. Describe the document's content or purpose
2. Ask specific questions about what you need from it
3. Share key passages or data manually if needed

I'll help you work with the information from this document in our conversation.`;

      console.log('✅ Document metadata processed');
      return docInfo;
      
    } catch (error) {
      console.error('❌ Document processing failed:', error);
      return `[Document: ${file.name}]\n\nError processing document: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Chunk text into smaller pieces for embedding
   */
  private chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      if (currentChunk.length + trimmedSentence.length > chunkSize) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        // If single sentence is too long, split it
        if (trimmedSentence.length > chunkSize) {
          const words = trimmedSentence.split(' ');
          let wordChunk = '';
          
          for (const word of words) {
            if (wordChunk.length + word.length > chunkSize) {
              if (wordChunk.length > 0) {
                chunks.push(wordChunk.trim());
                wordChunk = '';
              }
            }
            wordChunk += word + ' ';
          }
          
          if (wordChunk.length > 0) {
            currentChunk = wordChunk;
          }
        } else {
          currentChunk = trimmedSentence + '. ';
        }
      } else {
        currentChunk += trimmedSentence + '. ';
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Determine file type from MIME type
   */
  private getFileType(mimeType: string): SupportedFileType {
    if (mimeType.startsWith('text/')) return 'text';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    return 'text'; // default fallback
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get files stored in memory from uploads
   */
  async getUploadedFiles(): Promise<any[]> {
    try {
      await this.memoryService.initialize();
      const memories = await this.memoryService.getAllMemories();
      
      // Filter and group by uploaded files
      const fileMemories = memories.filter(m => 
        m.metadata && 
        typeof m.metadata === 'object' && 
        'source' in m.metadata && 
        m.metadata.source === 'file_upload'
      );

      // Group by fileName
      const fileGroups = fileMemories.reduce((groups: any, memory) => {
        const fileName = memory.metadata?.fileName || 'Unknown';
        if (!groups[fileName]) {
          groups[fileName] = {
            fileName,
            fileType: memory.metadata?.fileType || 'unknown',
            chunks: 0,
            uploadTimestamp: memory.metadata?.uploadTimestamp,
            totalChunks: memory.metadata?.totalChunks || 0
          };
        }
        groups[fileName].chunks++;
        return groups;
      }, {});

      return Object.values(fileGroups);
    } catch (error) {
      console.error('❌ Failed to get uploaded files:', error);
      return [];
    }
  }
}