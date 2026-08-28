import swaggerJsdoc from "swagger-jsdoc";
import { GENRES } from "../constants/genres";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Literaria Nocturna API",
      version: "1.0.0",
      description: "Book Club Management API",
    },
    servers: [{ url: "/api" }],
    components: {
      schemas: {
        Genre: {
          type: "string",
          enum: [...GENRES],
        },
        Book: {
          type: "object",
          required: ["_id", "title", "author", "genre", "synopsis", "createdAt", "updatedAt"],
          properties: {
            _id: { type: "string", description: "MongoDB ObjectId" },
            title: { type: "string" },
            author: { type: "string" },
            genre: { $ref: "#/components/schemas/Genre" },
            synopsis: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateBookDto: {
          type: "object",
          required: ["title", "author", "genre", "synopsis"],
          properties: {
            title: { type: "string" },
            author: { type: "string" },
            genre: { $ref: "#/components/schemas/Genre" },
            synopsis: { type: "string" },
          },
        },
        UpdateBookDto: {
          type: "object",
          properties: {
            title: { type: "string" },
            author: { type: "string" },
            genre: { $ref: "#/components/schemas/Genre" },
            synopsis: { type: "string" },
          },
        },
        BookQueryDto: {
          type: "object",
          properties: {
            genre: { $ref: "#/components/schemas/Genre" },
            author: { type: "string", description: "Case-insensitive partial match" },
            title: { type: "string", description: "Case-insensitive partial match" },
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
        },
        PaginatedResponse: {
          type: "object",
          required: ["data", "pagination"],
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Book" },
            },
            pagination: {
              type: "object",
              required: ["page", "limit", "total", "totalPages"],
              properties: {
                page: { type: "integer", minimum: 1 },
                limit: { type: "integer", minimum: 1 },
                total: { type: "integer", minimum: 0 },
                totalPages: { type: "integer", minimum: 0 },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: { type: "string" },
            code: { type: "string" },
            details: {
              type: "object",
              additionalProperties: { type: "string" },
              description: "Field-level validation messages (only on validation errors)",
            },
          },
        },
      },
      responses: {
        ValidationError: {
          description: "Validation failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                message: "Validation failed",
                code: "VALIDATION_ERROR",
                details: { title: "title is required", genre: "Invalid genre" },
              },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { message: "Book not found", code: "NOT_FOUND" },
            },
          },
        },
        ConflictError: {
          description: "Conflict with existing resource",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { message: "Book already exists.", code: "CONFLICT" },
            },
          },
        },
        InternalError: {
          description: "Unexpected server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { message: "Internal Server Error", code: "INTERNAL_ERROR" },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);