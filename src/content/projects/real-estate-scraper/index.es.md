---
title: "Análisis del mercado inmobiliario de Hermosillo"
summary: "De un scraper en Selenium para una constructora a un censo diario de los anuncios de inmuebles de Hermosillo, con inferencia de ubicación, controles de calidad de datos y un tablero de precios por zona."
date: "Oct 09 2026"
draft: false
tags:
- Python
- Playwright
- SQLite
- Pandas
- Geoespacial
- Análisis de datos
- Web scraping
---

![Tablero de precios de oferta por código postal en Hermosillo: un mapa de coropletas y una tabla de medianas con intervalos de 90%](./marketplace-dashboard.png)
<center><i>Tablero de precios por zona. Mapa base © Esri; códigos postales © SEPOMEX (CC BY 4.0)</i></center>

¿Cuánto cuesta realmente una casa en Hermosillo, zona por zona? Los portales inmobiliarios muestran solo una parte del mercado, así que construí mi propio flujo de datos para responderlo. El proyecto ha tenido dos fases.

## Fase 2 (2026): un censo de los anuncios de Facebook Marketplace

La mayoría de las casas, terrenos y rentas de Hermosillo se anuncian en Facebook Marketplace, no en los grandes portales. Esta herramienta recolecta esos anuncios todos los días y los convierte en un conjunto de datos listo para analizar:

- **Recolección.** Playwright recorre las páginas públicas de Marketplace, sin iniciar sesión, por rangos de precio, para cubrir todo el mercado y no solo lo que devuelve una búsqueda por palabras. Todo se guarda en SQLite con historial de precios, así que también registra bajadas de precio y anuncios que desaparecen.
- **Relevancia.** Tres filtros (dónde busca, la tarjeta del anuncio y la página del anuncio) dejan fuera a los instaladores de cocinas, las casas prefabricadas y los "busco casa", y la precisión de cada filtro se mide en lugar de suponerse.
- **Ubicación.** El punto que Facebook pone en el mapa suele ser un marcador genérico de la ciudad, a una mediana de 2.3 km del lugar real. Por eso las posiciones salen de lo que escribió el vendedor: enlaces de Google Maps, calles y cruces de OpenStreetMap, colonias del INEGI y códigos postales. Cerca del 70% de los inmuebles termina con una posición confiable.
- **Calidad de datos.** Une las distintas formas de escribir una misma colonia, marca precios inverosímiles con estadística robusta, detecta anuncios repetidos comparando huellas de sus fotos y usa un modelo de lenguaje local (sin servicios de IA externos) para leer superficies y direcciones que las reglas no encuentran. Una muestra aleatoria se verifica a mano para medir la exactitud.
- **Resultados.** Un mapa interactivo, un tablero de medianas con intervalos de 90% por código postal, una exportación a CSV y un reporte en la terminal.

En sus primeros diez días leyó más de 6,000 páginas de anuncios, de las cuales cerca de 4,700 se confirmaron como inmuebles en 107 códigos postales.

Es una herramienta personal de investigación y está hecha para ser respetuosa: nunca inicia sesión, se limita a un presupuesto diario pequeño de páginas y se detiene cuando el sitio muestra un muro de inicio de sesión, un CAPTCHA o un bloqueo, sin intentar nunca evadirlo. Los datos crudos se quedan en mi computadora; solo comparto cifras agregadas como las del tablero de arriba.

## Fase 1 (2024): scraper de Century21 para una constructora

![Resumen del análisis inmobiliario de Hermosillo: 79 inmuebles, precio mediano de venta de 5.58 millones de pesos y renta mediana de 21,000 pesos](./real-estate-dashboard.png)
<center><i>Reporte resumen de la fase 1</i></center>

La primera versión usaba **Python** y **Selenium** para recolectar anuncios de terrenos e inmuebles de **Century21**, y ayudó a una **constructora** a monitorear qué había en el mercado y a qué precio, en lugar de revisarlo a mano todos los días. Los datos se guardaban en archivos CSV y se visualizaban en mapas interactivos con **Pandas** y **Leaflet**.

![Tablero interactivo con un mapa de inmuebles en Hermosillo, distribución de precios, precios medianos por colonia y precio contra número de recámaras](./real-estate-dashboard2.png)
<center><i>Tablero de la fase 1</i></center>
