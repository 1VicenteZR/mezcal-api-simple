import { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../lib/AuthContext";
import { api } from "../../lib/api";
import { colors, type, spacing, radius } from "../../lib/theme";
import LoginForm from "../../components/LoginForm";
import RegisterForm from "../../components/RegisterForm";

function formatMXN(cents) {
  return Number(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 0 });
}

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) {
      setStats(null);
      return;
    }
    let active = true;
    api
      .listMyOrders()
      .then((orders) => {
        if (!active) return;
        const spent = (orders || [])
          .filter((o) => o.status !== "cancelado")
          .reduce((sum, o) => sum + o.total, 0);
        setStats({ count: (orders || []).length, spent });
      })
      .catch(() => {
        if (active) setStats(null);
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (loading) {
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
          <Text style={[type.displayLgMobile, { color: colors.primary }]}>Oro de Oaxaca</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingTop: spacing.gutter * 2, paddingBottom: 40 }}>
          {mode === "login" ? (
            <LoginForm onSwitchToRegister={() => setMode("register")} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setMode("login")} />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={[type.displayLgMobile, { color: colors.primary }]}>Oro de Oaxaca</Text>
      </View>
      <View style={styles.profileWrap}>
        <View style={styles.avatar}>
          <Text style={[type.headlineMd, { color: colors.primaryContainer }]}>{initials(user.full_name)}</Text>
        </View>
        <Text style={[type.headlineMd, { color: colors.onSurface, marginTop: spacing.gutter }]}>
          {user.full_name || "Usuario"}
        </Text>
        <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 4 }]}>{user.email}</Text>

        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={[type.headlineSm, { color: colors.primary }]}>{stats.count}</Text>
              <Text style={[type.labelCaps, { color: colors.onSurfaceVariant, fontSize: 10 }]}>
                Pedido{stats.count === 1 ? "" : "s"}
              </Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statBlock}>
              <Text style={[type.headlineSm, { color: colors.primary }]}>${formatMXN(stats.spent)}</Text>
              <Text style={[type.labelCaps, { color: colors.onSurfaceVariant, fontSize: 10 }]}>Gastado (MXN)</Text>
            </View>
          </View>
        )}

        <Pressable style={styles.ordersLink} onPress={() => router.push("/edit-profile")}>
          <MaterialIcons name="edit" size={18} color={colors.primary} />
          <Text style={[type.labelCaps, { color: colors.primary }]}>Editar Perfil</Text>
          <MaterialIcons name="chevron-right" size={16} color={colors.primary} />
        </Pressable>

        <Pressable style={styles.ordersLink} onPress={() => router.push("/orders")}>
          <MaterialIcons name="receipt-long" size={18} color={colors.primary} />
          <Text style={[type.labelCaps, { color: colors.primary }]}>Mis Pedidos</Text>
          <MaterialIcons name="chevron-right" size={16} color={colors.primary} />
        </Pressable>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={[type.labelCaps, { color: colors.primaryContainer }]}>Cerrar sesión</Text>
        </Pressable>
      </View>
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
  profileWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.marginMobile },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.gutter * 1.3,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.3)",
    borderRadius: radius.lg,
    paddingVertical: spacing.gutter * 0.8,
  },
  statBlock: { flex: 1, alignItems: "center" },
  statsDivider: { width: 1, height: 32, backgroundColor: "rgba(77, 70, 53, 0.3)" },
  ordersLink: {
    marginTop: spacing.gutter * 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoutButton: {
    marginTop: spacing.gutter,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.gutter * 1.3,
    paddingVertical: 12,
    borderRadius: radius.DEFAULT,
  },
});
