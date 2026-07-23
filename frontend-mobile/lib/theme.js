export const colors = {
  background: "#131313",
  surface: "#131313",
  surfaceDim: "#131313",
  surfaceBright: "#393939",
  surfaceContainerLowest: "#0e0e0e",
  surfaceContainerLow: "#1c1b1b",
  surfaceContainer: "#201f1f",
  surfaceContainerHigh: "#2a2a2a",
  surfaceContainerHighest: "#353534",
  onSurface: "#e5e2e1",
  onSurfaceVariant: "#d0c5af",
  outline: "#99907c",
  outlineVariant: "#4d4635",
  primary: "#f2ca50",
  onPrimary: "#3c2f00",
  primaryContainer: "#d4af37",
  onPrimaryContainer: "#554300",
  primaryFixed: "#ffe088",
  primaryFixedDim: "#e9c349",
  error: "#ffb4ab",
  onError: "#690005",
  errorContainer: "#93000a",
  onErrorContainer: "#ffdad6",
  onBackground: "#e5e2e1",
  secondary: "#bbcbb8",
  onSecondary: "#263426",
  secondaryContainer: "#3e4d3e",
  onSecondaryContainer: "#adbdaa",
};

export const fonts = {
  serif: "LibreCaslonText_400Regular",
  serifBold: "LibreCaslonText_700Bold",
  sans: "Manrope_400Regular",
  sansBold: "Manrope_700Bold",
  sansExtraBold: "Manrope_800ExtraBold",
};

export const type = {
  displayLgMobile: { fontFamily: fonts.serif, fontSize: 36, lineHeight: 44, letterSpacing: -0.3 },
  headlineMd: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 40 },
  headlineSm: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 32 },
  bodyLg: { fontFamily: fonts.sans, fontSize: 18, lineHeight: 28 },
  bodyMd: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24 },
  labelCaps: { fontFamily: fonts.sansBold, fontSize: 12, lineHeight: 20, letterSpacing: 1.2, textTransform: "uppercase" },
};

export const spacing = {
  base: 8,
  marginMobile: 20,
  gutter: 24,
};

export const radius = {
  sm: 2,
  DEFAULT: 4,
  lg: 8,
  xl: 12,
  full: 999,
};
