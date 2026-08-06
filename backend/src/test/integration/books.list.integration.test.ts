import { testRequest } from "../helpers/request";
import { seedBooks } from "../helpers/database";
import { createBookModel } from "../helpers/factories";
import { BookModel } from "../../models/book.model";
import { Genre } from "../../models/book.model";

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
      createBookModel({ title: "Cujo", genre: Genre.Horror }),
      createBookModel({ title: "Dune", genre: Genre.ScienceFiction }),
      createBookModel({ title: "El Principito", genre: Genre.Fantasy }),
    ]);

    const res = await testRequest.get("/api/books").query({ genre: Genre.Horror });

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
      createBookModel({ title: "Dune", author: "Frank Herbert", genre: Genre.ScienceFiction }),
      createBookModel({ title: "Dune Messiah", author: "Frank Herbert", genre: Genre.ScienceFiction }),
      createBookModel({ title: "Dune", author: "Otro Autor", genre: Genre.ScienceFiction }),
    ]);

    const res = await testRequest
      .get("/api/books")
      .query({ genre: Genre.ScienceFiction, author: "Frank Herbert", title: "dune" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("TC-H8-005: return an empty array when no books match the filters", async () => {
    await seedBooks([
      createBookModel({ title: "Dune", author: "Frank Herbert", genre: Genre.ScienceFiction }),
    ]);

    const res = await testRequest.get("/api/books").query({ title: "Inexistente" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("TC-H8-006: reject an invalid genre with 400 Bad Request", async () => {
    const res = await testRequest.get("/api/books").query({ genre: "Misterio" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid genre");
  });

  it("TC-H8-007: return 500 Internal Server Error on database failure", async () => {
    jest.spyOn(BookModel, "find").mockReturnValueOnce({
      sort: jest.fn().mockRejectedValueOnce(new Error("DB down")),
    } as unknown as ReturnType<typeof BookModel.find>);

    const res = await testRequest.get("/api/books");

    expect(res.status).toBe(500);

    jest.restoreAllMocks();
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
      await seedBooks([
        createBookModel({ title: "A" }),
        createBookModel({ title: "B" }),
      ]);

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
      expect(res.body.message).toBe("Invalid page value");
    });

    it.each([
      ["negative", "-1"],
      ["zero", "0"],
      ["too large", "101"],
      ["non-numeric", "abc"],
    ])("TC-H9-007: invalid limit (%s) returns 400 Bad Request", async (_label, limit) => {
      const res = await testRequest.get("/api/books").query({ limit });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid limit value");
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

      jest.restoreAllMocks();
    });
  });
});
