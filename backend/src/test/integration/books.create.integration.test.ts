import { testRequest } from "../helpers/request";
import { seedBooks } from "../helpers/database";
import { createBookDto, createBookModel } from "../helpers/factories";
import { expectConflictError, expectValidationError } from "../helpers/assertions";
import type { CreateBookDto } from "../../dto/book/create-book.dto";

describe("POST /api/books", () => {
  it("TC-H2-001: create a valid book and respond with status 201 Created", async () => {
    const dto = createBookDto();
    const res = await testRequest.post("/api/books").send(dto);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(dto);
    expect(res.body._id).toBeDefined();
  });

  it("TC-H2-008: reject a duplicate of title + author with 409 Conflict", async () => {
    const dto = createBookDto({ title: "Duplicate Title", author: "Duplicate Author" });
    await seedBooks([createBookModel({ title: "Duplicate Title", author: "Duplicate Author" })]);

    const res = await testRequest.post("/api/books").send(dto);

    expectConflictError(res);
  });

  it("TC-H2-002: reject a book without title with 400 Bad Request", async () => {
    const dto: Partial<CreateBookDto> = createBookDto();
    delete dto.title;

    const res = await testRequest.post("/api/books").send(dto);

    expectValidationError(res);
  });

  describe("data integrity - unique constraint (title, author)", () => {
    it("TC-H5-001: same title with different author succeeds", async () => {
      await seedBooks([createBookModel({ title: "Same Title", author: "Author One" })]);

      const res = await testRequest.post("/api/books").send(createBookDto({ title: "Same Title", author: "Author Two" }));

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Same Title");
      expect(res.body.author).toBe("Author Two");
    });

    it("TC-H5-002: same author with different title succeeds", async () => {
      await seedBooks([createBookModel({ title: "Title One", author: "Same Author" })]);

      const res = await testRequest.post("/api/books").send(createBookDto({ title: "Title Two", author: "Same Author" }));

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Title Two");
      expect(res.body.author).toBe("Same Author");
    });

    it("TC-H5-003: duplicate title + author returns 409 CONFLICT", async () => {
      await seedBooks([createBookModel({ title: "Duplicate Title", author: "Duplicate Author" })]);

      const res = await testRequest.post("/api/books").send(createBookDto({ title: "Duplicate Title", author: "Duplicate Author" }));

      expectConflictError(res);
    });

    it("TC-H5-004: concurrent duplicate creation returns 409 for second request", async () => {
      const dto = createBookDto({ title: "Concurrent Title", author: "Concurrent Author" });

      const [res1, res2] = await Promise.all([
        testRequest.post("/api/books").send(dto),
        testRequest.post("/api/books").send(dto),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([201, 409]);
      const conflictRes = res1.status === 409 ? res1 : res2;
      expectConflictError(conflictRes);
    });
  });
});
