import { URL } from "./constants";

const checkResponse = (res) => {
  if (res.ok) {
    return res.json();
  }
  return res.json().then((err) => Promise.reject(err));
};

const headersWithContentType = { "Content-Type": "application/json" };

const authHeaders = () => ({
  "Content-Type": "application/json",
  authorization: `Token ${localStorage.getItem("auth_token")}`,
});

export const registerUser = (username, password) => {
  return fetch(`${URL}/api/users/`, {
    method: "POST",
    headers: headersWithContentType,
    body: JSON.stringify({ username, password }),
  }).then(checkResponse);
};

export const loginUser = (username, password) => {
  return fetch(`${URL}/api/token/login/`, {
    method: "POST",
    headers: headersWithContentType,
    body: JSON.stringify({ username, password }),
  })
    .then(checkResponse)
    .then((data) => {
      if (data.auth_token) {
        localStorage.setItem("auth_token", data.auth_token);
        return data;
      }
      return null;
    });
};

export const logoutUser = () => {
  return fetch(`${URL}/api/token/logout/`, {
    method: "POST",
    headers: authHeaders(),
  }).then((res) => {
    if (res.status === 204) {
      localStorage.removeItem("auth_token");
      return res;
    }
    return null;
  });
};

export const getUser = () => {
  return fetch(`${URL}/api/users/me/`, {
    method: "GET",
    headers: authHeaders(),
  }).then(checkResponse);
};

export const getCards = (page = 1) => {
  return fetch(`${URL}/api/cats/?page=${page}`, {
    method: "GET",
    headers: authHeaders(),
  }).then(checkResponse);
};

export const getFosterCards = (page = 1) => {
  return fetch(`${URL}/api/cats/foster/?active_contract=true&page=${page}`, {
    method: "GET",
    headers: authHeaders(),
  }).then(checkResponse);
};

export const getCard = (id) => {
  return fetch(`${URL}/api/cats/${id}/`, {
    method: "GET",
    headers: authHeaders(),
  }).then(checkResponse);
};

export const getAchievements = () => {
  return fetch(`${URL}/api/achievements/`, {
    method: "GET",
    headers: authHeaders(),
  }).then(checkResponse);
};

export const sendCard = (card) => {
  return fetch(`${URL}/api/cats/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(card),
  }).then(checkResponse);
};

export const updateCard = (card, id) => {
  return fetch(`${URL}/api/cats/${id}/`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(card),
  }).then(checkResponse);
};

export const deleteCard = (id) => {
  return fetch(`${URL}/api/cats/${id}/`, {
    method: "DELETE",
    headers: authHeaders(),
  }).then((res) => {
    if (res.status === 204) {
      return { status: true };
    }
    return { status: false };
  });
};

export const createOwnershipStatus = (payload) => {
  return fetch(`${URL}/api/ownership-statuses/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  }).then(checkResponse);
};

export const updateOwnershipStatus = (id, payload) => {
  return fetch(`${URL}/api/ownership-statuses/${id}/`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  }).then(checkResponse);
};

export const createFosterContract = (payload) => {
  return fetch(`${URL}/api/foster-contracts/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  }).then(checkResponse);
};

export const updateFosterContract = (id, payload) => {
  return fetch(`${URL}/api/foster-contracts/${id}/`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  }).then(checkResponse);
};

export const closeFosterContract = (id) => {
  return fetch(`${URL}/api/foster-contracts/${id}/close/`, {
    method: "POST",
    headers: authHeaders(),
  }).then(checkResponse);
};
