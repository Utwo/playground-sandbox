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
export const addFiles = (data) => {
  return fetch(`${API_URL}/add-files`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const deleteFiles = (data) => {
  return fetch(`${API_URL}/delete-files`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};
