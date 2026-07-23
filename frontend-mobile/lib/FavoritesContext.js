import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "./api";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.listFavorites();
      setFavorites(data || []);
    } catch {
      // si falla, dejamos los favoritos como estaban en vez de tronar la app
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFavorite = (productId) => favorites.some((f) => f.product_id === productId);

  const toggleFavorite = async (productId) => {
    if (isFavorite(productId)) {
      await api.removeFavorite(productId);
      setFavorites((prev) => prev.filter((f) => f.product_id !== productId));
    } else {
      const created = await api.addFavorite(productId);
      setFavorites((prev) => [created, ...prev]);
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, loading, isFavorite, toggleFavorite, refresh }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites debe usarse dentro de FavoritesProvider");
  return ctx;
}
