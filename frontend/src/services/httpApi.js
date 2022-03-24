// make a post request using fetch

import { apiURL } from "../config";

export const createSandbox = (data) => {
  return fetch(`${apiURL}/create-sandbox`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const stopSandbox = (data) => {
  return fetch(`${apiURL}/stop-sandbox`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const getFileContent = (data) => {
  return fetch(`${apiURL}/get-file-content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};
