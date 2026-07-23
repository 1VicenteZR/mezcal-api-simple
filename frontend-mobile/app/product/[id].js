import { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, Pressable, ActivityIndicator, TextInput, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { api, imageUrl } from "../../lib/api";
import { colors, type, spacing, radius } from "../../lib/theme";
import { useAuth } from "../../lib/AuthContext";
import { useCart } from "../../lib/CartContext";
import { useFavorites } from "../../lib/FavoritesContext";
import { useToast } from "../../lib/ToastContext";
import ProductCard from "../../components/ProductCard";

function Stars({ value, size = 16 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const name = value >= i ? "star" : value >= i - 0.5 ? "star-half" : "star-border";
    stars.push(<MaterialIcons key={i} name={name} size={size} color={colors.primaryContainer} />);
  }
  return <View style={{ flexDirection: "row" }}>{stars}</View>;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [togglingFavorite, setTogglingFavorite] = useState(false);
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [added, setAdded] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([api.getProduct(id), api.listReviews(id).catch(() => []), api.listProducts().catch(() => [])])
      .then(([productData, reviewsData, allProducts]) => {
        if (!active) return;
        setProduct(productData);
        setReviews(reviewsData || []);
        const relatedProducts = (allProducts || []).filter(
          (p) =>
            p.id !== productData.id &&
            (p.tipo_mezcal === productData.tipo_mezcal || p.region === productData.region)
        );
        setRelated(relatedProducts.slice(0, 6));
      })
      .catch((err) => {
        if (active) setError(err.message || "No se pudo cargar el producto.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: "center", justifyContent: "center", padding: spacing.marginMobile }]}>
        <Text style={[type.bodyMd, { color: colors.error, textAlign: "center" }]}>
          {error || "Producto no encontrado."}
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={[type.labelCaps, { color: colors.primary }]}>Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const outOfStock = product.stock <= 0;

  const handleAddToCart = async () => {
    setAdding(true);
    setAddError("");
    try {
      await addItem(product.id, qty);
      setAdded(true);
      showToast(`${product.name} agregado al carrito`, "shopping-cart");
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      setAddError(err.message || "No se pudo agregar al carrito.");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleFavorite = async () => {
    setTogglingFavorite(true);
    try {
      await toggleFavorite(product.id);
    } catch {
      // silencioso: si falla, el corazón simplemente no cambia
    } finally {
      setTogglingFavorite(false);
    }
  };

  const handleSubmitReview = async () => {
    if (myRating < 1) {
      setReviewError("Selecciona una calificación.");
      return;
    }
    setSubmittingReview(true);
    setReviewError("");
    try {
      if (editingReviewId) {
        const updated = await api.updateReview(editingReviewId, {
          rating: myRating,
          comment: myComment.trim() || null,
        });
        setReviews((prev) => prev.map((r) => (r.id === editingReviewId ? updated : r)));
        setEditingReviewId(null);
      } else {
        const newReview = await api.createReview({
          product_id: product.id,
          rating: myRating,
          comment: myComment.trim() || null,
        });
        setReviews((prev) => [newReview, ...prev]);
      }
      setMyRating(0);
      setMyComment("");
    } catch (err) {
      setReviewError(err.message || "No se pudo guardar tu reseña.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleStartEditReview = (review) => {
    setEditingReviewId(review.id);
    setMyRating(review.rating);
    setMyComment(review.comment || "");
    setReviewError("");
  };

  const handleCancelEditReview = () => {
    setEditingReviewId(null);
    setMyRating(0);
    setMyComment("");
    setReviewError("");
  };

  const handleDeleteReview = async (reviewId) => {
    setDeletingReviewId(reviewId);
    try {
      await api.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      if (editingReviewId === reviewId) handleCancelEditReview();
    } catch (err) {
      setReviewError(err.message || "No se pudo eliminar la reseña.");
    } finally {
      setDeletingReviewId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView bounces={false}>
        <View style={styles.heroWrap}>
          {product.imagen_url ? (
            <Image source={{ uri: imageUrl(product.imagen_url) }} style={styles.hero} resizeMode="contain" />
          ) : (
            <View style={[styles.hero, { backgroundColor: colors.surfaceContainerLowest }]} />
          )}
          <SafeAreaView style={styles.backButtonWrap} edges={["top"]}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[type.labelCaps, { color: colors.onSurfaceVariant, marginBottom: 8 }]}>
                {(product.tipo_mezcal || "").toUpperCase()}
                {product.region ? ` • ${product.region}` : ""}
              </Text>
              <Text style={[type.displayLgMobile, { color: colors.primaryContainer }]}>{product.name}</Text>
            </View>
            {user && (
              <Pressable onPress={handleToggleFavorite} disabled={togglingFavorite} hitSlop={8} style={{ paddingTop: 4 }}>
                <MaterialIcons
                  name={isFavorite(product.id) ? "favorite" : "favorite-border"}
                  size={26}
                  color={colors.primaryContainer}
                />
              </Pressable>
            )}
          </View>
          <Text style={[type.headlineMd, { color: colors.primaryContainer, marginTop: spacing.gutter }]}>
            ${Number(product.price / 100).toLocaleString("es-MX")} MXN
          </Text>

          <View style={styles.badgesRow}>
            {product.abv != null && (
              <View style={styles.badge}>
                <MaterialIcons name="science" size={14} color={colors.primaryContainer} />
                <Text style={[type.labelCaps, { color: colors.onSurface }]}>ABV: {product.abv}%</Text>
              </View>
            )}
            <View style={styles.badge}>
              <MaterialIcons
                name={outOfStock ? "cancel" : "check-circle"}
                size={14}
                color={colors.primaryContainer}
              />
              <Text style={[type.labelCaps, { color: colors.onSurface }]}>
                {outOfStock ? "Agotado" : "Disponible"}
              </Text>
            </View>
          </View>

          {product.description && (
            <View style={{ marginTop: spacing.gutter * 1.3 }}>
              <Text style={[type.headlineSm, { color: colors.onSurface, marginBottom: 12 }]}>El Perfil</Text>
              <Text style={[type.bodyLg, { color: colors.onSurfaceVariant, lineHeight: 26 }]}>
                {product.description}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.gutter }}>
            <Text style={[type.headlineSm, { color: colors.onSurface }]}>Reseñas</Text>
            {reviews.length > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Stars value={avgRating} />
                <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>
                  {avgRating.toFixed(1)} ({reviews.length})
                </Text>
              </View>
            )}
          </View>

          {reviews.length === 0 ? (
            <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>
              Sé el primero en dejar una reseña.
            </Text>
          ) : (
            reviews.map((r) => {
              const reviewerName = r.user_name || "Usuario";
              const isOwn = user && r.user_id === user.id;
              return (
              <View key={r.id} style={styles.review}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={styles.avatar}>
                      <Text style={[type.labelCaps, { color: colors.primaryContainer }]}>
                        {reviewerName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[type.bodyMd, { color: colors.onSurface, fontFamily: "Manrope_700Bold" }]}>
                      {reviewerName}
                    </Text>
                  </View>
                  <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, opacity: 0.8, fontSize: 13 }]}>
                    {new Date(r.created_at).toLocaleDateString("es-MX")}
                  </Text>
                </View>
                <Stars value={r.rating} size={14} />
                {r.comment && (
                  <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 10, fontStyle: "italic" }]}>
                    "{r.comment}"
                  </Text>
                )}
                {isOwn && (
                  confirmDeleteId === r.id ? (
                    <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                      <Pressable onPress={() => handleDeleteReview(r.id)} disabled={deletingReviewId === r.id} hitSlop={4}>
                        {deletingReviewId === r.id ? (
                          <ActivityIndicator color={colors.error} size="small" />
                        ) : (
                          <Text style={[type.labelCaps, { color: colors.error, fontSize: 11 }]}>Sí, eliminar</Text>
                        )}
                      </Pressable>
                      <Pressable onPress={() => setConfirmDeleteId(null)} hitSlop={4}>
                        <Text style={[type.labelCaps, { color: colors.onSurfaceVariant, fontSize: 11 }]}>Cancelar</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={{ flexDirection: "row", gap: 16, marginTop: 12 }}>
                      <Pressable onPress={() => handleStartEditReview(r)} hitSlop={4} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <MaterialIcons name="edit" size={14} color={colors.primary} />
                        <Text style={[type.labelCaps, { color: colors.primary, fontSize: 11 }]}>Editar</Text>
                      </Pressable>
                      <Pressable onPress={() => setConfirmDeleteId(r.id)} hitSlop={4} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <MaterialIcons name="delete-outline" size={14} color={colors.error} />
                        <Text style={[type.labelCaps, { color: colors.error, fontSize: 11 }]}>Eliminar</Text>
                      </Pressable>
                    </View>
                  )
                )}
              </View>
              );
            })
          )}

          <View style={styles.divider} />

          <Text style={[type.headlineSm, { color: colors.onSurface, marginBottom: spacing.gutter }]}>
            {editingReviewId ? "Editar tu Reseña" : "Tu Experiencia"}
          </Text>

          {!user ? (
            <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>
              ¿Ya eres cliente?{" "}
              <Text style={{ color: colors.primaryContainer, textDecorationLine: "underline" }} onPress={() => router.push("/(tabs)/account")}>
                Inicia sesión
              </Text>{" "}
              para dejar una reseña.
            </Text>
          ) : (
            <View>
              <Text style={[type.labelCaps, { color: colors.onSurfaceVariant, marginBottom: 10 }]}>Calificación</Text>
              <View style={{ flexDirection: "row", gap: 6, marginBottom: spacing.gutter }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setMyRating(n)} hitSlop={4}>
                    <MaterialIcons
                      name={n <= myRating ? "star" : "star-border"}
                      size={28}
                      color={colors.primaryContainer}
                    />
                  </Pressable>
                ))}
              </View>

              <Text style={[type.labelCaps, { color: colors.onSurfaceVariant, marginBottom: 10 }]}>Comentario</Text>
              <TextInput
                value={myComment}
                onChangeText={setMyComment}
                placeholder="Cuéntanos tu experiencia con este mezcal…"
                placeholderTextColor={colors.onSurfaceVariant + "80"}
                multiline
                numberOfLines={4}
                style={styles.reviewInput}
              />

              {reviewError ? (
                <Text style={[type.bodyMd, { color: colors.error, fontSize: 12, marginTop: 8 }]}>{reviewError}</Text>
              ) : null}

              <Pressable
                onPress={handleSubmitReview}
                disabled={submittingReview}
                style={[styles.reviewButton, submittingReview && { opacity: 0.7 }]}
              >
                {submittingReview ? (
                  <ActivityIndicator color={colors.onPrimaryContainer} />
                ) : (
                  <Text style={[type.labelCaps, { color: colors.onPrimaryContainer }]}>
                    {editingReviewId ? "Guardar Cambios" : "Publicar Reseña"}
                  </Text>
                )}
              </Pressable>

              {editingReviewId && (
                <Pressable onPress={handleCancelEditReview} style={{ marginTop: 10, alignItems: "center" }}>
                  <Text style={[type.labelCaps, { color: colors.onSurfaceVariant }]}>Cancelar edición</Text>
                </Pressable>
              )}
            </View>
          )}

          <View style={{ paddingVertical: spacing.gutter * 1.5 }}>
            {outOfStock ? (
              <View style={styles.disabledButton}>
                <MaterialIcons name="shopping-cart" size={18} color={colors.onSurfaceVariant} />
                <Text style={[type.labelCaps, { color: colors.onSurfaceVariant }]}>Agotado</Text>
              </View>
            ) : !user ? (
              <Pressable style={styles.disabledButton} onPress={() => router.push("/(tabs)/account")}>
                <MaterialIcons name="login" size={18} color={colors.onSurfaceVariant} />
                <Text style={[type.labelCaps, { color: colors.onSurfaceVariant }]}>Inicia sesión para comprar</Text>
              </Pressable>
            ) : (
              <>
                <View style={styles.qtyRow}>
                  <Text style={[type.labelCaps, { color: colors.onSurfaceVariant }]}>Cantidad</Text>
                  <View style={styles.qtyStepper}>
                    <Pressable
                      onPress={() => setQty((q) => Math.max(1, q - 1))}
                      style={styles.qtyButton}
                    >
                      <Text style={[type.bodyMd, { color: colors.primary }]}>−</Text>
                    </Pressable>
                    <Text style={[type.bodyMd, { color: colors.onSurface, minWidth: 24, textAlign: "center" }]}>{qty}</Text>
                    <Pressable
                      onPress={() => setQty((q) => Math.min(product.stock, q + 1))}
                      style={styles.qtyButton}
                    >
                      <Text style={[type.bodyMd, { color: colors.primary }]}>+</Text>
                    </Pressable>
                  </View>
                </View>

                {addError ? (
                  <Text style={[type.bodyMd, { color: colors.error, fontSize: 12, marginBottom: 8 }]}>{addError}</Text>
                ) : null}

                <Pressable
                  onPress={handleAddToCart}
                  disabled={adding}
                  style={[styles.addButton, adding && { opacity: 0.7 }]}
                >
                  {adding ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <>
                      <MaterialIcons name={added ? "check" : "shopping-cart"} size={18} color={colors.onPrimary} />
                      <Text style={[type.labelCaps, { color: colors.onPrimary }]}>
                        {added ? "¡Agregado!" : "Agregar al Carrito"}
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/payment-method",
                      params: { productId: product.id, quantity: qty, unitPrice: product.price },
                    })
                  }
                  style={styles.buyNowButton}
                >
                  <MaterialIcons name="bolt" size={18} color={colors.primary} />
                  <Text style={[type.labelCaps, { color: colors.primary }]}>Comprar Ahora</Text>
                </Pressable>
              </>
            )}
          </View>

          {related.length > 0 && (
            <View style={{ marginTop: spacing.gutter * 0.5, marginBottom: spacing.gutter * 1.5 }}>
              <Text style={[type.headlineSm, { color: colors.onSurface, marginBottom: spacing.gutter }]}>
                Productos Relacionados
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.gutter }}>
                {related.map((p) => (
                  <View key={p.id} style={{ width: 150 }}>
                    <ProductCard product={p} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroWrap: { width: "100%", height: 320, backgroundColor: colors.surfaceContainerLowest },
  hero: { width: "100%", height: "100%" },
  backButtonWrap: { position: "absolute", top: 0, left: 0, right: 0 },
  backButton: {
    marginTop: 12,
    marginLeft: spacing.marginMobile,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: "rgba(42, 42, 42, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingHorizontal: spacing.marginMobile, paddingTop: spacing.gutter, backgroundColor: colors.background },
  titleRow: { flexDirection: "row" },
  badgesRow: { flexDirection: "row", gap: 12, marginTop: spacing.gutter, flexWrap: "wrap" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    backgroundColor: colors.surfaceContainer,
  },
  divider: { height: 1, backgroundColor: "rgba(77, 70, 53, 0.3)", marginVertical: spacing.gutter * 1.3 },
  review: { paddingBottom: spacing.gutter, marginBottom: spacing.gutter, borderBottomWidth: 1, borderBottomColor: "rgba(77, 70, 53, 0.2)" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  reviewInput: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.3)",
    borderRadius: radius.sm,
    padding: spacing.marginMobile,
    color: colors.onSurface,
    fontFamily: "Manrope_400Regular",
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  reviewButton: {
    marginTop: spacing.gutter,
    backgroundColor: colors.primaryContainer,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.3)",
    backgroundColor: colors.surfaceContainerHigh,
    opacity: 0.7,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.gutter,
  },
  qtyStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    borderRadius: radius.full,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  qtyButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    backgroundColor: colors.primary,
  },
  buyNowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(242, 202, 80, 0.4)",
  },
});
