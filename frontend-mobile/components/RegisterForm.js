import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../lib/AuthContext";
import { colors, type, spacing } from "../lib/theme";

export default function RegisterForm({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      await register({ full_name: fullName.trim(), email: email.trim(), password });
    } catch (err) {
      setError(err.message || "No se pudo crear la cuenta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={[type.headlineMd, { color: colors.primaryContainer, textAlign: "center" }]}>Crea tu cuenta</Text>
      <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: "center", marginTop: 8, marginBottom: spacing.gutter * 1.3 }]}>
        Únete a la herencia del mezcal artesanal.
      </Text>

      <Field label="Nombre completo" value={fullName} onChangeText={setFullName} />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
      <Field label="Confirmar contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

      {error ? <Text style={[type.bodyMd, { color: colors.error, fontSize: 12, marginTop: 4 }]}>{error}</Text> : null}

      <Pressable
        onPress={handleSubmit}
        disabled={submitting || !fullName || !email || !password}
        style={[styles.submitButton, (submitting || !fullName || !email || !password) && { opacity: 0.6 }]}
      >
        {submitting ? (
          <ActivityIndicator color={colors.onPrimaryContainer} />
        ) : (
          <Text style={[type.labelCaps, { color: colors.onPrimaryContainer }]}>Crear cuenta</Text>
        )}
      </Pressable>

      <Pressable onPress={onSwitchToLogin} style={{ marginTop: spacing.gutter, alignItems: "center" }}>
        <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>
          ¿Ya tienes cuenta? <Text style={{ color: colors.primaryContainer, textDecorationLine: "underline" }}>Inicia sesión</Text>
        </Text>
      </Pressable>
    </View>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: spacing.gutter }}>
      <Text style={[type.labelCaps, { color: colors.primaryContainer, marginBottom: 6 }]}>{label}</Text>
      <TextInput
        placeholderTextColor="rgba(208, 197, 175, 0.5)"
        style={[type.bodyMd, styles.input]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", paddingHorizontal: spacing.marginMobile },
  input: {
    color: colors.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: "#4d4635",
    paddingVertical: 10,
  },
  submitButton: {
    marginTop: spacing.base,
    width: "100%",
    backgroundColor: colors.primaryContainer,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
