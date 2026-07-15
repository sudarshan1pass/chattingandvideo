// import api from "@/lib/api";
import api from "../lib/api"

export const signupUser = async (data) => {
  const response = await api.post(
    "/api/auth/signup",
    data
  );

  return response.data;
};

export const loginUser = async (data) => {
  const response = await api.post(
    "/api/auth/login",
    data
  );

  if (response.data.token) {
    localStorage.setItem(
      "token",
      response.data.token
    );
  }

  return response.data;
};