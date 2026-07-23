import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { colors, radius } from "../lib/theme";

export default function ProductCardSkeleton() {
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
      <View style={styles.image} />
      <View style={styles.lineLg} />
      <View style={styles.lineSm} />
      <View style={styles.linePrice} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, flexDirection: "column" },
  image: {
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
  },
  lineLg: { height: 16, borderRadius: 4, backgroundColor: colors.surfaceContainerHigh, marginTop: 10, width: "85%" },
  lineSm: { height: 10, borderRadius: 4, backgroundColor: colors.surfaceContainerHigh, marginTop: 8, width: "50%" },
  linePrice: { height: 16, borderRadius: 4, backgroundColor: colors.surfaceContainerHigh, marginTop: 10, width: "40%" },
});
