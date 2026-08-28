import { testRequest } from "../helpers/request";
import { createBookDto } from "../helpers/factories";
import { expectValidationError } from "../helpers/assertions";

describe("Validation integration — field-level details", () => {
  describe("POST /api/books — CreateBookDto", () => {
    it("reject empty body with details.body", async () => {
      const res = await testRequest.post("/api/books").send({});
      expectValidationError(res);
      expect(res.body.details).toEqual({ body: "Request body is missing" });
    });

    it("reject missing title with details.title", async () => {
      const dto = createBookDto();
      const { title, ...rest } = dto;
      void title;
      const res = await testRequest.post("/api/books").send(rest);
      expectValidationError(res);
      expect(res.body.details).toHaveProperty("title");
    });

    it("reject missing author with details.author", async () => {
      const dto = createBookDto();
      const { author, ...rest } = dto;
      void author;
      const res = await testRequest.post("/api/books").send(rest);
      expectValidationError(res);
      expect(res.body.details).toHaveProperty("author");
    });

    it("reject missing genre with details.genre", async () => {
      const dto = createBookDto();
      const { genre, ...rest } = dto;
      void genre;
      const res = await testRequest.post("/api/books").send(rest);
      expectValidationError(res);
      expect(res.body.details).toHaveProperty("genre");
    });

    it("reject missing synopsis with details.synopsis", async () => {
      const dto = createBookDto();
      const { synopsis, ...rest } = dto;
      void synopsis;
      const res = await testRequest.post("/api/books").send(rest);
      expectValidationError(res);
      expect(res.body.details).toHaveProperty("synopsis");
    });

    it("reject multiple missing fields with all field keys in details", async () => {
      const res = await testRequest.post("/api/books").send({ title: "Only Title" });
      expectValidationError(res);
      const details = res.body.details as Record<string, string>;
      expect(Object.keys(details)).toEqual(expect.arrayContaining(["author", "genre", "synopsis"]));
      expect(details).not.toHaveProperty("title");
    });

    it("reject invalid genre with details.genre", async () => {
      const res = await testRequest.post("/api/books").send({
        ...createBookDto(),
        genre: "Misterio",
      });
      expectValidationError(res);
      expect(res.body.details).toEqual({ genre: "Invalid genre" });
    });

    it("reject empty string title with details.title", async () => {
      const dto = createBookDto({ title: "" });
      const res = await testRequest.post("/api/books").send(dto);
      expectValidationError(res);
      expect(res.body.details).toHaveProperty("title");
    });

    it("reject empty string author with details.author", async () => {
      const dto = createBookDto({ author: "" });
      const res = await testRequest.post("/api/books").send(dto);
      expectValidationError(res);
      expect(res.body.details).toHaveProperty("author");
    });

    it("reject empty string genre with details.genre", async () => {
      const res = await testRequest.post("/api/books").send({
        ...createBookDto(),
        genre: "",
      });
      expectValidationError(res);
      expect(res.body.details).toEqual({ genre: "genre is required" });
    });

    it("reject empty string synopsis with details.synopsis", async () => {
      const dto = createBookDto({ synopsis: "" });
      const res = await testRequest.post("/api/books").send(dto);
      expectValidationError(res);
      expect(res.body.details).toHaveProperty("synopsis");
    });

    it("ignore extra fields and create successfully", async () => {
      const dto = createBookDto();
      const res = await testRequest.post("/api/books").send({
        ...dto,
        unknownField: "should be ignored",
      });
      expect(res.status).toBe(201);
    });
  });

  describe("PATCH /api/books/:id — UpdateBookDto", () => {
    let bookId: string;

    beforeEach(async () => {
      const res = await testRequest.post("/api/books").send(createBookDto());
      bookId = res.body._id as string;
    });

    it("reject empty body with details.body", async () => {
      const res = await testRequest.patch(`/api/books/${bookId}`).send({});
      expectValidationError(res);
      expect(res.body.details).toEqual({ body: "Request body is missing" });
    });

    it("reject invalid genre with details.genre", async () => {
      const res = await testRequest.patch(`/api/books/${bookId}`).send({ genre: "Invalid" });
      expectValidationError(res);
      expect(res.body.details).toEqual({ genre: "Invalid genre" });
    });

    it("ignore extra fields and update successfully", async () => {
      const res = await testRequest
        .patch(`/api/books/${bookId}`)
        .send({ title: "Updated", rogue: true });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Updated");
      expect(res.body).not.toHaveProperty("rogue");
    });

    it("allow partial updates without triggering missing field errors", async () => {
      const res = await testRequest
        .patch(`/api/books/${bookId}`)
        .send({ title: "Only Title Changed" });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Only Title Changed");
    });
  });

  describe("GET /api/books — BookQueryDto", () => {
    it("reject invalid genre query param with details.genre", async () => {
      const res = await testRequest.get("/api/books?genre=NoExistent");
      expectValidationError(res);
      expect(res.body.details).toEqual({ genre: "Invalid genre" });
    });

    it("reject invalid page with details.page", async () => {
      const res = await testRequest.get("/api/books?page=abc");
      expectValidationError(res);
      expect(res.body.details).toHaveProperty("page");
    });

    it("reject invalid limit with details.limit", async () => {
      const res = await testRequest.get("/api/books?limit=0");
      expectValidationError(res);
      expect(res.body.details).toHaveProperty("limit");
    });

    it("reject multiple invalid params with all field keys in details", async () => {
      const res = await testRequest.get("/api/books?genre=Nope&page=-1&limit=abc");
      expectValidationError(res);
      const details = res.body.details as Record<string, string>;
      expect(Object.keys(details)).toEqual(expect.arrayContaining(["genre", "page", "limit"]));
    });

    it("accept valid params without error", async () => {
      const res = await testRequest.get("/api/books?genre=Fantasy&page=1&limit=10");
      expect(res.status).toBe(200);
    });

    it("accept empty query string without error", async () => {
      const res = await testRequest.get("/api/books");
      expect(res.status).toBe(200);
    });

    it("reject page=0 with details.page", async () => {
      const res = await testRequest.get("/api/books?page=0");
      expectValidationError(res);
      expect(res.body.details).toHaveProperty("page");
    });

    it("reject negative limit with details.limit", async () => {
      const res = await testRequest.get("/api/books?limit=-5");
      expectValidationError(res);
      expect(res.body.details).toHaveProperty("limit");
    });

    it("reject limit=101 with details.limit", async () => {
      const res = await testRequest.get("/api/books?limit=101");
      expectValidationError(res);
      expect(res.body.details).toHaveProperty("limit");
    });

    it("accept limit at boundary (100)", async () => {
      const res = await testRequest.get("/api/books?limit=100");
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/books/:id — ObjectId validation", () => {
    it("reject invalid ObjectId format with 400", async () => {
      const res = await testRequest.get("/api/books/not-a-valid-id");
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        message: "Invalid ID",
        code: "VALIDATION_ERROR",
      });
    });

    it("reject short hex string with 400", async () => {
      const res = await testRequest.get("/api/books/abc123");
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("reject hex string with special characters with 400", async () => {
      const res = await testRequest.get("/api/books/00000000000000000000000!");
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("DELETE /api/books/:id — ObjectId validation", () => {
    it("reject invalid ObjectId format with 400", async () => {
      const res = await testRequest.delete("/api/books/invalid");
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        message: "Invalid ID",
        code: "VALIDATION_ERROR",
      });
    });
  });

  describe("PATCH /api/books/:id — ObjectId validation", () => {
    it("reject invalid ObjectId format with 400", async () => {
      const res = await testRequest.patch("/api/books/not-valid").send({ title: "Test" });
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        message: "Invalid ID",
        code: "VALIDATION_ERROR",
      });
    });
  });
});
