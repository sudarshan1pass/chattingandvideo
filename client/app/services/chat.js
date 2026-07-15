import api from "@/lib/api";

export const sendMessage = async (data) => {
  const response = await api.post(
    "/api/chat/send",
    data
  );

  return response.data;
};

export const getChatHistory = async (
  userId
) => {
  const response = await api.get(
    `/api/chat/history/${userId}`
  );

  return response.data;
};