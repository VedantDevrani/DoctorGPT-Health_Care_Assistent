// services/api.js

import axios from "axios";

export const analyzeSymptoms = async (data) => {
  const response = await axios.post("/api/analyze", data);
  return response.data;
};