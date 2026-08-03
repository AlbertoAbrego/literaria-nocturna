# Project context

## Stack

- TypeScript
- Express
- MongoDB
- Mongoose

## Architecture

- routes
- controllers
- services
- models
- middleware
- dto

## Philosophy

- Keep the architecture simple.
- Avoid over-engineering.
- Prefer functions over classes when sufficient.
- Learn the why behind every decision.

## Conventions

- Services contain business logic.
- Controllers coordinate the request.
- Models only represent MongoDB.
- DTO for input.
- Middleware for global errors.

## Flow

Route
→ Controller
→ Service
→ Model
→ MongoDB

## How I want you to act

- Do not implement code immediately.
- Propose the architecture first.
- If there are multiple alternatives, explain the trade-offs.
- If you spot a bad practice, point it out.
- Assume I want to learn, not just finish the story.
