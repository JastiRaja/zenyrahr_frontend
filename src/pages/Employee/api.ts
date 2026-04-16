import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const headers = (config.headers || {}) as Record<string, string>;
    const isFormData = typeof FormData !== "undefined" && config.data instanceof FormData;
    if (isFormData) {
      // Let the browser set multipart/form-data with boundary.
      delete headers["Content-Type"];
    } else if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    config.headers = headers;

    // Try to get token from different possible locations
    const authStateRaw = localStorage.getItem("authState");
    const authStateToken = authStateRaw ? JSON.parse(authStateRaw)?.token : null;
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      authStateToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem("refreshToken") || 
                          localStorage.getItem("refresh_token");
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
            refreshToken
          });
          
          const refreshedToken = response.data?.accessToken || response.data?.token;
          if (!refreshedToken) {
            throw new Error("No access token in refresh response");
          }
          localStorage.setItem("accessToken", refreshedToken);
          localStorage.setItem("token", refreshedToken);
          
          // Retry the original request
          error.config.headers.Authorization = `Bearer ${refreshedToken}`;
          return axios(error.config);
        } catch (refreshError) {
          // If refresh fails, clear everything and redirect to login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, clear everything and redirect to login
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
