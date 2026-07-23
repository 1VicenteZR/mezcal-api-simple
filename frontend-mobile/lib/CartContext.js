import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "./api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getCart();
      setItems(data || []);
    } catch {
      // si falla, dejamos el carrito como estaba en vez de tronar la app
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async (productId, quantity = 1) => {
    await api.addToCart(productId, quantity);
    await refresh();
  };

  const updateQuantity = async (itemId, quantity) => {
    const updated = await api.updateCartItem(itemId, quantity);
    setItems((prev) => prev.map((it) => (it.id === itemId ? updated : it)));
  };

  const removeItem = async (itemId) => {
    await api.removeFromCart(itemId);
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const checkout = async (paymentMethod = "efectivo") => {
    const order = await api.checkout(paymentMethod);
    setItems([]);
    return order;
  };

  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
  const total = items.reduce((sum, it) => sum + it.product_price * it.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, itemCount, total, refresh, addItem, updateQuantity, removeItem, checkout }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
