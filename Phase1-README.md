# OnDeviceAI - Phase 1 Implementation

## Overview
OnDeviceAI is a React Native app built with Expo SDK 53 that provides semantic memory storage and vector search capabilities. The app enables users to store text memories and perform intelligent semantic searches using OpenAI embeddings.

## Phase 1 - Foundation & Core Services ✅

### 1. React Native New Architecture
- ✅ Updated app.json with `newArchEnabled: true`
- ✅ Using React Native 0.79.2 with Expo SDK 53
- ✅ Hermes, Fabric, and TurboModules enabled by default in Expo

### 2. Dependencies Installed & Configured
- ✅ `expo-sqlite` - SQLite database (Expo-compatible, already installed)
- ✅ `ai` - AI utilities (replaces @vercel/ai which was not found)
- ✅ `react-native-permissions` - Permission handling
- ✅ `react-native-dotenv` - Environment variable support
- ✅ `zustand` - Already installed for state management
- ✅ `openai`, `@anthropic-ai/sdk` - Already installed and configured

**Note:** Switched from `@op-engineering/op-sqlite` to `expo-sqlite` for Expo Go compatibility.

### 3. Environment Variables Setup
- ✅ Updated babel.config.js with react-native-dotenv plugin
- ✅ Created TypeScript definitions for @env module
- ✅ Updated tsconfig.json with proper path resolution
- ✅ API keys already configured in .env file

### 4. MemoryService.ts Implementation
Located at `src/services/MemoryService.ts`

**Features:**
- ✅ SQLite database with `assistant-memory.db` using Expo SQLite
- ✅ Vector storage using JSON serialization (Expo-compatible)
- ✅ Automatic embedding generation and storage
- ✅ Semantic similarity search using cosine similarity
- ✅ Metadata support for memories
- ✅ Transaction safety and error handling
- ✅ Fallback text search capability

**Key Methods:**
- `addMemory(text: string, metadata?: object): Promise<number>`
- `queryMemory(query: string, k: number): Promise<string[]>`
- `getAllMemories(limit, offset): Promise<Memory[]>`
- `deleteMemory(id: number): Promise<boolean>`
- `getMemoryCount(): Promise<number>`

### 5. EmbeddingService.ts Implementation
Located at `src/services/EmbeddingService.ts`

**Features:**
- ✅ OpenAI text-embedding-ada-002 integration
- ✅ Static `embed(text: string): Promise<number[]>` method
- ✅ Batch embedding support with `embedBatch(texts: string[])`
- ✅ Cosine similarity calculation utility
- ✅ Comprehensive error handling and validation
- ✅ Input text length limits and cleaning

## App Features

### Current Implementation
The main App.tsx demonstrates the core functionality:

1. **Memory Addition**
   - Text input for adding new memories
   - Automatic embedding generation
   - Metadata attachment support

2. **Semantic Search**
   - Query input for searching memories
   - Vector similarity-based results
   - Top-k result limiting

3. **Memory Management**
   - Real-time memory count display
   - Search result visualization
   - Loading states and error handling

### Technical Details

**Database Schema:**
```sql
-- Main memories table
CREATE TABLE memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  metadata TEXT,
  timestamp TEXT NOT NULL,
  embedding_id INTEGER
);

-- Embeddings storage
CREATE TABLE memory_embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  memory_id INTEGER NOT NULL,
  embedding BLOB NOT NULL,
  FOREIGN KEY (memory_id) REFERENCES memories (id)
);

-- Embeddings stored as JSON strings for Expo compatibility
CREATE TABLE memory_embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  memory_id INTEGER NOT NULL,
  embedding TEXT NOT NULL,
  FOREIGN KEY (memory_id) REFERENCES memories (id)
);
```

**Vector Search:**
- Manual cosine similarity calculation (Expo-compatible)
- JSON-serialized embeddings for cross-platform compatibility
- Embedding dimensions: 1536 (OpenAI ada-002)
- Additional text-based search fallback available

## Usage Example

```typescript
import { MemoryService } from './src/services';

const memoryService = MemoryService.getInstance();
await memoryService.initialize();

// Add a memory
const id = await memoryService.addMemory(
  "React Native is great for mobile development",
  { category: "technology", importance: "high" }
);

// Search semantically
const results = await memoryService.queryMemory(
  "mobile app development", 
  5
);
```

## File Structure

```
src/
├── services/
│   ├── MemoryService.ts      # Core memory storage & search
│   ├── EmbeddingService.ts   # OpenAI embeddings integration
│   ├── example-usage.ts      # Usage examples and demos
│   └── index.ts              # Service exports
├── api/                      # Pre-existing API clients
│   ├── openai.ts            # OpenAI client
│   ├── anthropic.ts         # Anthropic client
│   └── ...
└── types/
    └── env.d.ts             # Environment variable types
```

## Phase 1 Extension - Retrieval & Reasoning ✅

