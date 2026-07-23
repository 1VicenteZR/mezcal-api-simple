import { useState } from "react";
import { View, Text, Image, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { imageUrl } from "../lib/api";
import { colors, type, spacing, radius } from "../lib/theme";
import { useCart } from "../lib/CartContext";

function formatMXN(cents) {
  return Number(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 });
}

export default function CartScreen() {
  const router = useRouter();
  const { items, loading, total, updateQuantity, removeItem } = useCart();
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [error, setError] = useState("");

  const handleQtyChange = async (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1 || newQty > item.product_stock) return;
    setUpdatingId(item.id);
    setError("");
    try {
      await updateQuantity(item.id, newQty);
    } catch (err) {
      setError(err.message || "No se pudo actualizar la cantidad.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId) => {
    setUpdatingId(itemId);
    setError("");
    try {
      await removeItem(itemId);
    } catch (err) {
      setError(err.message || "No se pudo quitar el producto.");
    } finally {
      setUpdatingId(null);
      setConfirmRemoveId(null);
    }
  };

  const handleCheckout = () => {
    router.push("/payment-method");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.onSurface} />
        </Pressable>
        <Text style={[type.headlineSm, { color: colors.onSurface }]}>Tu Carrito</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="shopping-cart" size={48} color={colors.outlineVariant} />
          <Text style={[type.headlineSm, { color: colors.onSurfaceVariant, marginTop: 16, textAlign: "center" }]}>
            Tu carrito está vacío
          </Text>
          <Pressable onPress={() => router.push("/(tabs)")} style={styles.emptyButton}>
            <Text style={[type.labelCaps, { color: colors.onPrimary }]}>Ver Catálogo</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: spacing.marginMobile, paddingBottom: 260 }}>
            {error ? (
              <Text style={[type.bodyMd, { color: colors.error, marginBottom: 12 }]}>{error}</Text>
            ) : null}
            {items.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardImageWrap}>
                  {item.imagen_url ? (
                    <Image source={{ uri: imageUrl(item.imagen_url) }} style={styles.cardImage} resizeMode="contain" />
                  ) : (
                    <View style={[styles.cardImage, { backgroundColor: colors.surfaceContainerLowest }]} />
                  )}
                </View>
                <View style={styles.cardBody}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={[type.headlineSm, { color: colors.primaryContainer, flex: 1 }]} numberOfLines={2}>
                      {item.product_name}
                    </Text>
                    {confirmRemoveId === item.id ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        {updatingId === item.id ? (
                          <ActivityIndicator color={colors.error} size="small" />
                        ) : (
                          <>
                            <Pressable onPress={() => handleRemove(item.id)} hitSlop={6}>
                              <Text style={[type.labelCaps, { color: colors.error, fontSize: 11 }]}>Sí</Text>
                            </Pressable>
                            <Pressable onPress={() => setConfirmRemoveId(null)} hitSlop={6}>
                              <Text style={[type.labelCaps, { color: colors.onSurfaceVariant, fontSize: 11 }]}>No</Text>
                            </Pressable>
                          </>
                        )}
                      </View>
                    ) : (
                      <Pressable onPress={() => setConfirmRemoveId(item.id)} disabled={updatingId === item.id} hitSlop={8}>
                        <MaterialIcons name="delete" size={20} color={colors.onSurfaceVariant} />
                      </Pressable>
                    )}
                  </View>
                  <View style={styles.qtyRow}>
                    <View style={styles.qtyStepper}>
                      <Pressable
                        onPress={() => handleQtyChange(item, -1)}
                        disabled={updatingId === item.id}
                        style={styles.qtyButton}
                      >
                        <Text style={[type.bodyMd, { color: colors.primary }]}>−</Text>
                      </Pressable>
                      <Text style={[type.bodyMd, { color: colors.onSurface, minWidth: 24, textAlign: "center" }]}>
                        {item.quantity}
                      </Text>
                      <Pressable
                        onPress={() => handleQtyChange(item, 1)}
                        disabled={updatingId === item.id}
                        style={styles.qtyButton}
                      >
                        <Text style={[type.bodyMd, { color: colors.primary }]}>+</Text>
                      </Pressable>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[type.labelCaps, { color: colors.onSurfaceVariant }]}>Subtotal</Text>
                      <Text style={[type.headlineSm, { color: colors.onSurface }]}>
                        ${formatMXN(item.product_price * item.quantity)} MXN
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.summary}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>Subtotal</Text>
              <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>${formatMXN(total)} MXN</Text>
            </View>
            <View style={styles.divider} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: spacing.gutter }}>
              <Text style={[type.headlineSm, { color: colors.onSurface }]}>Total</Text>
              <Text style={[type.displayLgMobile, { color: colors.primary, fontSize: 28 }]}>${formatMXN(total)} MXN</Text>
            </View>
            <Pressable onPress={handleCheckout} style={styles.checkoutButton}>
              <Text style={[type.labelCaps, { color: colors.onPrimaryContainer }]}>Confirmar Pedido</Text>
              <MaterialIcons name="arrow-forward" size={18} color={colors.onPrimaryContainer} />
            </Pressable>
          </View>
        </>
      )}
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
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.marginMobile },
  emptyButton: {
    marginTop: spacing.gutter,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.gutter,
    paddingVertical: 12,
    borderRadius: radius.DEFAULT,
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    borderRadius: radius.lg,
    marginBottom: spacing.gutter,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainer,
  },
  cardImageWrap: { width: "100%", height: 140, backgroundColor: colors.surfaceContainerLowest },
  cardImage: { width: "100%", height: "100%" },
  cardBody: { padding: spacing.marginMobile },
  qtyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: spacing.gutter },
  qtyStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    borderRadius: radius.full,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  qtyButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  summary: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceContainer,
    borderTopWidth: 1,
    borderTopColor: "rgba(77, 70, 53, 0.3)",
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.gutter,
    paddingBottom: spacing.gutter * 1.3,
  },
  divider: { height: 1, backgroundColor: "rgba(77, 70, 53, 0.2)", marginVertical: 8 },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primaryContainer,
    paddingVertical: 18,
  },
});
