import { http as mswHttp } from "msw";
import { describe, expect, it } from "vitest";
import { http } from "@/shared/api/http";
import { server } from "@/test/server";
import { internalError } from "@/test/handlers/errors";
import type { Book, PaginatedResponse } from "@/features/books/types";

describe("MSW contract verification", () => {
  describe("Successful Responses", () => {
    it("GET /api/books returns 200 with paginated data sorted by title asc", async () => {
      const response = await http.get<PaginatedResponse<Book>>("/books");

      expect(response.status).toBe(200);
      expect(response.data.data).toHaveLength(5);
      expect(response.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1,
      });

      const titles = response.data.data.map((b) => b.title);
      const sorted = [...titles].sort((a, b) => a.localeCompare(b));
      expect(titles).toEqual(sorted);
    });

    it("GET /api/books with genre filter returns filtered results", async () => {
      const response = await http.get<PaginatedResponse<Book>>("/books", {
        params: { genre: "Horror" },
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toHaveLength(1);
      expect(response.data.data[0].genre).toBe("Horror");
    });

    it("GET /api/books with author filter returns filtered results", async () => {
      const response = await http.get<PaginatedResponse<Book>>("/books", {
        params: { author: "Almeida" },
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toHaveLength(1);
      expect(response.data.data[0].author).toBe("Jorge Almeida");
    });

    it("GET /api/books with title filter returns filtered results", async () => {
      const response = await http.get<PaginatedResponse<Book>>("/books", {
        params: { title: "Whisper" },
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toHaveLength(1);
      expect(response.data.data[0].title).toBe("The Whisper of the Void");
    });

    it("GET /api/books/:id returns 200 with book", async () => {
      const response = await http.get<Book>("/books/64f1c2e5a1b2c3d4e5f6a001");

      expect(response.status).toBe(200);
      expect(response.data._id).toBe("64f1c2e5a1b2c3d4e5f6a001");
      expect(response.data.title).toBe("The Whisper of the Void");
    });

    it("POST /api/books returns 201 with created book", async () => {
      const response = await http.post<Book>("/books", {
        title: "The Forbidden Codex",
        author: "Elena Voss",
        genre: "Fantasy",
        synopsis: "A grimoire that writes itself.",
      });

      expect(response.status).toBe(201);
      expect(response.data.title).toBe("The Forbidden Codex");
      expect(response.data.author).toBe("Elena Voss");
      expect(response.data._id).toBeDefined();
      expect(response.data.createdAt).toBeDefined();
    });

    it("PATCH /api/books/:id returns 200 with updated book", async () => {
      const response = await http.patch<Book>("/books/64f1c2e5a1b2c3d4e5f6a001", {
        title: "The Whisper of the Void — Revised",
      });

      expect(response.status).toBe(200);
      expect(response.data.title).toBe("The Whisper of the Void — Revised");
      expect(response.data.author).toBe("Isabella Marchetti");
    });

    it("DELETE /api/books/:id returns 204", async () => {
      const response = await http.delete("/books/64f1c2e5a1b2c3d4e5f6a001");

      expect(response.status).toBe(204);
      expect(response.data === undefined || response.data === "").toBe(true);
    });
  });

  describe("Validation Errors (400)", () => {
    it("invalid ObjectId on GET /api/books/:id returns 400 Invalid ID", async () => {
      try {
        await http.get("/books/invalid-id");
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as { status: number; message: string; code: string };
        expect(apiError.status).toBe(400);
        expect(apiError.code).toBe("VALIDATION_ERROR");
        expect(apiError.message).toBe("Invalid ID");
      }
    });

    it("invalid ObjectId on PATCH /api/books/:id returns 400 Invalid ID", async () => {
      try {
        await http.patch("/books/not-a-valid-id", { title: "Updated" });
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as { status: number; message: string; code: string };
        expect(apiError.status).toBe(400);
        expect(apiError.code).toBe("VALIDATION_ERROR");
        expect(apiError.message).toBe("Invalid ID");
      }
    });

    it("invalid ObjectId on DELETE /api/books/:id returns 400 Invalid ID", async () => {
      try {
        await http.delete("/books/xyz123");
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as { status: number; message: string; code: string };
        expect(apiError.status).toBe(400);
        expect(apiError.code).toBe("VALIDATION_ERROR");
        expect(apiError.message).toBe("Invalid ID");
      }
    });

    it("invalid genre on GET /api/books returns 400 Invalid genre", async () => {
      try {
        await http.get("/books", { params: { genre: "InvalidGenre" } });
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as {
          status: number;
          message: string;
          code: string;
          details?: Record<string, string>;
        };
        expect(apiError.status).toBe(400);
        expect(apiError.code).toBe("VALIDATION_ERROR");
        expect(apiError.message).toBe("Validation failed");
        expect(apiError.details).toEqual({ genre: "Invalid genre" });
      }
    });

    it("invalid page (zero) on GET /api/books returns 400 Invalid page value", async () => {
      try {
        await http.get("/books", { params: { page: 0 } });
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as {
          status: number;
          message: string;
          code: string;
          details?: Record<string, string>;
        };
        expect(apiError.status).toBe(400);
        expect(apiError.code).toBe("VALIDATION_ERROR");
        expect(apiError.message).toBe("Validation failed");
        expect(apiError.details).toEqual({ page: "Invalid page value" });
      }
    });

    it("invalid page (negative) on GET /api/books returns 400 Invalid page value", async () => {
      try {
        await http.get("/books", { params: { page: -1 } });
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as {
          status: number;
          message: string;
          code: string;
          details?: Record<string, string>;
        };
        expect(apiError.status).toBe(400);
        expect(apiError.code).toBe("VALIDATION_ERROR");
        expect(apiError.message).toBe("Validation failed");
        expect(apiError.details).toEqual({ page: "Invalid page value" });
      }
    });

    it("invalid limit (over 100) on GET /api/books returns 400 Invalid limit value", async () => {
      try {
        await http.get("/books", { params: { limit: 101 } });
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as {
          status: number;
          message: string;
          code: string;
          details?: Record<string, string>;
        };
        expect(apiError.status).toBe(400);
        expect(apiError.code).toBe("VALIDATION_ERROR");
        expect(apiError.message).toBe("Validation failed");
        expect(apiError.details).toEqual({ limit: "Invalid limit value" });
      }
    });

    it("invalid limit (zero) on GET /api/books returns 400 Invalid limit value", async () => {
      try {
        await http.get("/books", { params: { limit: 0 } });
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as {
          status: number;
          message: string;
          code: string;
          details?: Record<string, string>;
        };
        expect(apiError.status).toBe(400);
        expect(apiError.code).toBe("VALIDATION_ERROR");
        expect(apiError.message).toBe("Validation failed");
        expect(apiError.details).toEqual({ limit: "Invalid limit value" });
      }
    });

    it("missing body on POST /api/books returns 400 Request body is missing", async () => {
      server.use(
        mswHttp.post("/api/books", () => {
          return new Response(null, { status: 400 });
        }),
      );

      try {
        await http.post("/books", null);
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as { status: number };
        expect(apiError.status).toBe(400);
      }
    });

    it("empty body on PATCH /api/books/:id returns 400 Request body is missing", async () => {
      try {
        await http.patch("/books/64f1c2e5a1b2c3d4e5f6a001", {});
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as { status: number; message: string; code: string };
        expect(apiError.status).toBe(400);
        expect(apiError.code).toBe("VALIDATION_ERROR");
        expect(apiError.message).toBe("Request body is missing");
      }
    });

    it("missing required fields on POST /api/books returns 400 Validation failed", async () => {
      try {
        await http.post("/books", { title: "Only Title" });
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as {
          status: number;
          message: string;
          code: string;
          details: Record<string, string>;
        };
        expect(apiError.status).toBe(400);
        expect(apiError.code).toBe("VALIDATION_ERROR");
        expect(apiError.message).toBe("Validation failed");
        expect(apiError.details).toBeDefined();
      }
    });

    it("invalid genre on POST /api/books returns 400 with genre error", async () => {
      try {
        await http.post("/books", {
          title: "Test",
          author: "Author",
          genre: "NotAGenre",
          synopsis: "Synopsis",
        });
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as {
          status: number;
          message: string;
          code: string;
          details: Record<string, string>;
        };
        expect(apiError.status).toBe(400);
        expect(apiError.code).toBe("VALIDATION_ERROR");
        expect(apiError.details?.genre).toBe("Invalid genre");
      }
    });

    it("invalid genre on PATCH /api/books/:id returns 400 with genre error", async () => {
      try {
        await http.patch("/books/64f1c2e5a1b2c3d4e5f6a001", { genre: "BadGenre" });
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as {
          status: number;
          message: string;
          code: string;
          details: Record<string, string>;
        };
        expect(apiError.status).toBe(400);
        expect(apiError.code).toBe("VALIDATION_ERROR");
        expect(apiError.details?.genre).toBe("Invalid genre");
      }
    });
  });

  describe("Not Found (404)", () => {
    it("valid ObjectId but non-existent on GET returns 404 Book not found", async () => {
      try {
        await http.get("/books/64f1c2e5a1b2c3d4e5f6a099");
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as { status: number; message: string; code: string };
        expect(apiError.status).toBe(404);
        expect(apiError.code).toBe("NOT_FOUND");
        expect(apiError.message).toBe("Book not found");
      }
    });

    it("valid ObjectId but non-existent on PATCH returns 404 Book not found", async () => {
      try {
        await http.patch("/books/64f1c2e5a1b2c3d4e5f6a099", { title: "Updated" });
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as { status: number; message: string; code: string };
        expect(apiError.status).toBe(404);
        expect(apiError.code).toBe("NOT_FOUND");
        expect(apiError.message).toBe("Book not found");
      }
    });

    it("valid ObjectId but non-existent on DELETE returns 404 Book not found", async () => {
      try {
        await http.delete("/books/64f1c2e5a1b2c3d4e5f6a099");
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as { status: number; message: string; code: string };
        expect(apiError.status).toBe(404);
        expect(apiError.code).toBe("NOT_FOUND");
        expect(apiError.message).toBe("Book not found");
      }
    });
  });

  describe("Conflict (409)", () => {
    it("duplicate title+author on POST returns 409 Book already exists.", async () => {
      try {
        await http.post("/books", {
          title: "The Whisper of the Void",
          author: "Isabella Marchetti",
          genre: "Horror",
          synopsis: "Duplicate.",
        });
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as { status: number; message: string; code: string };
        expect(apiError.status).toBe(409);
        expect(apiError.code).toBe("CONFLICT");
        expect(apiError.message).toBe("Book already exists.");
      }
    });

    it("duplicate title+author on PATCH returns 409 Book already exists.", async () => {
      try {
        await http.patch("/books/64f1c2e5a1b2c3d4e5f6a002", {
          title: "The Whisper of the Void",
          author: "Isabella Marchetti",
        });
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as { status: number; message: string; code: string };
        expect(apiError.status).toBe(409);
        expect(apiError.code).toBe("CONFLICT");
        expect(apiError.message).toBe("Book already exists.");
      }
    });
  });

  describe("Server Error (500)", () => {
    it("simulated handler failure returns 500 Internal Server Error", async () => {
      server.use(mswHttp.get("/api/books", () => internalError()));

      try {
        await http.get("/books");
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const apiError = error as { status: number; message: string; code: string };
        expect(apiError.status).toBe(500);
        expect(apiError.code).toBe("INTERNAL_ERROR");
        expect(apiError.message).toBe("Internal Server Error");
      }
    });
  });

  describe("Pagination", () => {
    it("default page=1 limit=10 returns all seed books", async () => {
      const response = await http.get<PaginatedResponse<Book>>("/books");

      expect(response.data.pagination.page).toBe(1);
      expect(response.data.pagination.limit).toBe(10);
      expect(response.data.pagination.total).toBe(5);
      expect(response.data.data).toHaveLength(5);
    });

    it("page=1 limit=2 returns first 2 books with correct metadata", async () => {
      const response = await http.get<PaginatedResponse<Book>>("/books", {
        params: { page: 1, limit: 2 },
      });

      expect(response.data.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
      expect(response.data.data).toHaveLength(2);
    });

    it("page=3 limit=2 returns last book with correct metadata", async () => {
      const response = await http.get<PaginatedResponse<Book>>("/books", {
        params: { page: 3, limit: 2 },
      });

      expect(response.data.pagination).toEqual({
        page: 3,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
      expect(response.data.data).toHaveLength(1);
    });

    it("page beyond totalPages returns 200 with empty data", async () => {
      const response = await http.get<PaginatedResponse<Book>>("/books", {
        params: { page: 100, limit: 10 },
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toHaveLength(0);
      expect(response.data.pagination.total).toBe(5);
      expect(response.data.pagination.totalPages).toBe(1);
    });
  });

  describe("Sorting", () => {
    it("results are always sorted by title ascending regardless of insertion order", async () => {
      const response = await http.get<PaginatedResponse<Book>>("/books");

      const titles = response.data.data.map((b) => b.title);
      const sorted = [...titles].sort((a, b) => a.localeCompare(b));
      expect(titles).toEqual(sorted);
    });
  });
});
