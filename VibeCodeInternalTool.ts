/**
 * Network Tracker
 * Centralized system for tracking and logging network requests
 */
// Non-configurable constants
const WEBHOOK_URL = "https://api.vibecodeapp.com/api/webhooks/track";
let PROJECT_ID = "";

// Store original fetch implementation
// @ts-ignore
const originalFetch = global.fetch as any;

// Function to send logs to webhook
const sendToWebhook = async (data: any) => {
  try {
    await originalFetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, projectId: PROJECT_ID }),
    });
  } catch (error) {
    // Silent error handling
  }
};

// Function to log requests
const logRequest = async (method: string, url: string, headers: any, body: any, response: Response) => {
  let responseBody: any = null;

  try {
    // Clone the response to read its body (can only be read once)
    const clonedResponse = response.clone();
    const contentType = clonedResponse.headers.get("content-type") || "";

    // Process response for webhook
    if (contentType.indexOf("application/json") >= 0 || contentType.indexOf("text/") >= 0) {
      responseBody = await clonedResponse.text();

      // Try to parse as JSON if it looks like JSON
      if (contentType.indexOf("application/json") >= 0) {
        try {
          responseBody = JSON.parse(responseBody);
        } catch (e) {
          // If parsing fails, keep it as text
        }
      }
    } else {
      // Binary data case
      responseBody = `[Binary data: ${contentType}]`;
    }
  } catch (e) {
    responseBody = "[Error reading response body]";
  }

  // Format request body if it exists
  let requestBody = body;
  if (requestBody && typeof requestBody !== "string") {
    try {
      requestBody = JSON.stringify(requestBody);
    } catch (e) {
      requestBody = "[Complex body]";
    }
  }

  // Create log entry
  const logEntry = {
    type: "network_request",
    timestamp: new Date().toISOString(),
    projectId: PROJECT_ID,
    method,
    url,
    headers,
    requestBody,
    status: response.status,
    responseHeaders: Array.from(response.headers).reduce(
      (obj: Record<string, string>, [key, value]: [string, string]) => {
        obj[key] = value;
        return obj;
      },
      {} as Record<string, string>
    ),
    responseBody,
  };

  // Send to webhook
  await sendToWebhook(logEntry);

  return logEntry;
};

// Add a flag to track initialization status
let isInitialized = false;

// Initialize network tracking
export async function init(projectId: string) {
  // Return early if already initialized
  if (isInitialized) {
    return;
  }

  console.log("Initializing network tracking");

  // Set initialized flag
  isInitialized = true;
  PROJECT_ID = projectId;
  let isInGoodStanding = false;

  // If no project id is provided, throw an error
  if (!projectId) {
    console.log("Project ID is not founder during initialization");
    throw new Error("Project ID is required");
  }

  // Check if project is in good standing
  try {
    const response = await originalFetch(
      `https://api.vibecodeapp.com/api/users/projects/${PROJECT_ID}/inGoodStandings`
    );
    const data = await response.json();
    isInGoodStanding = data.success === true;

    // Only set up network tracking if in good standing
    if (isInGoodStanding) {
      console.log("In good standing, setting up network tracking");
      setupNetworkTracking();
    } else {
      console.log("Not in good standing, blocking network requests");
      blockNetworkRequests();
    }
  } catch (error) {
    console.log(error);
    throw new Error("Project is not in good standing");
    // Silent fail - do not set up tracking if error occurs
  }

  // Function to block network requests
  function blockNetworkRequests() {
    // Block fetch requests
    // @ts-ignore
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

      // Allow requests to our webhook for logging
      if (url === WEBHOOK_URL) return originalFetch(input, init);

      // Log the blocked request
      const blockedLog = {
        type: "blocked_request",
        timestamp: new Date().toISOString(),
        projectId: PROJECT_ID,
        method: init?.method || "GET",
        url: url,
      };

      sendToWebhook(blockedLog).catch(() => {
        // Silent error handling
      });

      // Return a mock failed response
      return Promise.reject(new Error("Blocked due to account status"));
    };

    // Block XMLHttpRequest
    XMLHttpRequest.prototype.open = function () {
      // Just override with empty function that does nothing
      return;
    };

    XMLHttpRequest.prototype.send = function () {
      // @ts-ignore
      const url = this._networkTracker_url || "unknown";

      // Allow requests to our webhook
      if (url === WEBHOOK_URL) return;

      // Log blocked XHR
      const blockedXhrLog = {
        type: "blocked_xhr",
        timestamp: new Date().toISOString(),
        projectId: PROJECT_ID,
      };

      sendToWebhook(blockedXhrLog).catch(() => {
        // Silent error handling
      });

      // Simulate an error event
      const errorEvent = new ErrorEvent("error", {
        message: "Blocked due to project status",
      });

      // Dispatch error event if onerror handler exists
      if (typeof this.onerror === "function") {
        this.onerror(errorEvent as any);
      }

      return;
    };
  }

  // Function to set up network tracking
  function setupNetworkTracking() {
    // Override the global fetch
    // @ts-ignore
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

      // Skip intercepting calls to our webhook to prevent infinite loops
      if (url === WEBHOOK_URL) return originalFetch(input, init);

      const method = init?.method || "GET";
      const headers = init?.headers || {};
      const body = init?.body;

      try {
        const response = await originalFetch(input, init);

        logRequest(method, url, headers, body, response).catch(() => {
          // Silent error handling
        });

        return response;
      } catch (error) {
        const errorLog = {
          type: "network_error",
          timestamp: new Date().toISOString(),
          projectId: PROJECT_ID,
          method,
          url,
          headers,
          body,
          error: error instanceof Error ? error.message : String(error),
        };

        sendToWebhook(errorLog).catch(() => {
          // Silent error handling
        });

        throw error;
      }
    };

    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method: string, url: string) {
      // @ts-ignore
      this._networkTracker_method = method;
      // @ts-ignore
      this._networkTracker_url = url;
      originalXHROpen.apply(this, arguments as any);
    };

    XMLHttpRequest.prototype.send = function (body: any) {
      // @ts-ignore
      const method = this._networkTracker_method || "GET";
      // @ts-ignore
      const url = this._networkTracker_url || "unknown";

      if (url === WEBHOOK_URL) return originalXHRSend.apply(this, arguments as any);

      // Create a log for the XHR request
      const xhrLog = {
        type: "xhr_request",
        timestamp: new Date().toISOString(),
        projectId: PROJECT_ID,
        method,
        url,
        body,
      };

      sendToWebhook(xhrLog).catch(() => {
        // Silent error handling
      });

      originalXHRSend.apply(this, arguments as any);
    };
  }
}

export default { init };
