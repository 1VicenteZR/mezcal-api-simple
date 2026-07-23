import { createContext, useContext, useCallback, useRef, useState } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, type, spacing, radius } from "./theme";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const hideTimeout = useRef(null);

  const showToast = useCallback((message, icon = "check-circle") => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setToast({ message, icon });
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    hideTimeout.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start(() => setToast(null));
    }, 2000);
  }, [opacity, translateY]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]} pointerEvents="none">
          <MaterialIcons name={toast.icon} size={18} color={colors.primary} />
          <Text style={[type.bodyMd, { color: colors.onSurface, fontSize: 14 }]}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 100,
    left: spacing.marginMobile,
    right: spacing.marginMobile,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
    borderRadius: radius.DEFAULT,
    paddingVertical: 14,
    paddingHorizontal: spacing.marginMobile,
    zIndex: 999,
  },
});
