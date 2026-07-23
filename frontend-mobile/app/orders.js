import { useEffect, useState, useCallback } from "react";
import { View, Text, Image, ScrollView, Pressable, ActivityIndicator, StyleSheet, LayoutAnimation, Platform, UIManager, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { api, imageUrl } from "../lib/api";
import { colors, type, spacing, radius } from "../lib/theme";
import OrderCardSkeleton from "../components/OrderCardSkeleton";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STATUS_LABELS = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_STYLES = {
  pendiente: { bg: "rgba(242, 202, 80, 0.15)", text: colors.primary, border: "rgba(242, 202, 80, 0.3)" },
  pagado: { bg: colors.secondaryContainer + "50", text: colors.secondary, border: colors.secondary + "40" },
  enviado: { bg: colors.surfaceContainerHigh, text: colors.onSurfaceVariant, border: colors.outlineVariant },
  entregado: { bg: colors.secondaryContainer + "50", text: colors.secondary, border: colors.secondary + "40" },
  cancelado: { bg: colors.errorContainer + "40", text: colors.error, border: colors.error + "40" },
};

function formatMXN(cents) {
  return Number(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 });
}

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const loadOrders = useCallback(() => {
    return api
      .listMyOrders()
      .then((data) => setOrders(data || []))
      .catch((err) => setError(err.message || "No se pudo cargar tu historial."));
  }, []);

  useEffect(() => {
    let active = true;
    loadOrders().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [loadOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    await loadOrders();
    setRefreshing(false);
  };

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCancel = async (orderId) => {
    setCancellingId(orderId);
    setActionError("");
    try {
      const updated = await api.cancelMyOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      setActionError(err.message || "No se pudo cancelar el pedido.");
    } finally {
      setCancellingId(null);
      setConfirmId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.primary} />
        </Pressable>
        <Text style={[type.displayLgMobile, { color: colors.primary, fontSize: 22 }]}>Mis Pedidos</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ padding: spacing.marginMobile }}>
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </View>
      ) : error ? (
        <Text style={[type.bodyMd, { color: colors.error, textAlign: "center", marginTop: 40 }]}>{error}</Text>
      ) : orders.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl tintColor={colors.primary} refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          <View style={styles.emptyState}>
            <View style={styles.terroirStamp}>
              <MaterialIcons name="inventory-2" size={36} color={colors.outline} />
            </View>
            <Text style={[type.headlineMd, { color: colors.primary, marginTop: spacing.gutter, textAlign: "center" }]}>
              Historial Vacío
            </Text>
            <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: "center", marginTop: 8, maxWidth: 260 }]}>
              Aún no has hecho ningún pedido. Descubre nuestra selección de mezcales artesanales.
            </Text>
            <Pressable onPress={() => router.push("/(tabs)")} style={styles.exploreButton}>
              <Text style={[type.labelCaps, { color: colors.onPrimary }]}>Explorar Tienda</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.marginMobile, paddingBottom: 40 }}
          refreshControl={<RefreshControl tintColor={colors.primary} refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {orders.map((order) => {
            const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.pendiente;
            const expanded = expandedId === order.id;
            const preview = order.items.slice(0, 2);
            const extra = order.items.length - preview.length;
            return (
              <Pressable key={order.id} onPress={() => toggleExpand(order.id)} style={styles.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.gutter }}>
                  <View>
                    <Text style={[type.labelCaps, { color: colors.onSurfaceVariant }]}>
                      {new Date(order.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
                    </Text>
                    <Text style={[type.headlineSm, { color: colors.primary, marginTop: 4 }]}>#ORD-{order.id}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                    <Text style={[type.labelCaps, { color: statusStyle.text, fontSize: 10 }]}>
                      {STATUS_LABELS[order.status] || order.status}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <View style={{ flexDirection: "row" }}>
                    {preview.map((item, i) => (
                      <View key={item.id} style={[styles.thumbWrap, i > 0 && { marginLeft: -12 }]}>
                        {item.imagen_url ? (
                          <Image source={{ uri: imageUrl(item.imagen_url) }} style={styles.thumb} resizeMode="contain" />
                        ) : (
                          <MaterialIcons name="liquor" size={20} color={colors.outline} />
                        )}
                      </View>
                    ))}
                    {extra > 0 && (
                      <View style={[styles.thumbWrap, { marginLeft: -12, backgroundColor: colors.surfaceContainerHighest }]}>
                        <Text style={[type.labelCaps, { color: colors.primary, fontSize: 10 }]}>+{extra}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[type.labelCaps, { color: colors.onSurfaceVariant, fontSize: 10 }]}>TOTAL</Text>
                    <Text style={[type.headlineSm, { color: colors.primary }]}>${formatMXN(order.total)} MXN</Text>
                  </View>
                </View>

                {expanded && (
                  <View style={styles.expandedContent}>
                    {order.items.map((item) => (
                      <View key={item.id} style={styles.itemRow}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                          <Text style={[type.labelCaps, { color: colors.primary }]}>{item.quantity}x</Text>
                          <Text style={[type.bodyMd, { color: colors.onSurface, flex: 1 }]} numberOfLines={1}>
                            {item.product_name}
                          </Text>
                        </View>
                        <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>
                          ${formatMXN(item.unit_price * item.quantity)}
                        </Text>
                      </View>
                    ))}
                    {order.status === "cancelado" && (
                      <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, fontSize: 12, marginTop: 8 }]}>
                        Este pedido fue cancelado.
                      </Text>
                    )}
                    {order.status === "pendiente" && (
                      <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, fontSize: 12, marginTop: 8, fontStyle: "italic" }]}>
                        Tu pedido está siendo preparado.
                      </Text>
                    )}

                    {(order.status === "pendiente" || order.status === "pagado") && (
                      <View style={{ marginTop: spacing.gutter }}>
                        {actionError && confirmId === order.id ? (
                          <Text style={[type.bodyMd, { color: colors.error, fontSize: 12, marginBottom: 8 }]}>{actionError}</Text>
                        ) : null}
                        {confirmId === order.id ? (
                          <View style={{ flexDirection: "row", gap: 12 }}>
                            <Pressable
                              onPress={() => handleCancel(order.id)}
                              disabled={cancellingId === order.id}
                              style={[styles.cancelButton, { flex: 1, backgroundColor: colors.errorContainer }]}
                            >
                              {cancellingId === order.id ? (
                                <ActivityIndicator color={colors.onErrorContainer} size="small" />
                              ) : (
                                <Text style={[type.labelCaps, { color: colors.onErrorContainer, fontSize: 11 }]}>Confirmar cancelación</Text>
                              )}
                            </Pressable>
                            <Pressable onPress={() => setConfirmId(null)} style={styles.cancelButtonOutline}>
                              <Text style={[type.labelCaps, { color: colors.onSurfaceVariant, fontSize: 11 }]}>Volver</Text>
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable onPress={() => setConfirmId(order.id)} style={styles.cancelButtonOutline}>
                            <Text style={[type.labelCaps, { color: colors.error, fontSize: 11 }]}>Cancelar Pedido</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
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
    borderColor: colors.outlineVariant + "50",
    borderRadius: radius.lg,
    padding: spacing.gutter,
    marginBottom: spacing.gutter,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  thumbWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.DEFAULT,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant + "30",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumb: { width: "100%", height: "100%" },
  expandedContent: {
    marginTop: spacing.gutter,
    paddingTop: spacing.gutter,
    borderTopWidth: 1,
    borderTopColor: "rgba(77, 70, 53, 0.2)",
    gap: 10,
  },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  cancelButtonOutline: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 180, 171, 0.4)",
  },
});
