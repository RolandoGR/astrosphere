---
title: "Patitas Unidas"
summary: "En este artículo, comparto cómo desarrollé junto con un equipo, una webapp para encontrar coincidencias entre mascotas perdidas y avistamientos cercanos utilizando Flutter, geolocalización y servicios en la nube."
date: "Jun 13 2025"
draft: false
tags:
- Tutorial
---

<h1>Cómo desarrollamos Patitas Unidas: tecnología para reunir mascotas perdidas con sus dueños</h1>

<p>Patitas Unidas es un proyecto que nació con un propósito muy claro: ayudar a reunir mascotas perdidas con sus familias mediante la tecnología. Vimos un problema recurrente en nuestras comunidades: publicaciones dispersas en redes sociales, sin estructura, sin seguimiento, y con muy baja probabilidad de éxito. Nos propusimos resolverlo.</p>

<p>Este artículo resume el proceso de creación de la aplicación, los retos técnicos, las decisiones arquitectónicas, y cómo logramos lanzar un MVP funcional utilizando tecnologías modernas como Flutter, PostgreSQL, y servicios en la nube de DigitalOcean y Firebase.</p>

<h2>El Reto: Conectar Mascotas Perdidas con Avistamientos Cercanos</h2>

<p>Desde el inicio, supimos que queríamos una aplicación geolocalizada donde cualquier persona pudiera reportar un avistamiento o registrar la pérdida de su mascota. Esto implicaba gestionar ubicaciones precisas, imágenes, y una base de datos capaz de manejar búsquedas por proximidad. Además, debía ser 100% en español y accesible para usuarios sin experiencia técnica.</p>

<p>Otro reto importante era construir un sistema que permitiera, en fases futuras, aplicar inteligencia artificial para encontrar coincidencias visuales entre mascotas perdidas y avistamientos. Así nació la idea de diseñar la arquitectura con ese objetivo en mente.</p>

<h2>La Tecnología que Elegimos</h2>

<p>Para el frontend decidimos usar <strong>Flutter</strong>, lo que nos permitió desarrollar una sola base de código para Android, iOS y web. Para el backend nos inclinamos por una arquitectura híbrida:</p>

<ul>
  <li><strong>Flutter + Riverpod + go_router</strong> para el frontend</li>
  <li><strong>Node.js + PostgreSQL con PostGIS</strong> para las APIs y las consultas geoespaciales</li>
  <li><strong>DigitalOcean Spaces</strong> para almacenar imágenes</li>
  <li><strong>Firebase Auth y FCM</strong> para autenticación y notificaciones push</li>
</ul>

<p>La arquitectura sigue el patrón <strong>Clean Architecture</strong>, separando las capas de presentación, dominio y datos. Esto nos permite escalar fácilmente y mantener el código desacoplado y testable.</p>

<h2>Retos Técnicos Principales</h2>

<ul>
  <li><strong>Geolocalización precisa</strong>: integrar mapas, capturar ubicaciones manuales y con GPS, y almacenar puntos geográficos en la base de datos para luego hacer consultas eficientes por distancia.</li>
  <li><strong>Coincidencias</strong>: aunque el sistema de matching por IA se desarrollará en una fase futura, ya preparamos la base para hacer búsquedas por atributos (color, tamaño, especie, ubicación).</li>
  <li><strong>Carga y optimización de imágenes</strong>: usamos compresión previa y almacenamiento económico con CDN integrado.</li>
  <li><strong>Experiencia del usuario</strong>: el flujo debía ser lo suficientemente simple como para que cualquier persona pudiera hacer un reporte en menos de un minuto.</li>
</ul>

<h2>Qué Incluye el MVP</h2>

<p>La primera versión lanzada incluye:</p>

<ul>
  <li>Registro de mascotas con sus datos completos y fotos</li>
  <li>Reporte de pérdida de mascota con ubicación</li>
  <li>Avistamientos anónimos o autenticados con imágenes</li>
  <li>Mapa interactivo para explorar reportes</li>
  <li>Notificaciones push cuando hay coincidencias cercanas</li>
</ul>

<p>Todo en una interfaz móvil construida con Flutter, completamente en español.</p>

<h2>Lecciones Aprendidas</h2>

<ul>
  <li>Planificar bien la arquitectura desde el inicio ahorra tiempo a largo plazo</li>
  <li>Flutter es excelente para MVPs rápidos y multiplataforma</li>
  <li>PostGIS es una herramienta muy poderosa para consultas geoespaciales</li>
  <li>El diseño UX simple es mucho más importante que una app con demasiadas funciones</li>
</ul>

<h2>¿Qué Sigue?</h2>

<p>En las próximas versiones planeamos integrar:</p>
<ul>
  <li>Coincidencias por IA con reconocimiento de imagen</li>
  <li>Sistema de recompensas por colaborar</li>
  <li>Módulos para asociaciones protectoras de animales</li>
  <li>Soporte offline y sincronización</li>
</ul>

<p>Patitas Unidas sigue creciendo, y esperamos convertirla en una herramienta indispensable en Latinoamérica para salvar y reunir mascotas. Si tienes ideas, sugerencias o te gustaría colaborar, ¡contáctame!</p>
