// Simple test to verify MemoryService works with Expo SQLite
import { MemoryService } from './src/services/MemoryService.js';

async function testMemoryService() {
  try {
    console.log('🧪 Testing MemoryService with Expo SQLite...');
    
    const memoryService = MemoryService.getInstance();
    await memoryService.initialize();
    
    console.log('✅ MemoryService initialized successfully');
    
    const count = await memoryService.getMemoryCount();
    console.log(`📊 Current memory count: ${count}`);
    
    console.log('✨ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testMemoryService();