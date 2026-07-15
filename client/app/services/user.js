import api from "../lib/api";

export const getUsers = async () => {
  const response =
    await api.get("/api/auth/users");

  return response.data;
};
