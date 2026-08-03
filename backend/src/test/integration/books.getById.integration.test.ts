import { testRequest } from "../helpers/request";
import { seedBooks } from "../helpers/database";
import { createBookModel } from "../helpers/factories";
import { expectNotFoundError } from "../helpers/assertions";

describe("GET /api/books/:id", () => {
  it("TC-H5-001: return 200 OK with the existing book", async () => {
    const [book] = await seedBooks([createBookModel()]);

    const res = await testRequest.get(`/api/books/${book._id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: book.title, author: book.author });
  });

  it("TC-H5-003: return 404 NotFound for a valid non-existent ObjectId", async () => {
    const res = await testRequest.get("/api/books/66f000000000000000000000");

    expectNotFoundError(res);
  });
});
