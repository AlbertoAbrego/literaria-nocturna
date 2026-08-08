import { testRequest } from "../helpers/request";
import { seedBooks } from "../helpers/database";
import { createBookModel } from "../helpers/factories";
import { expectNotFoundError } from "../helpers/assertions";
import { BookModel } from "../../models/book.model";

describe("DELETE /api/books/:id", () => {
  it("TC-H7-001: delete an existing book and respond with status 204 No Content", async () => {
    const [book] = await seedBooks([createBookModel()]);

    const res = await testRequest.delete(`/api/books/${book._id}`);

    expect(res.status).toBe(204);
  });

  it("TC-H7-002: reject an invalid ObjectId with 400 Bad Request", async () => {
    const res = await testRequest.delete("/api/books/not-an-id");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      message: "Invalid ID",
      code: "VALIDATION_ERROR",
    });
  });

  it("TC-H7-003: return 404 NotFound for a valid non-existent ObjectId", async () => {
    const res = await testRequest.delete("/api/books/66f000000000000000000000");

    expectNotFoundError(res);
  });

  it("TC-H7-004: deleted book cannot be retrieved afterwards", async () => {
    const [book] = await seedBooks([createBookModel()]);

    await testRequest.delete(`/api/books/${book._id}`);

    const res = await testRequest.get(`/api/books/${book._id}`);

    expectNotFoundError(res);
  });

  it("TC-H7-005: return 500 Internal Server Error on a database failure", async () => {
    const [book] = await seedBooks([createBookModel()]);
    const spy = jest
      .spyOn(BookModel, "findByIdAndDelete")
      .mockRejectedValueOnce(new Error("Database failure"));

    const res = await testRequest.delete(`/api/books/${book._id}`);

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      message: "Internal Server Error",
      code: "INTERNAL_ERROR",
    });

    spy.mockRestore();
  });
});