# Contexto del proyecto

## Stack

- TypeScript
- Express
- MongoDB
- Mongoose

## Arquitectura

- routes
- controllers
- services
- models
- middleware
- dto

## Filosofía

- Mantener arquitectura simple.
- Evitar sobreingeniería.
- Preferir funciones sobre clases cuando sea suficiente.
- Aprender el porqué de cada decisión.

## Convenciones

- Services contienen lógica de negocio.
- Controllers coordinan la petición.
- Models solo representan MongoDB.
- DTO para entrada.
- Middleware para errores globales.

## Flujo

Route
→ Controller
→ Service
→ Model
→ MongoDB

## Cómo quiero que actúes

- No implementes código inmediatamente.
- Primero propón la arquitectura.
- Si hay varias alternativas, explica los trade-offs.
- Si detectas una mala práctica, señálala.
- Asume que quiero aprender, no solo terminar la historia.