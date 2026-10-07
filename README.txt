CAJA FÁCIL V4.3 — LISTA PARA GITHUB PAGES

NUEVO: BORRAR TODO DESDE LA APP INSTALADA
1. Abre Caja Fácil y entra a Respaldo.
2. Descarga un respaldo si quieres conservar una copia.
3. Toca "Borrar todo y empezar de nuevo".
4. Acepta el aviso y escribe BORRAR para confirmar.
5. Se vacían gastos, compras, cierres y campos; vuelves al inicio.
Cancelar o escribir otra palabra no borra nada. Funciona sin conexión.
Mientras se restaura un respaldo, el reinicio se desactiva temporalmente.
El borrado afecta solo los registros de Caja Fácil en este navegador;
no borra respaldos descargados, la app instalada ni datos de otras personas.
Actualizar a V4.3 NO borra registros: el botón requiere confirmación.

INSTALACIÓN EN EL REPOSITORIO EXISTENTE
1. Descomprime el ZIP.
2. En el repositorio caja-facil, usa Add file > Upload files.
3. Sube los archivos sueltos a la raíz y reemplaza los existentes.
   index.html, styles.css y app.js deben quedar juntos, sin una carpeta adicional.
4. Confirma los cambios y espera a que el deployment de github-pages termine.
5. Abre la misma dirección en el mismo navegador que usas para registrar datos:
   https://sandramaldonadoglez-hub.github.io/caja-facil/
6. Cierra y vuelve a abrir la app si estaba abierta. Debe aparecer V4.3 arriba.
   Si aún aparece la versión anterior, abre la dirección con ?v=4.3 al final.

DATOS Y COMPATIBILIDAD
- Se conserva CajaFacilDB, versión 1, con movimientos y cierres.
- No se borra ni migra IndexedDB. El respaldo JSON mantiene version: 4.
- Se conserva la lógica financiera y de registro, edición y restauración.
- Se añade el reinicio confirmado de movimientos y cierres, sin cambiar
  el nombre, versión ni claves de la base de datos.
- Los datos pertenecen al navegador y dominio donde se guardaron; mantén la liga.
- No borres los datos del sitio para actualizar. Eso sí borraría el historial.
- Puedes descargar un respaldo antes de reemplazar los archivos.
- Restaurar agrega movimientos: no vuelvas a importar el mismo respaldo sobre
  datos ya existentes, pues la función original los duplicaría.

QUÉ SE CORRIGIÓ
- El CSS publicado tenía solo 312 bytes y cuatro reglas para editar/borrar.
  Se restauran las reglas para vistas, tarjetas, botones, formularios y menú.
- Rutas relativas explícitas ./, compatibles con /caja-facil/ en GitHub Pages.
- styles.css, app.js y manifest.json usan ?v=4.3.
- Caché caja-facil-v4.3; instalación sin reutilizar recursos HTTP antiguos.
- Actualización del service worker sin caché HTTP y activación tras precarga.
- Se eliminan únicamente cachés antiguos con prefijo caja-facil-.
- Respuestas HTTP fallidas o HTML recibido como CSS/JS no reemplazan los
  recursos válidos en el caché durante navegación normal.
- El modo sin conexión recupera los recursos precargados de esta versión.
- Reinicio de ambos almacenes en una sola transacción: si el almacenamiento
  falla, los registros se conservan y aparece un aviso.

PRUEBAS LOCALES
Probado en Chromium bajo /caja-facil/, de 320 a 1280 px:
CSS aplicado; una vista visible; menú fijo; sin desbordamiento horizontal;
actualización desde V4 con registros previos; gastos, compras y gastos de casa;
edición/eliminación; cierre y recálculo; semana/mes/todo; exportar/restaurar;
recarga sin conexión; conservación de cachés ajenos; sin errores JavaScript.
Reinicio: actualización desde V4.2 sin borrado; cancelación; palabra incorrecta;
borrado confirmado; fallo real de almacenamiento; campos vacíos; persistencia
tras recarga; nuevos registros; restauración y uso sin conexión.
Restauración de archivo grande: reinicio e importación adicional bloqueados
hasta completar la escritura, para evitar que reaparezcan registros.

La V4.3 no se ha publicado por este trabajo: el ZIP está listo para subir.
