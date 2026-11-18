import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Dashboard APIs
export const getDashboardSummary = () => api.get("/analytics/summary");

export const getAnimalDistribution = () =>
  api.get("/analytics/animal-distribution");

export const getTopBreeds = () => api.get("/analytics/top-breeds");

export const getPredictionTrends = () =>
  api.get("/analytics/prediction-trends");

export const getRecentPredictions = () =>
  api.get("/analytics/recent-predictions");

// Breed APIs
export const getBreeds = () => api.get("/breeds/");

export const getBreedDetails = (breedId) => api.get(`/breeds/${breedId}`);

// Prediction API
export const predictBreed = (formData) =>
  api.post("/predict/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export default api;
