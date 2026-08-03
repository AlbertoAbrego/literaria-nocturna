import { testRequest } from "../helpers/request";
import { seedBooks } from "../helpers/database";
import { createBookDto, createBookModel } from "../helpers/factories";
import { expectConflictError, expectValidationError } from "../helpers/assertions";
import type { CreateBookDto } from "../../dto/book/create-book.dto";

describe("POST /api/books", () => {
  it("TC-H2-001: create a valid book and respond with status 201 Created", async () => {
    const res = await testRequest.post("/api/books").send(createBookDto());

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(createBookDto());
    expect(res.body._id).toBeDefined();
  });

  it("TC-H2-008: reject a duplicate of title + author with 409 Conflict", async () => {
    await seedBooks([createBookModel()]);

    const res = await testRequest.post("/api/books").send(createBookDto());

    expectConflictError(res);
  });

  it("TC-H2-002: reject a book without title with 400 Bad Request", async () => {
    const dto: Partial<CreateBookDto> = createBookDto();
    delete dto.title;

    const res = await testRequest.post("/api/books").send(dto);

    expectValidationError(res);
  });
});
