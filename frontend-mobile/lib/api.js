import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = "oro_token";

// expo-secure-store es un modulo nativo (Keychain/Keystore) y no existe en
// web. En web usamos localStorage solo como respaldo para poder probar en
// el navegador durante desarrollo; en el celular real (Expo Go / build)
// siempre se usa SecureStore, que es el requisito real del Sprint 3.
const isWeb = Platform.OS === "web";

export async function getToken() {
  if (isWeb) return typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token) {
  if (isWeb) {
    if (typeof localStorage !== "undefined") localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken() {
  if (isWeb) {
    if (typeof localStorage !== "undefined") localStorage.removeItem(TOKEN_KEY);
    return;
  }
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

/**
 * Decodifica el payload de un JWT sin verificar la firma
 * (solo para leer datos en el cliente; la verificacion real la hace el backend).
 */
export function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export function isTokenExpired(payload) {
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

let onSessionExpired = null;
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  // ngrok-skip-browser-warning evita la pagina de advertencia HTML que ngrok
  // gratis muestra en vez de la respuesta real cuando cree que la peticion
  // viene de un navegador.
  const headers = { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" };

  if (auth) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  const sessionInvalid = res.status === 401 || (res.status === 403 && data?.detail === "Not authenticated");
  if (sessionInvalid && auth) {
    await clearToken();
    if (onSessionExpired) onSessionExpired();
  }

  if (!res.ok) {
    const message = data?.detail || `Error de conexión con el servidor (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data;
}

export const api = {
  // ---- Auth ----
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  register: (data) => request("/users/", { method: "POST", body: data, auth: false }),
  logout: () => request("/auth/logout", { method: "POST" }).catch(() => null),
  getMe: () => request("/users/me"),
  updateMe: (data) => request("/users/me", { method: "PUT", body: data }),

  // ---- Productos ----
  listProducts: () => request("/products/", { auth: false }),
  searchProductsAI: (q) => request(`/products/search?q=${encodeURIComponent(q)}`, { auth: false }),
  getProduct: (id) => request(`/products/${id}`, { auth: false }),

  // ---- Reseñas ----
  listReviews: (productId) => request(`/reviews/${productId}`, { auth: false }),
  createReview: (data) => request("/reviews/", { method: "POST", body: data }),
  updateReview: (id, data) => request(`/reviews/${id}`, { method: "PUT", body: data }),
  deleteReview: (id) => request(`/reviews/${id}`, { method: "DELETE" }),

  // ---- Carrito ----
  getCart: () => request("/cart/"),
  addToCart: (productId, quantity = 1) => request("/cart/", { method: "POST", body: { product_id: productId, quantity } }),
  updateCartItem: (itemId, quantity) => request(`/cart/${itemId}`, { method: "PUT", body: { quantity } }),
  removeFromCart: (itemId) => request(`/cart/${itemId}`, { method: "DELETE" }),

  // ---- Pedidos ----
  checkout: (paymentMethod = "efectivo") =>
    request(`/orders/checkout?payment_method=${encodeURIComponent(paymentMethod)}`, { method: "POST" }),
  checkoutNow: (productId, quantity = 1, paymentMethod = "efectivo") =>
    request(`/orders/checkout-now?payment_method=${encodeURIComponent(paymentMethod)}`, {
      method: "POST",
      body: { product_id: productId, quantity },
    }),
  listMyOrders: () => request("/orders/"),
  cancelMyOrder: (id) => request(`/orders/${id}/cancel`, { method: "PUT" }),

  // ---- Favoritos ----
  listFavorites: () => request("/favorites/"),
  addFavorite: (productId) => request("/favorites/", { method: "POST", body: { product_id: productId } }),
  removeFavorite: (productId) => request(`/favorites/${productId}`, { method: "DELETE" }),
};

export function imageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}

export { API_URL };
