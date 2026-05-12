import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
});

export default API;

export const getProfile = (googleId) =>
  axios.get(`/api/profile/${googleId}`);

export const updateProfile = (googleId, data) =>
  axios.put(`/api/profile/${googleId}`, data);