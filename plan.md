# Pocketwise — plan de implementación

## Producto y enfoque

App de presupuesto personal en español, inspirada en la experiencia Pocketwise indicada por la persona usuaria: panel oscuro y sobrio, acento menta, jerarquía clara entre resumen, tendencias, gastos por categoría y avisos entendibles. El ejemplo de referencia se tomará como guía de estilo y de contenido, no se copiará su código ni se harán peticiones a su backend.

La app se desarrolla sobre el starter administrado Expo Router / React Native / TypeScript / NativeWind ya inicializado. Se usará AsyncStorage en Android/iOS y `localStorage` en Expo Web, sin cuentas, sin lecturas/escrituras de finanzas al servidor y con los cálculos hechos en el cliente. Importación y exportación CSV funcionarán tanto en navegador como en dispositivos. Los movimientos tendrán fecha, importe, tipo, categoría y nota opcional; las categorías de gasto tendrán presupuestos por mes. Los meses se podrán recorrer para consultar movimientos, resúmenes y presupuestos históricos. Gráficas deterministas se dibujarán con `react-native-svg` ya disponible.

Para que el dashboard sea útil en la primera apertura, el primer inicio mostrará un conjunto pequeño de datos demostrativos marcados claramente como datos de ejemplo, inspirados en el contenido visible del sitio de referencia. El usuario podrá editarlos, borrarlos o importar sus propios movimientos. La divisa inicial será USD para conservar la referencia y sus cifras.

## Diseño

- **Movimiento de diseño:** panel de finanzas personal de estética nocturna editorial, cercano al dashboard de referencia suministrado.
- **Principios:** información numérica legible; revelar primero el saldo y el progreso del presupuesto; categorizar con colores consistentes; privacidad visible y explícita.
- **Filosofía de color:** azul noche para lectura concentrada, superficies azul pizarra para ordenar capas, texto frío de alto contraste; menta como firma de avance saludable, con ámbar/coral reservados a avisos y exceso presupuestario.
- **Paradigma de layout:** flujo vertical de tarjetas en teléfono, resumen antes que detalle, navegación inferior compacta para uso con una mano; en pantallas anchas, bloques de tendencias y distribución pueden compartir fila.
- **Elementos distintivos:** tarjeta amplia de saldo restante con brillo menta tenue; indicador segmentado de progreso por presupuesto; tiras compactas de insights con icono y comparación concreta.
- **Interacción:** formularios cortos en una hoja modal, acciones principales accesibles en el borde superior/inferior, categorías y periodo seleccionables con controles de toque amplios; confirmar antes de borrar.
- **Animación:** transiciones suaves de barras y progreso al cambiar el mes; sin animaciones constantes ni efectos que distraigan de números.
- **Tipografía:** sistema nativo sans legible; cifras grandes con peso semibold y números alineados/tabulares cuando esté disponible; etiquetas pequeñas en versales espaciadas.
- **Esencia de marca:** una vista privada y tranquila del dinero cotidiano, para tomar decisiones sin hojas de cálculo — clara, cercana, confiable.
- **Voz:** concreta, sin regaños y orientada al siguiente paso. Ejemplos: “Te quedan $1,586 este mes.” / “Comer fuera va $80 por encima de tu plan.”
- **Wordmark e icono:** icono geométrico de bolsillo/moneda en menta sobre azul noche; nombre “Pocketwise” como texto de interfaz, no incrustado en iconos raster.
- **Color distintivo:** menta `#6FE7C2`; fondo `#0B1222`, tarjetas `#131E32`, bordes `#25344D`, texto `#EFF5FF`, secundario `#96A7BF`, ámbar `#F5BE67` y coral `#F28B82`.

## Estructura del proyecto

- `app/(tabs)/_layout.tsx`: cuatro pestañas principales y barra inferior con iconos.
- `app/(tabs)/index.tsx`: resumen del mes, flujo de caja, distribución, insights y actividad reciente.
- `app/(tabs)/transactions.tsx`: historial mensual, selector de mes y edición/borrado.
- `app/(tabs)/budgets.tsx`: presupuestos mensuales por categoría, gasto acumulado, disponible y edición.
- `app/(tabs)/insights.tsx`: análisis automáticos legibles sobre excesos, evolución y presupuesto restante; privacidad local, importación CSV, exportación de respaldo y reinicio de datos de ejemplo.
- `components/`: tarjetas reutilizables, selector mensual, barras, formulario de movimiento y modales de categoría/presupuesto.
- `lib/finance.ts`: tipos, categorías de base, conjunto demo, agregaciones, tendencias e insights sin dependencias de red.
- `lib/storage.ts`: abstracción de AsyncStorage (nativo) / localStorage (web) y carga inicial del conjunto demo.
- `lib/csv.ts`: exportación con escape CSV e importación con normalización de encabezados, fechas y validación de filas.
- `lib/AppContext.tsx`: estado reactivo de movimientos, presupuestos, mes seleccionado y acciones; persistencia local con aviso y reintento visibles si la escritura falla.
- `assets/images/`: iconos de launcher/splash/favicon y variantes Android coordinadas.

## Flujos funcionales

1. Inicio: la app carga datos locales; si es el primer inicio, carga datos demo identificados. Cambiar de mes recalcula saldos, presupuestos, tendencias e insights.
2. Añadir/editar: formulario modal con ingreso/gasto, importe positivo, categoría, fecha y nota opcional. Eliminar solicita confirmación. Las mutaciones se guardan en almacenamiento local.
3. Presupuestos: crear o ajustar un importe por categoría y mes. Cada categoría muestra gasto, plan, restante y progreso; exceder el plan produce un estado ámbar/coral y un análisis asociado.
4. Dashboard: presenta ingresos, gasto, saldo después de gastos, presupuesto restante, donut de gasto por categoría, líneas de ingresos/gastos para seis meses, avisos y movimientos recientes.
5. CSV: descargar/exportar movimientos como CSV UTF-8 con encabezados; importar filas con fecha, tipo, importe, categoría y nota, mostrando un resultado comprensible con filas aceptadas/rechazadas. Los datos nunca salen del dispositivo salvo que la persona decida compartir un archivo exportado.

## Alcance y restricciones

Se mantienen el starter móvil Expo y sus puertos runtime; no se incorpora persistencia de servidor, autenticación, sincronización entre dispositivos ni servicios externos. El almacenamiento local del navegador no equivale a una copia de seguridad: borrar datos del navegador/dispositivo puede eliminarlos. Se puede crear y compartir un CSV como respaldo voluntario. La vista web y la vista nativa reutilizan React Native; la selección de ficheros/descarga puede adaptar su implementación por plataforma.
