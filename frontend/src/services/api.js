import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

export default API;

export const getProfile = (googleId) =>
  API.get(`/api/profile/${googleId}`);

export const updateProfile = (googleId, data) =>
  API.put(`/api/profile/${googleId}`, data);