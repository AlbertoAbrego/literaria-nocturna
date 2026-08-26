import { testRequest } from "../helpers/request";
import { seedBooks } from "../helpers/database";
import { createBookDto, createBookModel } from "../helpers/factories";
import {
  expectConflictError,
  expectNotFoundError,
  expectValidationError,
} from "../helpers/assertions";

describe("PATCH /api/books/:id", () => {
  it("TC-H6-001: update an existing book and respond with status 200 OK", async () => {
    const [book] = await seedBooks([createBookModel()]);

    const res = await testRequest
      .patch(`/api/books/${book._id}`)
      .send(createBookDto({ title: "Nuevo Título" }));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: "Nuevo Título" });
  });

  it("TC-H6-002: partially update a book and keep the other fields", async () => {
    const [book] = await seedBooks([createBookModel()]);

    const res = await testRequest
      .patch(`/api/books/${book._id}`)
      .send({ synopsis: "Una nueva sinopsis." });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      title: book.title,
      author: book.author,
      synopsis: "Una nueva sinopsis.",
    });
  });

  it("TC-H6-003: reject an invalid ObjectId with 400 Bad Request", async () => {
    const res = await testRequest.patch("/api/books/not-an-id").send(createBookDto());

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      message: "Invalid ID",
      code: "VALIDATION_ERROR",
    });
  });

  it("TC-H6-004: reject an invalid genre with 400 Bad Request", async () => {
    const [book] = await seedBooks([createBookModel()]);

    const res = await testRequest
      .patch(`/api/books/${book._id}`)
      .send({ genre: "Misterio" });

    expectValidationError(res);
  });

  it("TC-H6-005: reject an empty request body with 400 Bad Request", async () => {
    const [book] = await seedBooks([createBookModel()]);

    const res = await testRequest.patch(`/api/books/${book._id}`).send({});

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      message: "Request body is missing",
      code: "VALIDATION_ERROR",
    });
  });

  it("TC-H6-006: return 404 NotFound for a valid non-existent ObjectId", async () => {
    const res = await testRequest
      .patch("/api/books/66f000000000000000000000")
      .send(createBookDto());

    expectNotFoundError(res);
  });

  it("TC-H6-007: reject a duplicate title + author with 409 Conflict", async () => {
    const [bookA] = await seedBooks([createBookModel({ title: "Unique Title", author: "Unique Author" })]);
    const [bookB] = await seedBooks([createBookModel({ title: "Different Title", author: "Different Author" })]);

    const res = await testRequest
      .patch(`/api/books/${bookB._id}`)
      .send({ title: bookA.title, author: bookA.author });

    expectConflictError(res);
  });
});
