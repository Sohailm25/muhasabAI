/**
 * Enhanced debug logging for MuhasabAI
 * This file provides utilities to log important information in a consistent format
 * and optionally make it available to the client for debugging purposes.
 */

// Set to true to enable detailed debug logs
const DEBUG_ENABLED = true;

// Controls whether to include personalization context and full prompts in response headers
// Useful for debugging but should be disabled in production
const INCLUDE_DEBUG_IN_HEADERS = true;

// Controls whether to show detailed terminal logs with prompt content
const VERBOSE_TERMINAL_LOGGING = true;

// Controls how much of the prompts to show in terminal logs
const PROMPT_TRUNCATE_LENGTH = 1000;

// ANSI color codes for terminal output
const COLORS = {
  RESET: "\x1b[0m",
  BRIGHT: "\x1b[1m",
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  MAGENTA: "\x1b[35m",
  CYAN: "\x1b[36m",
  GRAY: "\x1b[90m",
  BG_BLACK: "\x1b[40m"
};

// Track the last few API calls for debugging
let lastAnthropicRequests: any[] = [];
const MAX_SAVED_REQUESTS = 5;

/**
 * Format a terminal header for visibility
 */
function formatTerminalHeader(text: string): string {
  return `\n${COLORS.BRIGHT}${COLORS.BG_BLACK}${COLORS.CYAN}====== ${text} ======${COLORS.RESET}\n`;
}

/**
 * Log API requests with detailed information
 */
export function logApiRequest(
  type: string, 
  messages: any, 
  personalizationContext?: any
): void {
  if (!DEBUG_ENABLED) return;

  const requestData = {
    timestamp: new Date().toISOString(),
    type,
    personalizationContext,
    messages
  };

  // Store this request for debugging
  lastAnthropicRequests.unshift(requestData);
  // Keep only the most recent requests
  if (lastAnthropicRequests.length > MAX_SAVED_REQUESTS) {
    lastAnthropicRequests.pop();
  }

  // Output to server logs with enhanced formatting for terminal visibility
  console.log(formatTerminalHeader(`API REQUEST (${type})`));
  
  // Log personalization if present
  if (personalizationContext) {
    console.log(`${COLORS.BRIGHT}${COLORS.GREEN}PERSONALIZATION CONTEXT:${COLORS.RESET}`);
    console.log(`🔍 DEBUG-API-REQUEST: Personalization type: ${typeof personalizationContext}`);
    console.log(`🔍 DEBUG-API-REQUEST: Personalization class: ${Object.prototype.toString.call(personalizationContext)}`);
    
    if (typeof personalizationContext === 'string') {
      console.log(`🔍 DEBUG-API-REQUEST: WARNING - Personalization is a string (not an object)`);
      console.log(`🔍 DEBUG-API-REQUEST: String length: ${personalizationContext.length}`);
      console.log(`🔍 DEBUG-API-REQUEST: String preview: ${personalizationContext.substring(0, 100)}...`);
    } else {
      console.log(`🔍 DEBUG-API-REQUEST: Keys: ${Object.keys(personalizationContext).join(', ')}`);
    }
    
    console.log(JSON.stringify(personalizationContext, null, 2));
    
    // Log a flattened version for easier reading in terminal
    console.log(`\n${COLORS.YELLOW}Personalization Summary:${COLORS.RESET}`);
    const flatSummary = Object.entries(personalizationContext)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `  ${key}: ${(value as any[]).join(', ')}`;
        } else {
          return `  ${key}: ${value}`;
        }
      })
      .join('\n');
    console.log(flatSummary);
  } else {
    console.log(`\n${COLORS.YELLOW}🔍 DEBUG-API-REQUEST: NO PERSONALIZATION CONTEXT PROVIDED${COLORS.RESET}`);
  }
  
  // Log messages with length limitation to avoid excessive output
  console.log(`\n${COLORS.BRIGHT}${COLORS.BLUE}MESSAGES BEING SENT:${COLORS.RESET}`);
  
  if (VERBOSE_TERMINAL_LOGGING) {
    // Show full prompt content (truncated if too long) for better visibility in terminal
    if (Array.isArray(messages)) {
      messages.forEach((msg, index) => {
        console.log(`\n${COLORS.MAGENTA}Message #${index+1} (${msg.role}):${COLORS.RESET}`);
        if (typeof msg.content === 'string') {
          // Truncate long content and format
          const content = msg.content.length > PROMPT_TRUNCATE_LENGTH ? 
            `${msg.content.substring(0, PROMPT_TRUNCATE_LENGTH)}... [truncated, total length: ${msg.content.length}]` : 
            msg.content;
          console.log(`${COLORS.GRAY}${content}${COLORS.RESET}`);
        } else {
          console.log(msg.content);
        }
      });
    } else {
      console.log(messages);
    }
  } else {
    // For each message, truncate content if too long
    const truncatedMessages = Array.isArray(messages) ? 
      messages.map(msg => ({
        ...msg,
        content: typeof msg.content === 'string' && msg.content.length > 500 ? 
          `${msg.content.substring(0, 500)}... [truncated, total length: ${msg.content.length}]` : 
          msg.content
      })) : 
      messages;
    
    console.log(JSON.stringify(truncatedMessages, null, 2));
  }
  
  console.log(`\n${COLORS.CYAN}===================================================${COLORS.RESET}\n`);
}

/**
 * Get headers with debug information for API responses
 * Only used if INCLUDE_DEBUG_IN_HEADERS is true
 */
export function getDebugHeaders(): Record<string, string> {
  if (!DEBUG_ENABLED || !INCLUDE_DEBUG_IN_HEADERS) {
    return {};
  }

  // Include latest request data in headers for client debugging
  if (lastAnthropicRequests.length > 0) {
    const latestRequest = lastAnthropicRequests[0];
    
    return {
      'X-Debug-RequestType': latestRequest.type,
      'X-Debug-HasPersonalization': latestRequest.personalizationContext ? 'true' : 'false',
      'X-Debug-Timestamp': latestRequest.timestamp
    };
  }

  return {};
}

/**
 * Clear the stored request history
 */
export function clearRequestHistory(): void {
  lastAnthropicRequests = [];
}

/**
 * Get the most recent API requests for debugging
 */
export function getRecentRequests(): any[] {
  return lastAnthropicRequests;
}

/**
 * Utility to log the full context & prompt for easy copy-pasting into Claude for testing
 */
export function logCopyablePrompt(type: string, messages: any): void {
  if (!DEBUG_ENABLED || !VERBOSE_TERMINAL_LOGGING) return;
  
  console.log(formatTerminalHeader(`COPYABLE PROMPT FOR ${type.toUpperCase()}`));
  
  let promptText = "";
  if (Array.isArray(messages)) {
    // For each message in the conversation
    promptText = messages.map(msg => {
      return `${msg.role.toUpperCase()}:\n${msg.content}\n\n`;
    }).join('');
  } else if (typeof messages === 'string') {
    promptText = messages;
  } else {
    promptText = JSON.stringify(messages, null, 2);
  }
  
  console.log(promptText);
  console.log(`\n${COLORS.CYAN}===================================================${COLORS.RESET}\n`);
} 