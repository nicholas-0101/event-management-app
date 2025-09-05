import axios from "axios";

// Create axios instance with better error handling
export const apiCall = axios.create({
  baseURL: "https://event-management-api-sigma.vercel.app", // http://localhost:4400  ||  https://event-management-api-sigma.vercel.app/
  timeout: 30000, // 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Add retry mechanism
let retryCount = 0;
const maxRetries = 3;

// Utility function to check backend connectivity
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch("https://event-management-api-sigma.vercel.app", { // http://localhost:4400  ||  https://event-management-api-sigma.vercel.app/
      method: "GET",
      mode: "cors",
    });
    return response.ok;
  } catch (error) {
    console.error("Backend health check failed:", error);
    return false;
  }
};

apiCall.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      // Use AxiosHeaders set method
      config.headers?.set?.("Authorization", `Bearer ${token}`);
    }

    console.log("Making request to:", config.url);
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle error
apiCall.interceptors.response.use(
  (response) => {
    console.log("Response received:", response.status, response.config.url);
    // Reset retry count on successful response
    retryCount = 0;
    return response;
  },
  (error) => {
    const isSigninRequest = error.config?.url?.includes("/auth/signin");

    // Don't log detailed errors for signin requests to avoid console spam
    if (!isSigninRequest) {
      console.error("API Error:", error);

      // Simple error logging
      const errorDetails = {
        message: error.message || "Unknown error",
        status: error.response?.status || "No status",
        url: error.config?.url || "No URL",
        code: error.code || "No code",
      };

      // Only log if we have meaningful error details
      if (
        errorDetails.message !== "Unknown error" ||
        errorDetails.status !== "No status"
      ) {
        console.error("Error details:", errorDetails);
      }
    }

    // Handle network errors with retry mechanism
    if (
      (error.code === "ECONNABORTED" ||
        error.message === "Network Error" ||
        error.code === "ECONNRESET" ||
        error.message === "Failed to fetch") &&
      retryCount < maxRetries
    ) {
      retryCount++;
      console.error(
        `Network error detected - retry attempt ${retryCount}/${maxRetries}`
      );

      // Check backend health before retrying
      checkBackendHealth().then((isHealthy) => {
        if (isHealthy) {
          console.log("Backend is healthy, retrying request...");
        } else {
          console.error("Backend is not healthy, skipping retry");
          retryCount = maxRetries; // Stop retrying
        }
      });

      // Retry the request after a delay
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log("Retrying request...");
          resolve(apiCall.request(error.config));
        }, 1000 * retryCount); // Exponential backoff
      });
    }

    // Reset retry count for non-network errors
    retryCount = 0;

    // Handle 401 Unauthorized - but not during signin process
    if (error.response?.status === 401) {
      const isSigninRequest = error.config?.url?.includes("/auth/signin");

      if (!isSigninRequest) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/signin";
      }
      // For signin requests, let the component handle the error
      // Don't suppress console log for debugging
    }

    return Promise.reject(error);
  }
);
