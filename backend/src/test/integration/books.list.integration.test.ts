import { testRequest } from "../helpers/request";
import { seedBooks } from "../helpers/database";
import { createBookModel } from "../helpers/factories";
import { BookModel } from "../../models/book.model";

describe("GET /api/books", () => {
  it("TC-H4-001: return 200 OK with the list of books", async () => {
    await seedBooks([
      createBookModel(),
      createBookModel({ title: "Dune", author: "Frank Herbert" }),
    ]);

    const res = await testRequest.get("/api/books");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("TC-H4-002: return 200 OK with an empty list if there are no books", async () => {
    const res = await testRequest.get("/api/books");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("TC-H8-001: filter by genre", async () => {
    await seedBooks([
      createBookModel({ title: "Cujo", genre: "Horror" }),
      createBookModel({ title: "Dune", genre: "Science Fiction" }),
      createBookModel({ title: "El Principito", genre: "Fantasy" }),
    ]);

    const res = await testRequest.get("/api/books").query({ genre: "Horror" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe("Cujo");
  });

  it("TC-H8-002: filter by author with partial and case-insensitive match", async () => {
    await seedBooks([
      createBookModel({ title: "Dune", author: "Frank Herbert" }),
      createBookModel({ title: "El Principito", author: "Antoine de Saint-Exupéry" }),
    ]);

    const res = await testRequest.get("/api/books").query({ author: "herbert" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].author).toBe("Frank Herbert");
  });

  it("TC-H8-003: filter by title with partial and case-insensitive match", async () => {
    await seedBooks([
      createBookModel({ title: "Dune", author: "Frank Herbert" }),
      createBookModel({ title: "Dune Messiah", author: "Frank Herbert" }),
      createBookModel({ title: "El Principito", author: "Antoine de Saint-Exupéry" }),
    ]);

    const res = await testRequest.get("/api/books").query({ title: "dune" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("TC-H8-004: combine multiple filters", async () => {
    await seedBooks([
      createBookModel({ title: "Dune", author: "Frank Herbert", genre: "Science Fiction" }),
      createBookModel({ title: "Dune Messiah", author: "Frank Herbert", genre: "Science Fiction" }),
      createBookModel({ title: "Dune", author: "Otro Autor", genre: "Science Fiction" }),
    ]);

    const res = await testRequest
      .get("/api/books")
      .query({ genre: "Science Fiction", author: "Frank Herbert", title: "dune" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("TC-H8-005: return an empty array when no books match the filters", async () => {
    await seedBooks([
      createBookModel({ title: "Dune", author: "Frank Herbert", genre: "Science Fiction" }),
    ]);

    const res = await testRequest.get("/api/books").query({ title: "Inexistente" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("TC-H8-006: reject an invalid genre with 400 Bad Request", async () => {
    const res = await testRequest.get("/api/books").query({ genre: "Misterio" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details: { genre: "Invalid genre" },
    });
  });

  it("TC-H8-007: return 500 Internal Server Error on database failure", async () => {
    jest.spyOn(BookModel, "find").mockReturnValueOnce({
      sort: jest.fn().mockRejectedValueOnce(new Error("DB down")),
    } as unknown as ReturnType<typeof BookModel.find>);

    const res = await testRequest.get("/api/books");

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      message: "Internal Server Error",
      code: "INTERNAL_ERROR",
    });

    jest.restoreAllMocks();
  });

  describe("search special characters", () => {
    const specialChars = [".", "-", "?", "(", ")", "[", "]", "{", "}", "|", "^", "$", "\\"];

    beforeEach(async () => {
      await seedBooks([
        createBookModel({ title: "Test.Book", author: "Author-One" }),
        createBookModel({ title: "Another (Book)", author: "Author.Two" }),
        createBookModel({ title: "Book[1]", author: "Author|Three" }),
        createBookModel({ title: "Normal Title", author: "Normal Author" }),
      ]);
    });

    it.each(specialChars)(
      "TC-H8-008: search with special character '%s' does not break request",
      async (char) => {
        const res = await testRequest.get("/api/books").query({ title: char });

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
      },
    );

    it("TC-H8-009: search with special characters maintains partial matching", async () => {
      const res = await testRequest.get("/api/books").query({ title: "Test" });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some((b: { title: string }) => b.title.includes("Test"))).toBe(true);
    });

    it("TC-H8-010: search with special characters maintains case-insensitive matching", async () => {
      const res = await testRequest.get("/api/books").query({ title: "test.book" });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(
        res.body.data.some((b: { title: string }) => b.title.toLowerCase().includes("test")),
      ).toBe(true);
    });

    it("TC-H8-011: normal text searches work correctly", async () => {
      const res = await testRequest.get("/api/books").query({ title: "Normal" });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe("Normal Title");
    });
  });

  describe("pagination with filters", () => {
    it("TC-H9-010: pagination metadata is correct with active genre filter", async () => {
      await seedBooks([
        createBookModel({ title: "A", genre: "Horror" }),
        createBookModel({ title: "B", genre: "Horror" }),
        createBookModel({ title: "C", genre: "Fantasy" }),
        createBookModel({ title: "D", genre: "Fantasy" }),
        createBookModel({ title: "E", genre: "Fantasy" }),
      ]);

      const res = await testRequest.get("/api/books").query({ genre: "Horror", page: 1, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 2,
        totalPages: 1,
      });
    });

    it("TC-H9-011: pagination metadata is correct with active author filter", async () => {
      await seedBooks([
        createBookModel({ title: "A", author: "Author One" }),
        createBookModel({ title: "B", author: "Author One" }),
        createBookModel({ title: "C", author: "Author Two" }),
      ]);

      const res = await testRequest
        .get("/api/books")
        .query({ author: "Author One", page: 1, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 2,
        totalPages: 1,
      });
    });

    it("TC-H9-012: pagination metadata is correct with active title filter", async () => {
      await seedBooks([
        createBookModel({ title: "Book Alpha" }),
        createBookModel({ title: "Book Beta" }),
        createBookModel({ title: "Other Gamma" }),
      ]);

      const res = await testRequest.get("/api/books").query({ title: "Book", page: 1, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 2,
        totalPages: 1,
      });
    });

    it("TC-H9-013: pagination metadata correct with combined filters", async () => {
      await seedBooks([
        createBookModel({ title: "Book A", author: "Author X", genre: "Horror" }),
        createBookModel({ title: "Book B", author: "Author X", genre: "Horror" }),
        createBookModel({ title: "Book C", author: "Author Y", genre: "Horror" }),
        createBookModel({ title: "Book D", author: "Author X", genre: "Fantasy" }),
      ]);

      const res = await testRequest
        .get("/api/books")
        .query({ genre: "Horror", author: "Author X", page: 1, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 2,
        totalPages: 1,
      });
    });

    it("TC-H9-014: empty page beyond totalPages returns correct metadata with filters", async () => {
      await seedBooks([
        createBookModel({ title: "A", genre: "Horror" }),
        createBookModel({ title: "B", genre: "Horror" }),
      ]);

      const res = await testRequest
        .get("/api/books")
        .query({ genre: "Horror", page: 10, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination).toEqual({
        page: 10,
        limit: 2,
        total: 2,
        totalPages: 1,
      });
    });
  });

  describe("TC-H9-001: pagination", () => {
    it("retrieve the first page", async () => {
      await seedBooks([
        createBookModel({ title: "A" }),
        createBookModel({ title: "B" }),
        createBookModel({ title: "C" }),
      ]);

      const res = await testRequest.get("/api/books").query({ page: 1, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].title).toBe("A");
    });

    it("TC-H9-002: retrieve a middle page", async () => {
      await seedBooks([
        createBookModel({ title: "A" }),
        createBookModel({ title: "B" }),
        createBookModel({ title: "C" }),
        createBookModel({ title: "D" }),
      ]);

      const res = await testRequest.get("/api/books").query({ page: 2, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].title).toBe("C");
    });

    it("TC-H9-003: retrieve the last page", async () => {
      await seedBooks([
        createBookModel({ title: "A" }),
        createBookModel({ title: "B" }),
        createBookModel({ title: "C" }),
        createBookModel({ title: "D" }),
        createBookModel({ title: "E" }),
      ]);

      const res = await testRequest.get("/api/books").query({ page: 3, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe("E");
    });

    it("TC-H9-004: retrieve an empty page beyond the total number of pages", async () => {
      await seedBooks([createBookModel({ title: "A" }), createBookModel({ title: "B" })]);

      const res = await testRequest.get("/api/books").query({ page: 10, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("TC-H9-005: use default pagination when parameters are omitted", async () => {
      await seedBooks([
        createBookModel({ title: "A" }),
        createBookModel({ title: "B" }),
        createBookModel({ title: "C" }),
        createBookModel({ title: "D" }),
        createBookModel({ title: "E" }),
        createBookModel({ title: "F" }),
        createBookModel({ title: "G" }),
        createBookModel({ title: "H" }),
        createBookModel({ title: "I" }),
        createBookModel({ title: "J" }),
        createBookModel({ title: "K" }),
      ]);

      const res = await testRequest.get("/api/books");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(10);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
    });

    it.each([
      ["negative", "-1"],
      ["zero", "0"],
      ["non-numeric", "abc"],
    ])("TC-H9-006: invalid page (%s) returns 400 Bad Request", async (_label, page) => {
      const res = await testRequest.get("/api/books").query({ page });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: { page: "Invalid page value" },
      });
    });

    it.each([
      ["negative", "-1"],
      ["zero", "0"],
      ["too large", "101"],
      ["non-numeric", "abc"],
    ])("TC-H9-007: invalid limit (%s) returns 400 Bad Request", async (_label, limit) => {
      const res = await testRequest.get("/api/books").query({ limit });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: { limit: "Invalid limit value" },
      });
    });

    it("TC-H9-008: pagination metadata is returned correctly", async () => {
      await seedBooks([
        createBookModel({ title: "A" }),
        createBookModel({ title: "B" }),
        createBookModel({ title: "C" }),
        createBookModel({ title: "D" }),
        createBookModel({ title: "E" }),
        createBookModel({ title: "F" }),
        createBookModel({ title: "G" }),
        createBookModel({ title: "H" }),
        createBookModel({ title: "I" }),
        createBookModel({ title: "J" }),
        createBookModel({ title: "K" }),
      ]);

      const res = await testRequest.get("/api/books").query({ page: 2, limit: 4 });

      expect(res.status).toBe(200);
      expect(res.body.pagination).toEqual({
        page: 2,
        limit: 4,
        total: 11,
        totalPages: 3,
      });
    });

    it("TC-H9-009: return 500 Internal Server Error on database failure during pagination", async () => {
      jest.spyOn(BookModel, "countDocuments").mockRejectedValueOnce(new Error("DB down"));

      const res = await testRequest.get("/api/books");

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        message: "Internal Server Error",
        code: "INTERNAL_ERROR",
      });

      jest.restoreAllMocks();
    });
  });
});
