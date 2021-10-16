// make a post request using fetch
const API_URL = "http://localhost:8888";

export const createSandbox = (data) => {
  return fetch(`${API_URL}/create-sandbox`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const stopSandbox = (data) => {
  return fetch(`${API_URL}/stop-sandbox`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const getFileContent = (data) => {
  return fetch(`${API_URL}/get-file-content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};
