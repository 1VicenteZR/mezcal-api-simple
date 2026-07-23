import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, type, spacing, radius } from "../lib/theme";
import { useCart } from "../lib/CartContext";
import { api } from "../lib/api";

function formatMXN(cents) {
  return Number(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 });
}

function generateBarcodeDigits() {
  let digits = "";
  for (let i = 0; i < 14; i++) digits += Math.floor(Math.random() * 10);
  return digits;
}

export default function PaymentMethodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { total: cartTotal, checkout: cartCheckout } = useCart();
  const isBuyNow = !!params.productId;
  const buyNowQuantity = Number(params.quantity) || 1;
  const total = isBuyNow ? Number(params.unitPrice) * buyNowQuantity : cartTotal;
  const [method, setMethod] = useState("efectivo");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setError("");
    if (method === "tarjeta") {
      if (cardNumber.replace(/\s/g, "").length < 12 || !cardName.trim() || cardExpiry.length < 4 || cardCvv.length < 3) {
        setError("Completa todos los datos de la tarjeta.");
        return;
      }
    }
    setProcessing(true);
    try {
      if (method === "tarjeta") {
        await new Promise((resolve) => setTimeout(resolve, 1600));
      }
      const order = isBuyNow
        ? await api.checkoutNow(Number(params.productId), buyNowQuantity, method)
        : await cartCheckout(method);
      const barcode = method === "efectivo" ? generateBarcodeDigits() : "";
      router.replace({
        pathname: "/order-confirmation",
        params: {
          orderId: order.id,
          total: order.total,
          createdAt: order.created_at,
          paymentMethod: method,
          barcode,
        },
      });
    } catch (err) {
      setError(err.message || "No se pudo procesar el pago.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.primary} />
        </Pressable>
        <Text style={[type.headlineSm, { color: colors.primary }]}>Método de Pago</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.marginMobile, paddingBottom: 60 }}>
        <Text style={[type.labelCaps, { color: colors.onSurfaceVariant, marginBottom: 4 }]}>Total a pagar</Text>
        <Text style={[type.displayLgMobile, { color: colors.primary, fontSize: 32, marginBottom: spacing.gutter * 1.5 }]}>
          ${formatMXN(total)} MXN
        </Text>

        <Pressable
          onPress={() => setMethod("efectivo")}
          style={[styles.methodCard, method === "efectivo" && styles.methodCardActive]}
        >
          <MaterialIcons name="payments" size={22} color={method === "efectivo" ? colors.primary : colors.onSurfaceVariant} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[type.bodyMd, { color: colors.onSurface, fontFamily: "Manrope_700Bold" }]}>Efectivo</Text>
            <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, fontSize: 12 }]}>
              Genera un código para pagar en tienda (OXXO)
            </Text>
          </View>
          <MaterialIcons
            name={method === "efectivo" ? "radio-button-checked" : "radio-button-unchecked"}
            size={20}
            color={method === "efectivo" ? colors.primary : colors.outlineVariant}
          />
        </Pressable>

        <Pressable
          onPress={() => setMethod("tarjeta")}
          style={[styles.methodCard, method === "tarjeta" && styles.methodCardActive, { marginTop: 12 }]}
        >
          <MaterialIcons name="credit-card" size={22} color={method === "tarjeta" ? colors.primary : colors.onSurfaceVariant} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[type.bodyMd, { color: colors.onSurface, fontFamily: "Manrope_700Bold" }]}>Tarjeta</Text>
            <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, fontSize: 12 }]}>
              Pago inmediato con tarjeta de crédito o débito
            </Text>
          </View>
          <MaterialIcons
            name={method === "tarjeta" ? "radio-button-checked" : "radio-button-unchecked"}
            size={20}
            color={method === "tarjeta" ? colors.primary : colors.outlineVariant}
          />
        </Pressable>

        {method === "tarjeta" && (
          <View style={{ marginTop: spacing.gutter * 1.3 }}>
            <Text style={[type.labelCaps, { color: colors.primaryContainer, marginBottom: 6 }]}>Número de Tarjeta</Text>
            <TextInput
              value={cardNumber}
              onChangeText={setCardNumber}
              placeholder="4242 4242 4242 4242"
              placeholderTextColor={colors.onSurfaceVariant + "80"}
              keyboardType="number-pad"
              maxLength={19}
              style={styles.input}
            />
            <Text style={[type.labelCaps, { color: colors.primaryContainer, marginTop: spacing.gutter, marginBottom: 6 }]}>
              Nombre en la Tarjeta
            </Text>
            <TextInput
              value={cardName}
              onChangeText={setCardName}
              placeholder="Como aparece en la tarjeta"
              placeholderTextColor={colors.onSurfaceVariant + "80"}
              autoCapitalize="words"
              style={styles.input}
            />
            <View style={{ flexDirection: "row", gap: 16, marginTop: spacing.gutter }}>
              <View style={{ flex: 1 }}>
                <Text style={[type.labelCaps, { color: colors.primaryContainer, marginBottom: 6 }]}>Vencimiento</Text>
                <TextInput
                  value={cardExpiry}
                  onChangeText={setCardExpiry}
                  placeholder="MM/AA"
                  placeholderTextColor={colors.onSurfaceVariant + "80"}
                  maxLength={5}
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.labelCaps, { color: colors.primaryContainer, marginBottom: 6 }]}>CVV</Text>
                <TextInput
                  value={cardCvv}
                  onChangeText={setCardCvv}
                  placeholder="123"
                  placeholderTextColor={colors.onSurfaceVariant + "80"}
                  keyboardType="number-pad"
                  maxLength={3}
                  secureTextEntry
                  style={styles.input}
                />
              </View>
            </View>
            <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, fontSize: 11, marginTop: 10, fontStyle: "italic" }]}>
              Pago simulado con fines demostrativos. No se procesa ningún cargo real.
            </Text>
          </View>
        )}

        {error ? <Text style={[type.bodyMd, { color: colors.error, fontSize: 12, marginTop: spacing.gutter }]}>{error}</Text> : null}

        <Pressable
          onPress={handleConfirm}
          disabled={processing}
          style={[styles.confirmButton, processing && { opacity: 0.7 }]}
        >
          {processing ? (
            <ActivityIndicator color={colors.onPrimaryContainer} />
          ) : (
            <Text style={[type.labelCaps, { color: colors.onPrimaryContainer }]}>
              {method === "tarjeta" ? "Pagar Ahora" : "Generar Código de Pago"}
            </Text>
          )}
        </Pressable>
      </ScrollView>
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
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.gutter,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.3)",
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLow,
  },
  methodCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerHigh,
  },
  input: {
    fontFamily: "Manrope_400Regular",
    fontSize: 16,
    color: colors.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingVertical: 10,
  },
  confirmButton: {
    marginTop: spacing.gutter * 1.8,
    backgroundColor: colors.primaryContainer,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
});
