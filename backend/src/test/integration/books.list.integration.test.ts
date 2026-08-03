import { testRequest } from "../helpers/request";
import { seedBooks } from "../helpers/database";
import { createBookModel } from "../helpers/factories";

describe("GET /api/books", () => {
  it("TC-H4-001: devuelve 200 OK con la lista de libros", async () => {
    await seedBooks([
      createBookModel(),
      createBookModel({ title: "Dune", author: "Frank Herbert" }),
    ]);

    const res = await testRequest.get("/api/books");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("TC-H4-002: devuelve 200 OK con una lista vacía si no hay libros", async () => {
    const res = await testRequest.get("/api/books");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
