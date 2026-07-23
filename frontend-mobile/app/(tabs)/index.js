import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { colors, type, spacing, radius } from "../../lib/theme";
import { useCart } from "../../lib/CartContext";
import ProductCard from "../../components/ProductCard";
import ProductCardSkeleton from "../../components/ProductCardSkeleton";

const TIPOS = ["Todos", "Espadín", "Tobalá", "Madrecuixe", "Arroqueño", "Tepextate", "Cuishe", "Ensamble"];

const SORT_OPTIONS = [
  { key: "default", label: "Relevancia" },
  { key: "price_asc", label: "Precio: menor a mayor" },
  { key: "price_desc", label: "Precio: mayor a menor" },
  { key: "rating", label: "Mejor valorado" },
  { key: "newest", label: "Más nuevo" },
];

export default function CatalogoScreen() {
  const router = useRouter();
  const { itemCount } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTipo, setActiveTipo] = useState("Todos");
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const cartScale = useRef(new Animated.Value(1)).current;
  const prevItemCount = useRef(itemCount);

  useEffect(() => {
    if (itemCount > prevItemCount.current) {
      Animated.sequence([
        Animated.spring(cartScale, { toValue: 1.35, friction: 3, useNativeDriver: true }),
        Animated.spring(cartScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();
    }
    prevItemCount.current = itemCount;
  }, [itemCount, cartScale]);

  const loadProducts = useCallback(() => {
    return api
      .listProducts()
      .then((data) => setProducts(data || []))
      .catch((err) => setError(err.message || "No se pudo cargar el catálogo."));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadProducts().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [loadProducts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    await loadProducts();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    let list = aiResults !== null ? aiResults : products;
    if (aiResults === null && activeTipo !== "Todos") {
      list = list.filter((p) => p.tipo_mezcal === activeTipo);
    }
    const term = search.trim().toLowerCase();
    if (aiResults === null && term) {
      list = list.filter(
        (p) => p.name?.toLowerCase().includes(term) || p.tipo_mezcal?.toLowerCase().includes(term)
      );
    }
    list = [...list];
    if (sortBy === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (sortBy === "rating") list.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    else if (sortBy === "newest") list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list;
  }, [products, activeTipo, search, aiResults, sortBy]);

  const handleAiSearch = async () => {
    const term = search.trim();
    if (!term) return;
    setAiLoading(true);
    setAiError("");
    try {
      const data = await api.searchProductsAI(term);
      setAiResults(data || []);
    } catch (err) {
      setAiError(err.message || "No se pudo completar la búsqueda inteligente.");
    } finally {
      setAiLoading(false);
    }
  };

  const clearAiSearch = () => {
    setSearch("");
    setAiResults(null);
    setAiError("");
  };

  const hasActiveFilters = activeTipo !== "Todos" || sortBy !== "default" || search.trim() !== "" || aiResults !== null;

  const handleClearFilters = () => {
    setActiveTipo("Todos");
    setSortBy("default");
    setSearch("");
    setAiResults(null);
    setAiError("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={[type.displayLgMobile, { color: colors.primary }]}>Oro de Oaxaca</Text>
        <Pressable onPress={() => router.push("/cart")} style={styles.cartButton}>
          <Animated.View style={{ transform: [{ scale: cartScale }] }}>
            <MaterialIcons name="shopping-cart" size={24} color={colors.primary} />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount > 9 ? "9+" : itemCount}</Text>
              </View>
            )}
          </Animated.View>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.searchWrap}>
          {aiLoading ? (
            <ActivityIndicator color={colors.primary} size="small" style={styles.searchIcon} />
          ) : (
            <MaterialIcons name="auto-awesome" size={20} color={colors.primary} style={styles.searchIcon} />
          )}
          <TextInput
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              if (aiResults !== null) setAiResults(null);
            }}
            onSubmitEditing={handleAiSearch}
            returnKeyType="search"
            placeholder="Buscar con IA…"
            placeholderTextColor={colors.onSurfaceVariant}
            style={[type.bodyMd, styles.searchInput]}
          />
          {aiResults !== null && (
            <Pressable onPress={clearAiSearch} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
          )}
        </View>
        {aiError ? <Text style={[type.bodyMd, { color: colors.error, fontSize: 12, marginTop: 6 }]}>{aiError}</Text> : null}
        {aiResults !== null && !aiError && (
          <Text style={[type.labelCaps, { color: colors.primaryContainer, marginTop: 6 }]}>
            {aiResults.length} resultado{aiResults.length === 1 ? "" : "s"} con IA
          </Text>
        )}

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 12 }}>
            {TIPOS.map((tipo) => {
              const active = tipo === activeTipo;
              return (
                <Pressable
                  key={tipo}
                  onPress={() => setActiveTipo(tipo)}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                >
                  <Text style={[type.labelCaps, { color: active ? colors.onPrimaryContainer : colors.onSurfaceVariant }]}>
                    {tipo}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {hasActiveFilters && (
            <Pressable onPress={handleClearFilters} style={styles.clearButton} hitSlop={6}>
              <MaterialIcons name="filter-alt-off" size={18} color={colors.error} />
            </Pressable>
          )}
          <Pressable onPress={() => setSortMenuOpen(true)} style={styles.sortButton} hitSlop={6}>
            <MaterialIcons name="sort" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <Modal visible={sortMenuOpen} transparent animationType="fade" onRequestClose={() => setSortMenuOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSortMenuOpen(false)}>
            <View style={styles.sortMenu}>
              <Text style={[type.labelCaps, { color: colors.primaryContainer, marginBottom: spacing.gutter * 0.8 }]}>
                Ordenar por
              </Text>
              {SORT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    setSortBy(opt.key);
                    setSortMenuOpen(false);
                  }}
                  style={styles.sortOption}
                >
                  <Text
                    style={[
                      type.bodyMd,
                      { color: opt.key === sortBy ? colors.primary : colors.onSurface, fontFamily: opt.key === sortBy ? "Manrope_700Bold" : "Manrope_400Regular" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {opt.key === sortBy && <MaterialIcons name="check" size={18} color={colors.primary} />}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>

        {loading ? (
          <View style={{ gap: spacing.gutter }}>
            <View style={{ flexDirection: "row", gap: spacing.gutter }}>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.gutter }}>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </View>
          </View>
        ) : error ? (
          <Text style={[type.bodyMd, { color: colors.error, marginTop: 24 }]}>{error}</Text>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="inventory" size={48} color={colors.outlineVariant} />
            <Text style={[type.headlineSm, { color: colors.onSurfaceVariant, marginTop: 16, textAlign: "center" }]}>
              No hay productos disponibles
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={{ gap: spacing.gutter }}
            contentContainerStyle={{ gap: spacing.gutter, paddingBottom: 40 }}
            renderItem={({ item }) => <ProductCard product={item} />}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.marginMobile,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77, 70, 53, 0.2)",
  },
  cartButton: { padding: 4 },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: { color: "#690005", fontSize: 10, fontFamily: "Manrope_700Bold" },
  content: { flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.gutter },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerHigh,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(153, 144, 124, 0.5)",
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: colors.onSurface, paddingVertical: 14 },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: spacing.gutter,
    marginBottom: spacing.gutter,
  },
  chip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1 },
  chipActive: { backgroundColor: colors.primary, borderColor: "rgba(242, 202, 80, 0.2)" },
  chipInactive: { backgroundColor: colors.surfaceContainerHigh, borderColor: "rgba(77, 70, 53, 0.2)" },
  sortButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 180, 171, 0.4)",
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 60 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sortMenu: {
    backgroundColor: colors.surfaceContainer,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.3)",
    padding: spacing.marginMobile,
    paddingBottom: spacing.gutter * 1.6,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77, 70, 53, 0.15)",
  },
});
