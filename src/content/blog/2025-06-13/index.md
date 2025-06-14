---
title: "Patitas Unidas II: Technical Foundations" 
summary: "A look at how we built the MVP in under 48 hours using Flutter, PostgreSQL, Firebase, and cloud tools."
date: "Jun 13 2025"
draft: false
tags:
- Hackathon
- Flutter
- Firebase
- Geolocation
- Smart cities
---

## Building the MVP in 48 Hours: Architecture, Stack, and Lessons

To build a working prototype in such a short time, we needed a flexible and scalable stack. Our goal: to create a minimal yet functional MVP that could grow over time.

### Our Tech Stack

- **Frontend**: Flutter + Riverpod + go_router
- **Backend**: Node.js + PostgreSQL with PostGIS for geospatial queries
- **Image Storage**: DigitalOcean Spaces
- **Authentication and Notifications**: Firebase Auth + FCM

We followed the **Clean Architecture** pattern to ensure clear separation between presentation, domain, and data layers. Even at MVP stage, we aimed for scalable code.

### Core Features in the MVP

- Report a lost pet with location and images
- Submit a sighting (anonymous or logged in)
- View reports on an interactive map
- Push notifications for nearby sightings
- Pet registration with breed, color, size, etc.

### Main Technical Challenges

- **Accurate geolocation**: using GPS and manual input, stored as spatial points in the database.
- **Image handling**: image compression + CDN delivery for cost-effective performance.
- **Matching**: we prepared the backend for future AI image-matching, but included filters by species, color, size, and location.
- **UX**: it had to be intuitive — one minute to report, even for non-technical users.

---

