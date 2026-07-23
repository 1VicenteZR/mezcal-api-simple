import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../lib/theme";

export default function OrderCardSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.gutter }}>
        <View>
          <View style={[styles.line, { width: 90, height: 10 }]} />
          <View style={[styles.line, { width: 70, height: 16, marginTop: 6 }]} />
        </View>
        <View style={[styles.line, { width: 70, height: 24, borderRadius: radius.full }]} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <View style={[styles.thumb]} />
          <View style={[styles.thumb]} />
        </View>
        <View style={[styles.line, { width: 60, height: 20 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant + "50",
    borderRadius: radius.lg,
    padding: spacing.gutter,
    marginBottom: spacing.gutter,
  },
  line: { backgroundColor: colors.surfaceContainerHigh, borderRadius: 4 },
  thumb: { width: 44, height: 44, borderRadius: radius.DEFAULT, backgroundColor: colors.surfaceContainerHigh },
});
