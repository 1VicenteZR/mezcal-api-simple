import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { api } from "../lib/api";
import { colors, type, spacing, radius } from "../lib/theme";
import { useAuth } from "../lib/AuthContext";

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function ProfileField({ label, value, onChangeText, keyboardType, autoCapitalize }) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={[type.labelCaps, { color: colors.primaryContainer, marginBottom: 4 }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, { borderBottomColor: focused ? colors.primary : colors.outlineVariant }]}
        placeholderTextColor={colors.onSurfaceVariant + "80"}
      />
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!fullName.trim() || !email.trim()) {
      setError("Nombre y correo no pueden estar vacíos.");
      return;
    }
    setSaving(true);
    try {
      await api.updateMe({ full_name: fullName.trim(), email: email.trim() });
      await refresh();
      router.back();
    } catch (err) {
      setError(err.message || "No se pudo guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={20} color={colors.primary} />
        </Pressable>
        <Text style={[type.headlineSm, { color: colors.primary }]}>Editar Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.marginMobile, paddingTop: spacing.gutter * 2 }}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={[type.headlineMd, { color: colors.primaryContainer }]}>{initials(fullName)}</Text>
          </View>
        </View>

        <View style={{ gap: spacing.gutter * 1.3, marginTop: spacing.gutter * 1.5 }}>
          <ProfileField label="Nombre Completo" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
          <ProfileField
            label="Correo Electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {error ? <Text style={[type.bodyMd, { color: colors.error, fontSize: 13, marginTop: spacing.gutter }]}>{error}</Text> : null}

        <View style={{ marginTop: spacing.gutter * 2, gap: spacing.gutter * 0.7 }}>
          <Pressable onPress={handleSave} disabled={saving} style={[styles.saveButton, saving && { opacity: 0.7 }]}>
            {saving ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[type.labelCaps, { color: colors.onPrimary }]}>Guardar Cambios</Text>
            )}
          </Pressable>
          <Pressable onPress={() => router.back()} disabled={saving} style={styles.cancelButton}>
            <Text style={[type.labelCaps, { color: colors.primary }]}>Cancelar</Text>
          </Pressable>
        </View>
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
  avatarWrap: { alignItems: "center" },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.4)",
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    fontFamily: "Manrope_400Regular",
    fontSize: 18,
    color: colors.onSurface,
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  saveButton: {
    backgroundColor: colors.primaryContainer,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
});
