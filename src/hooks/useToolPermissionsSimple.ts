import { useState, useEffect } from 'react';

/**
 * Tool definition interface
 */
export interface Tool {
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: string;
      description: string;
      required?: boolean;
    };
  };
  category: 'memory' | 'calendar' | 'system' | 'utility';
  requiresPermission?: boolean;
  permission?: string;
}

/**
 * Available tools for the agent system (simplified version without calendar)
 */
const AVAILABLE_TOOLS: Tool[] = [
  {
    name: 'addMemory',
    description: 'Store important information in long-term memory for later retrieval',
    parameters: {
      content: {
        type: 'string',
        description: 'The information to store in memory',
        required: true
      },
      metadata: {
        type: 'object',
        description: 'Optional metadata to associate with the memory (tags, category, etc.)'
      }
    },
    category: 'memory'
  },
  {
    name: 'searchMemory',
    description: 'Search through stored memories using semantic similarity',
    parameters: {
      query: {
        type: 'string',
        description: 'The search query to find relevant memories',
        required: true
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 5)'
      }
    },
    category: 'memory'
  },
  {
    name: 'getCurrentTime',
    description: 'Get the current date and time',
    parameters: {},
    category: 'system'
  },
  {
    name: 'calculateDaysBetween',
    description: 'Calculate the number of days between two dates',
    parameters: {
      startDate: {
        type: 'string',
        description: 'Start date in ISO format (YYYY-MM-DD)',
        required: true
      },
      endDate: {
        type: 'string',
        description: 'End date in ISO format (YYYY-MM-DD)',
        required: true
      }
    },
    category: 'utility'
  }
];

/**
 * Simplified hook to manage tool permissions and availability
 */
export const useToolPermissionsSimple = () => {
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize with all basic tools (no permission-based filtering for now)
    setAvailableTools(AVAILABLE_TOOLS);
    setIsLoading(false);
  }, []);

  /**
   * Get tools by category
   */
  const getToolsByCategory = (category: Tool['category']): Tool[] => {
    return availableTools.filter(tool => tool.category === category);
  };

  /**
   * Get tool by name
   */
  const getToolByName = (name: string): Tool | undefined => {
    return availableTools.find(tool => tool.name === name);
  };

  /**
   * Check if a specific tool is available
   */
  const isToolAvailable = (toolName: string): boolean => {
    return availableTools.some(tool => tool.name === toolName);
  };

  /**
   * Get formatted tool descriptions for AI prompt
   */
  const getToolDescriptionsForPrompt = (): string => {
    return availableTools.map(tool => {
      const params = Object.entries(tool.parameters)
        .map(([key, param]) => {
          const required = param.required ? ' (required)' : ' (optional)';
          return `  - ${key} (${param.type}): ${param.description}${required}`;
        })
        .join('\n');
      
      return `${tool.name}: ${tool.description}\nParameters:\n${params || '  None'}`;
    }).join('\n\n');
  };

  return {
    availableTools,
    isLoading,
    getToolsByCategory,
    getToolByName,
    isToolAvailable,
    getToolDescriptionsForPrompt
  };
};