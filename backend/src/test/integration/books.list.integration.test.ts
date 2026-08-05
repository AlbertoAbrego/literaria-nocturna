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
    expect(res.body).toHaveLength(2);
  });

  it("TC-H4-002: return 200 OK with an empty list if there are no books", async () => {
    const res = await testRequest.get("/api/books");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("TC-H8-001: filter by genre", async () => {
    await seedBooks([
      createBookModel({ title: "Cujo", genre: Genre.Horror }),
      createBookModel({ title: "Dune", genre: Genre.ScienceFiction }),
      createBookModel({ title: "El Principito", genre: Genre.Fantasy }),
    ]);

    const res = await testRequest.get("/api/books").query({ genre: Genre.Horror });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe("Cujo");
  });

  it("TC-H8-002: filter by author with partial and case-insensitive match", async () => {
    await seedBooks([
      createBookModel({ title: "Dune", author: "Frank Herbert" }),
      createBookModel({ title: "El Principito", author: "Antoine de Saint-Exupéry" }),
    ]);

    const res = await testRequest.get("/api/books").query({ author: "herbert" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].author).toBe("Frank Herbert");
  });

  it("TC-H8-003: filter by title with partial and case-insensitive match", async () => {
    await seedBooks([
      createBookModel({ title: "Dune", author: "Frank Herbert" }),
      createBookModel({ title: "Dune Messiah", author: "Frank Herbert" }),
      createBookModel({ title: "El Principito", author: "Antoine de Saint-Exupéry" }),
    ]);

    const res = await testRequest.get("/api/books").query({ title: "dune" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
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
    expect(res.body).toHaveLength(2);
  });

  it("TC-H8-005: return an empty array when no books match the filters", async () => {
    await seedBooks([
      createBookModel({ title: "Dune", author: "Frank Herbert", genre: Genre.ScienceFiction }),
    ]);

    const res = await testRequest.get("/api/books").query({ title: "Inexistente" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
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
});
