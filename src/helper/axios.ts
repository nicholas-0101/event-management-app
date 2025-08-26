import axios from "axios";

export const apiCall = axios.create({
  baseURL: "http://localhost:4400",
});

apiCall.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    // Use AxiosHeaders set method
    config.headers?.set?.("Authorization", `Bearer ${token}`);
  }

  return config;
});