# Frontend Mobile — Oro de Oaxaca

App móvil para roles invitado y usuario, construida con Expo (React Native) + expo-router.
Consume la misma API que el admin (ver `../backend/README.md`). Como es app nativa (no
navegador), CORS no aplica — solo el admin web necesita esa configuración.

## Alcance de este Sprint (Sprint 3 — COMPLETO, probado en iPhone real)

- Catálogo de productos (rol invitado, sin login) con búsqueda inteligente (IA, Groq) y filtro por tipo de mezcal
- Detalle de producto: descripción, ABV, stock, reseñas (solo lectura)
- Login / Registro (rol usuario)
- Persistencia de sesión con `expo-secure-store`
- Carrito, checkout, historial de órdenes, escribir reseña: pendiente (Sprint 4)

## Instalar

```bash
npm install
```

Si ves un error `ERESOLVE` de npm, ya está resuelto vía `.npmrc` (`legacy-peer-deps=true`) —
viene de un conflicto de peer dependencies entre `expo-router` y `react-dom` en esta versión de
Expo, no es un problema del código del proyecto.

## Configurar la IP del backend

Edita `.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.0.107:8001
```

Cambia la IP según dónde estés (casa/escuela, verifica con `ip addr show` en la VM por SSH), y
reinicia `npx expo start` tras editarlo.

## Ejecutar en desarrollo

```bash
npx expo start
```

Escanea el QR con la app **Expo Go** en tu celular (Android o iOS), conectado a la misma red
wifi que la VM del backend.

## Estructura

```
frontend-mobile/
├── app/
│   ├── _layout.js           -> carga fuentes, AuthProvider, Stack raíz
│   ├── (tabs)/
│   │   ├── _layout.js        -> bottom tabs: Catálogo / Cuenta
│   │   ├── index.js           -> Catálogo: búsqueda, filtros, grid de productos
│   │   └── account.js          -> Cuenta: Login/Registro si no hay sesión, Perfil si la hay
│   └── product/
│       └── [id].js             -> Detalle de producto + reseñas
├── components/
│   ├── ProductCard.js
│   ├── LoginForm.js
│   └── RegisterForm.js
└── lib/
    ├── api.js                -> cliente fetch (token via SecureStore, mismo manejo de sesión
    │                             expirada que el admin: 401 y 403 "Not authenticated")
    ├── AuthContext.js         -> login/registro/logout, solo permite rol "usuario"
    └── theme.js               -> colores y tipografía (Artisanal Luxury, tema oscuro)
```

## Reglas de negocio importantes

- **El login del móvil solo acepta rol "usuario".** Si una cuenta admin intenta entrar aquí, se
  rechaza con un mensaje explicando que debe usar el panel web — es simétrico a que el panel
  admin web solo acepta rol "admin".
- Las reseñas (`GET /reviews/{product_id}`) no incluyen el nombre del usuario que las escribió
  (el backend solo guarda `user_id`, y `GET /users/{id}` es solo-admin), así que se muestran como
  "Usuario" genérico. Si se quiere mostrar el nombre real, hay que agregar el campo al backend.
- El botón de compra en el detalle de producto está deshabilitado ("Próximamente en carrito") —
  carrito y checkout son Sprint 4.

## Diseño

Sistema "Oro de Oaxaca" (tema oscuro, "Artisanal Luxury"), generado con Google Stitch: dorado
`#F2CA50`/`#D4AF37`, charcoal `#131313`, Libre Caslon Text (headlines) + Manrope (body/labels).
Tokens en `lib/theme.js`. Documentado en `../docs/DESIGN.md` (si se actualiza con el diseño móvil).
