import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, type, radius } from "../lib/theme";
import { imageUrl } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useFavorites } from "../lib/FavoritesContext";

const LOW_STOCK_THRESHOLD = 20;

export default function ProductCard({ product }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const lowStock = product.stock < LOW_STOCK_THRESHOLD && product.stock > 0;
  const outOfStock = product.stock <= 0;
  const favorited = isFavorite(product.id);

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/product/${product.id}`)}>
      <View style={styles.imageWrap}>
        {product.imagen_url ? (
          <Image source={{ uri: imageUrl(product.imagen_url) }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={{ color: colors.outline }}>Sin imagen</Text>
          </View>
        )}
        {user && (
          <Pressable
            onPress={() => toggleFavorite(product.id).catch(() => {})}
            hitSlop={8}
            style={styles.favoriteButton}
          >
            <MaterialIcons name={favorited ? "favorite" : "favorite-border"} size={18} color={colors.primary} />
          </Pressable>
        )}
        {outOfStock && (
          <View style={[styles.badge, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Text style={[type.labelCaps, { color: colors.onSurfaceVariant, fontSize: 10 }]}>AGOTADO</Text>
          </View>
        )}
        {!outOfStock && lowStock && (
          <View style={[styles.badge, { backgroundColor: colors.errorContainer }]}>
            <Text style={[type.labelCaps, { color: colors.onErrorContainer, fontSize: 10 }]}>STOCK BAJO</Text>
          </View>
        )}
      </View>
      <Text style={[type.headlineSm, { color: colors.onSurface, marginTop: 8 }]} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={[type.labelCaps, { color: colors.outline, marginTop: 4, marginBottom: 8 }]}>
        {(product.tipo_mezcal || "").toUpperCase()}
      </Text>
      <Text style={[type.headlineSm, { color: colors.primary }]}>
        ${Number(product.price / 100).toLocaleString("es-MX")} MXN
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, flexDirection: "column" },
  imageWrap: {
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: "rgba(19, 19, 19, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
});