### 6. RagService.ts Implementation
Located at `src/services/RagService.ts`

**Features:**
- ✅ RAG (Retrieval-Augmented Generation) with streaming support
- ✅ Multi-provider support (OpenAI, Anthropic, Grok) with automatic selection
- ✅ Back-pressure handling for streaming responses
- ✅ Custom system prompt support
- ✅ Context-aware responses using MemoryService

**Key Methods:**
- `answerWithRAG(query: string, contextCount: number): Promise<string>`
- `answerWithCustomPrompt(query, systemPrompt, useContext): Promise<string>`
- `streamResponse(prompt: string): Promise<string>` (with provider-specific streaming)

### 7. AgentExecutor.ts Implementation
Located at `src/agents/AgentExecutor.ts`

**Features:**
- ✅ ReAct pattern implementation (Reason, Act, Observe)
- ✅ Dynamic tool dispatch with `useToolPermissions()` integration
- ✅ Robust JSON parsing with retry mechanisms and error recovery
- ✅ Timeout safeguards and iteration limits
- ✅ Complete execution history tracking

**Key Methods:**
- `run(userQuery: string): Promise<AgentResult>`
- `executeReasoningLoop(systemPrompt, userQuery): Promise<string>`
- `parseAgentResponse(response): Promise<ParseResult>`
- `executeAction(action: AgentAction): Promise<string>`

### 8. Supporting Infrastructure

**useToolPermissions Hook** (`src/hooks/useToolPermissions.ts`):
- ✅ Dynamic tool availability based on platform permissions
- ✅ Calendar, memory, system, and utility tools
- ✅ Permission request handling
- ✅ Tool description generation for AI prompts

**CalendarModule** (`src/modules/CalendarModule.ts`):
- ✅ Full calendar CRUD operations
- ✅ Cross-platform compatibility (graceful web fallback)
- ✅ Event scheduling and management
- ✅ Date validation and error handling

## Current App Features

### Three-Tab Interface:

1. **Memory Tab**: Core memory storage and semantic search
2. **RAG Tab**: Context-aware AI assistant with provider switching
3. **Agent Tab**: Intelligent reasoning with tool usage and step visualization

### Advanced Capabilities:

**RAG Assistant**:
- Semantic context retrieval from stored memories
- Streaming responses with real-time generation
- Provider switching (OpenAI/Anthropic/Grok)
- Custom prompt engineering support

**AI Agent**:
- Multi-step reasoning with tool dispatch
- Memory storage and retrieval
- Calendar integration (mobile platforms)
- System utilities (time, date calculations)
- Execution step visualization
- Retry mechanisms and error recovery

## Example Usage

```typescript
// RAG Service
import { RagService } from './src/services/RagService';

const ragService = RagService.getInstance();
const response = await ragService.answerWithRAG(
  "What do you know about mobile development?"
);

// Agent Executor
import { AgentExecutor } from './src/agents/AgentExecutor';
import { useToolPermissions } from './src/hooks/useToolPermissions';

const { availableTools } = useToolPermissions();
const agent = new AgentExecutor(availableTools);
const result = await agent.run(
  "Remember my preference for TypeScript and tell me its benefits"
);
```

## Architecture Overview

```
OnDeviceAI/
├── Phase 1: Foundation
│   ├── MemoryService (SQLite + Vector Search)
│   ├── EmbeddingService (OpenAI Embeddings)
│   └── Basic UI Components
│
├── Phase 1 Extension: Retrieval & Reasoning
│   ├── RagService (Context-Aware AI)
│   ├── AgentExecutor (ReAct Pattern)
│   ├── Tool System (Dynamic Permissions)
│   └── Advanced UI (Tabbed Interface)
│
└── Integration Layer
    ├── Multi-Provider AI Support
    ├── Cross-Platform Compatibility
    └── Real-time Streaming
```

## Next Steps (Future Phases)

**Phase 2 - Enhanced AI Integration:**
- Multi-modal memory support (images, audio)  
- Advanced query processing and summarization
- Memory relationship graphs and clustering

**Phase 3 - Advanced Agent Capabilities:**
- Tool creation and dynamic registration
- Agent collaboration and delegation
- Long-term memory and learning

**Phase 4 - Production Features:**
- Cloud sync and backup
- Performance optimization
- Advanced analytics and insights

## Testing

### Complete Demo:
```typescript
import { AgentExample } from './src/agents/AgentExample';

const demo = new AgentExample();
await demo.runCompleteDemo();
```

### Individual Components:
```typescript
// Test RAG functionality
const ragService = RagService.getInstance();
const testResult = await ragService.testRAG();

// Test Agent reasoning
const agent = new AgentExecutor(availableTools);
const result = await agent.run("What's the current time?");
```

The OnDeviceAI app is now a complete AI-powered system with memory, reasoning, and tool usage capabilities!