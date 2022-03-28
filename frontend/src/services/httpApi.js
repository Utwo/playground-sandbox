import { apiURL } from "../config";

export const getFileContent = (data) => {
  return fetch(`${apiURL}/get-file-content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};
