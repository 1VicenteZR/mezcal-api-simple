import { View, Text, Image, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { imageUrl } from "../../lib/api";
import { colors, type, spacing, radius } from "../../lib/theme";
import { useAuth } from "../../lib/AuthContext";
import { useFavorites } from "../../lib/FavoritesContext";

function formatMXN(cents) {
  return Number(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 });
}

function FavoriteCard({ item, onRemove }) {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <Pressable onPress={() => onRemove(item.product_id)} hitSlop={8} style={styles.favoriteButton}>
        <MaterialIcons name="favorite" size={20} color={colors.primary} />
      </Pressable>
      <Pressable onPress={() => router.push(`/product/${item.product_id}`)}>
        <View style={styles.imageWrap}>
          {item.imagen_url ? (
            <Image source={{ uri: imageUrl(item.imagen_url) }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <MaterialIcons name="liquor" size={32} color={colors.outline} />
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Text style={[type.headlineSm, { color: colors.onSurface, flex: 1, marginRight: 12 }]}>{item.product_name}</Text>
          <Text style={[type.labelCaps, { color: colors.primary }]}>${formatMXN(item.product_price)} MXN</Text>
        </View>

        {item.description ? (
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 8 }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={[type.labelCaps, { color: colors.onSurfaceVariant, opacity: 0.7 }]}>
            {item.abv != null ? `${item.abv}% ALC. VOL.` : ""}
          </Text>
          <View style={styles.viewButton}>
            <Text style={[type.labelCaps, { color: colors.onPrimary }]}>Ver Detalle</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export default function GuardadosScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading, toggleFavorite } = useFavorites();

  const handleRemove = (productId) => {
    toggleFavorite(productId).catch(() => {});
  };

  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={[type.displayLgMobile, { color: colors.primary, fontSize: 22 }]}>Guardados</Text>
        </View>
        <View style={styles.emptyState}>
          <MaterialIcons name="favorite-border" size={48} color={colors.outlineVariant} />
          <Text style={[type.headlineSm, { color: colors.onSurfaceVariant, marginTop: 16, textAlign: "center" }]}>
            Inicia sesión para guardar tus mezcales favoritos
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/account")} style={styles.exploreButton}>
            <Text style={[type.labelCaps, { color: colors.onPrimary }]}>Ir a Cuenta</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={[type.displayLgMobile, { color: colors.primary, fontSize: 22 }]}>Guardados</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.terroirStamp}>
            <MaterialIcons name="inventory-2" size={36} color={colors.outline} />
          </View>
          <Text style={[type.headlineMd, { color: colors.primary, marginTop: spacing.gutter, textAlign: "center" }]}>
            Tu cava está vacía
          </Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: "center", marginTop: 8, maxWidth: 260 }]}>
            Aún no tienes mezcales guardados en tu selección personal.
          </Text>
          <Pressable onPress={() => router.push("/(tabs)")} style={styles.exploreButton}>
            <Text style={[type.labelCaps, { color: colors.onPrimary }]}>Explorar Catálogo</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.marginMobile, paddingBottom: 40 }}>
          <Text style={[type.labelCaps, { color: colors.primary, marginBottom: 6 }]}>Su Cava Personal</Text>
          <Text style={[type.headlineMd, { color: colors.onSurface, marginBottom: spacing.gutter * 1.3 }]}>
            Selección de la Casa
          </Text>
          {favorites.map((item) => (
            <FavoriteCard key={item.id} item={item} onRemove={handleRemove} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 64,
    justifyContent: "center",
    paddingHorizontal: spacing.marginMobile,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77, 70, 53, 0.2)",
  },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.marginMobile },
  terroirStamp: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  exploreButton: {
    marginTop: spacing.gutter * 1.3,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.gutter * 1.3,
    paddingVertical: 14,
    borderRadius: radius.DEFAULT,
  },
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.3)",
    borderRadius: radius.lg,
    padding: spacing.gutter,
    marginBottom: spacing.gutter,
  },
  favoriteButton: {
    position: "absolute",
    top: spacing.gutter,
    right: spacing.gutter,
    zIndex: 10,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: radius.DEFAULT,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainerLowest,
    marginBottom: spacing.gutter,
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  cardFooter: {
    marginTop: spacing.gutter,
    paddingTop: spacing.gutter * 0.7,
    borderTopWidth: 1,
    borderTopColor: "rgba(77, 70, 53, 0.2)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
