CAJA FACIL - VERSION ANDROID

Esta carpeta ya está lista para funcionar como PWA en Android.

QUE CAMBIO EN ESTA VERSION
- La vista de Historial y Resumen ahora se muestra tipo "nota", como en la hoja de papel.
- Se separa claramente:
  * Ventas
  * Gastos del día
  * Compras grandes / insumos
  * Caja
  * Resultado
- Formula de caja:
  Fondo fijo 2500 + ventas en efectivo - gastos del día = efectivo esperado.
- Formula de resultado:
  ventas totales - gastos del día - compras grandes.
- Respaldo y restauración incluidos.
- Manifest y service worker listos para Android.

COMO INSTALAR EN ANDROID
1. Sube esta carpeta a un hosting HTTPS.
   Opciones fáciles: GitHub Pages, Netlify, Vercel o cualquier hosting web.
2. Abre el enlace con Google Chrome en el teléfono Android.
3. Toca el menú de Chrome (⋮).
4. Elige "Instalar aplicación" o "Añadir a pantalla principal".
5. Se creará el icono de Caja Fácil y abrirá como app.

IMPORTANTE
- Si se abre solo como archivo local, no se instalará correctamente como PWA.
- Para no perder historial, usar también el botón de Respaldo.
