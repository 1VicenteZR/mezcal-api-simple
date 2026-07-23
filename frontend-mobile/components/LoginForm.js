import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../lib/AuthContext";
import { colors, type, spacing } from "../lib/theme";

export default function LoginForm({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || "Credenciales inválidas. Por favor, intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={[type.headlineMd, { color: colors.primaryContainer, textAlign: "center", marginBottom: spacing.gutter * 1.3 }]}>
        Bienvenido de vuelta
      </Text>

      <View style={styles.field}>
        <Text style={[type.labelCaps, { color: colors.primaryContainer, marginBottom: 6 }]}>Correo Electrónico</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Ingresa tu correo"
          placeholderTextColor="rgba(208, 197, 175, 0.5)"
          autoCapitalize="none"
          keyboardType="email-address"
          style={[type.bodyMd, styles.input]}
        />
      </View>

      <View style={[styles.field, { marginTop: spacing.gutter }]}>
        <Text style={[type.labelCaps, { color: colors.primaryContainer, marginBottom: 6 }]}>Contraseña</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Ingresa tu contraseña"
            placeholderTextColor="rgba(208, 197, 175, 0.5)"
            secureTextEntry={!showPassword}
            style={[type.bodyMd, styles.input, { flex: 1 }]}
          />
          <Pressable onPress={() => setShowPassword((v) => !v)} style={{ paddingLeft: 8, paddingVertical: 8 }}>
            <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>
      </View>

      {error ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
          <MaterialIcons name="error" size={14} color={colors.error} />
          <Text style={[type.bodyMd, { color: colors.error, fontSize: 12, flex: 1 }]}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={handleSubmit}
        disabled={submitting || !email || !password}
        style={[styles.submitButton, (submitting || !email || !password) && { opacity: 0.6 }]}
      >
        {submitting ? (
          <ActivityIndicator color={colors.onPrimaryContainer} />
        ) : (
          <Text style={[type.labelCaps, { color: colors.onPrimaryContainer }]}>Iniciar sesión</Text>
        )}
      </Pressable>

      <Pressable onPress={onSwitchToRegister} style={{ marginTop: spacing.gutter * 1.5, alignItems: "center" }}>
        <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>
          ¿No tienes cuenta? <Text style={{ color: colors.primaryContainer, textDecorationLine: "underline" }}>Regístrate</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", paddingHorizontal: spacing.marginMobile },
  field: { width: "100%" },
  input: {
    color: colors.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: "#5D4037",
    paddingVertical: 10,
  },
  submitButton: {
    marginTop: spacing.gutter * 1.5,
    width: "100%",
    backgroundColor: colors.primaryContainer,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
