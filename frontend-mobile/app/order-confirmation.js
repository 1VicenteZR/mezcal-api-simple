import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, type, spacing, radius } from "../lib/theme";

function formatMXN(cents) {
  return Number(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 });
}

function Barcode({ digits }) {
  return (
    <View style={styles.barcodeCard}>
      <View style={styles.barcodeBars}>
        {digits.split("").map((digit, i) => (
          <View
            key={i}
            style={{
              width: Number(digit) % 2 === 0 ? 3 : 1.5,
              height: "100%",
              backgroundColor: "#1a1a1a",
              marginRight: 2,
            }}
          />
        ))}
      </View>
      <Text style={styles.barcodeDigits}>{digits}</Text>
    </View>
  );
}

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { orderId, total, createdAt, paymentMethod, barcode } = useLocalSearchParams();
  const isCash = paymentMethod === "efectivo" && !!barcode;

  const date = createdAt ? new Date(createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }) : "";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={[type.displayLgMobile, { color: colors.primary, fontSize: 22 }]}>Oro de Oaxaca</Text>
        <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={8}>
          <MaterialIcons name="close" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="check-circle" size={48} color={colors.primary} />
        </View>

        <Text style={[type.displayLgMobile, { color: colors.onSurface, textAlign: "center", marginBottom: 12 }]}>
          {isCash ? "¡Pedido registrado!" : "¡Pago recibido!"}
        </Text>
        <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: "center", marginBottom: spacing.gutter * 1.5 }]}>
          {isCash
            ? "Presenta este código en tu tienda OXXO más cercana para completar tu pago en efectivo."
            : "Tu pago con tarjeta fue procesado correctamente."}
        </Text>

        {isCash && <Barcode digits={String(barcode)} />}

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View>
              <Text style={[type.labelCaps, { color: colors.primary }]}>Número de pedido</Text>
              <Text style={[type.headlineSm, { color: colors.onSurface, marginTop: 4 }]}>#ORD-{orderId}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={[type.labelCaps, { color: colors.onSurfaceVariant }]}>Fecha</Text>
              <Text style={[type.bodyMd, { color: colors.onSurface, marginTop: 4 }]}>{date}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[type.labelCaps, { color: colors.onSurfaceVariant }]}>Total</Text>
              <Text style={[type.bodyMd, { color: colors.primary, marginTop: 4, fontFamily: "Manrope_700Bold" }]}>
                ${formatMXN(Number(total))} MXN
              </Text>
            </View>
          </View>
        </View>

        <View style={{ width: "100%", marginTop: spacing.gutter * 1.5, gap: 12 }}>
          <Pressable onPress={() => router.replace("/(tabs)")} style={styles.primaryButton}>
            <Text style={[type.labelCaps, { color: colors.onPrimary }]}>Seguir Comprando</Text>
            <MaterialIcons name="arrow-forward" size={18} color={colors.onPrimary} />
          </Pressable>
          <Pressable onPress={() => router.replace("/orders")} style={styles.secondaryButton}>
            <Text style={[type.labelCaps, { color: colors.onSurface }]}>Ver mis Pedidos</Text>
          </Pressable>
        </View>
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
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.marginMobile },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.gutter,
  },
  card: {
    width: "100%",
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: "rgba(93, 64, 55, 0.3)",
    borderRadius: radius.lg,
    padding: spacing.gutter,
  },
  barcodeCard: {
    width: "100%",
    backgroundColor: "#f5f0e6",
    borderRadius: radius.lg,
    paddingVertical: spacing.gutter,
    paddingHorizontal: spacing.gutter,
    alignItems: "center",
    marginBottom: spacing.gutter * 1.3,
  },
  barcodeBars: { flexDirection: "row", height: 64, alignItems: "center" },
  barcodeDigits: {
    marginTop: 10,
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    letterSpacing: 2,
    color: "#1a1a1a",
  },
  cardRow: { marginBottom: spacing.gutter },
  divider: { height: 1, backgroundColor: "rgba(77, 70, 53, 0.2)", marginBottom: spacing.gutter },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
});
