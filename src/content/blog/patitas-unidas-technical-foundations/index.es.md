---
title: "Patitas Unidas II: Bases técnicas"
summary: "Cómo construimos el MVP en menos de 48 horas con Flutter, PostgreSQL, Firebase y herramientas en la nube."
date: "Jun 13 2025"
draft: false
tags:
- Hackathon
- Flutter
- Firebase
- Geolocalización
- Ciudades inteligentes
---

## Construir el MVP en 48 horas: arquitectura, tecnologías y aprendizajes

Para tener un prototipo funcional en tan poco tiempo necesitábamos un stack flexible y escalable. Nuestro objetivo: un MVP mínimo pero funcional, que pudiera crecer con el tiempo.

### Nuestro stack

- **Frontend**: Flutter + Riverpod + go_router
- **Backend**: Node.js + PostgreSQL con PostGIS para consultas geoespaciales
- **Almacenamiento de imágenes**: DigitalOcean Spaces
- **Autenticación y notificaciones**: Firebase Auth + FCM

Seguimos el patrón de **Clean Architecture** para separar con claridad las capas de presentación, dominio y datos. Aun siendo un MVP, buscamos que el código pudiera escalar.

### Funciones principales del MVP

- Reportar una mascota perdida con ubicación e imágenes
- Registrar un avistamiento (de forma anónima o con sesión iniciada)
- Ver los reportes en un mapa interactivo
- Notificaciones push de avistamientos cercanos
- Registro de mascotas con raza, color, tamaño, etc.

### Principales retos técnicos

- **Geolocalización precisa**: con GPS y captura manual, guardada como puntos espaciales en la base de datos.
- **Manejo de imágenes**: compresión de imágenes y entrega por CDN para un buen rendimiento a bajo costo.
- **Coincidencias**: preparamos el backend para que en el futuro la IA compare imágenes, y mientras tanto incluimos filtros por especie, color, tamaño y ubicación.
- **Experiencia de usuario**: tenía que ser intuitiva; un minuto para reportar, incluso para personas sin experiencia técnica.

---
