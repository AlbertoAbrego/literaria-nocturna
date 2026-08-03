import { testRequest } from "../helpers/request";
import { seedBooks } from "../helpers/database";
import { createBookModel } from "../helpers/factories";

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
});
