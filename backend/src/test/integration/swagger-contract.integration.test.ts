import { testRequest } from "../helpers/request";
import { GENRES } from "../../constants/genres";

describe("Swagger contract verification", () => {
  let spec: Record<string, unknown>;

  beforeAll(async () => {
    const res = await testRequest.get("/api/docs/swagger.json");
    expect(res.status).toBe(200);
    spec = res.body;
  });

  describe("spec structure", () => {
    it("serves a valid OpenAPI 3.0 document", () => {
      expect(spec.openapi).toBe("3.0.0");
      expect(spec.info).toBeDefined();
      expect((spec.info as Record<string, unknown>).title).toBe("Literaria Nocturna API");
    });

    it("defines all five book endpoints", () => {
      const paths = spec.paths as Record<string, Record<string, unknown>>;
      expect(paths["/books"]).toBeDefined();
      expect(paths["/books/{id}"]).toBeDefined();

      const booksMethods = Object.keys(paths["/books"]);
      expect(booksMethods).toContain("get");
      expect(booksMethods).toContain("post");

      const booksIdMethods = Object.keys(paths["/books/{id}"]);
      expect(booksIdMethods).toContain("get");
      expect(booksIdMethods).toContain("patch");
      expect(booksIdMethods).toContain("delete");
    });
  });

  describe("Genre enum", () => {
    it("Genre enum in spec matches backend constants", () => {
      const schemas = (spec.components as Record<string, Record<string, unknown>>).schemas;
      const genreSchema = schemas.Genre as Record<string, unknown>;
      expect(genreSchema.type).toBe("string");
      expect(genreSchema.enum).toEqual([...GENRES]);
    });
  });

  describe("schemas", () => {
    it("Book schema has all required fields", () => {
      const schemas = (spec.components as Record<string, Record<string, unknown>>).schemas;
      const bookSchema = schemas.Book as Record<string, unknown>;
      expect(bookSchema.required).toEqual(
        expect.arrayContaining([
          "_id",
          "title",
          "author",
          "genre",
          "synopsis",
          "createdAt",
          "updatedAt",
        ]),
      );
    });

    it("CreateBookDto schema has all required fields", () => {
      const schemas = (spec.components as Record<string, Record<string, unknown>>).schemas;
      const dto = schemas.CreateBookDto as Record<string, unknown>;
      expect(dto.required).toEqual(
        expect.arrayContaining(["title", "author", "genre", "synopsis"]),
      );
    });

    it("UpdateBookDto schema has no required fields (all optional)", () => {
      const schemas = (spec.components as Record<string, Record<string, unknown>>).schemas;
      const dto = schemas.UpdateBookDto as Record<string, unknown>;
      expect(dto.required).toBeUndefined();
    });

    it("PaginatedResponse schema has data and pagination", () => {
      const schemas = (spec.components as Record<string, Record<string, unknown>>).schemas;
      const paginated = schemas.PaginatedResponse as Record<string, unknown>;
      expect(paginated.required).toEqual(expect.arrayContaining(["data", "pagination"]));
    });

    it("ErrorResponse schema has message, code, and optional details", () => {
      const schemas = (spec.components as Record<string, Record<string, unknown>>).schemas;
      const error = schemas.ErrorResponse as Record<string, unknown>;
      expect(error.required).toEqual(expect.arrayContaining(["message", "code"]));
      const props = error.properties as Record<string, unknown>;
      expect(props.details).toBeDefined();
    });
  });

  describe("error responses", () => {
    it("pre-defined ValidationError response exists", () => {
      const responses = (spec.components as Record<string, Record<string, unknown>>).responses;
      expect(responses.ValidationError).toBeDefined();
    });

    it("pre-defined NotFoundError response exists", () => {
      const responses = (spec.components as Record<string, Record<string, unknown>>).responses;
      expect(responses.NotFoundError).toBeDefined();
    });

    it("pre-defined ConflictError response exists", () => {
      const responses = (spec.components as Record<string, Record<string, unknown>>).responses;
      expect(responses.ConflictError).toBeDefined();
    });

    it("pre-defined InternalError response exists", () => {
      const responses = (spec.components as Record<string, Record<string, unknown>>).responses;
      expect(responses.InternalError).toBeDefined();
    });
  });

  describe("endpoint response codes", () => {
    it("POST /books documents 201, 400, 409, 500", () => {
      const paths = spec.paths as Record<string, Record<string, Record<string, unknown>>>;
      const post = paths["/books"].post;
      const responses = post.responses as Record<string, unknown>;
      expect(responses["201"]).toBeDefined();
      expect(responses["400"]).toBeDefined();
      expect(responses["409"]).toBeDefined();
      expect(responses["500"]).toBeDefined();
    });

    it("GET /books documents 200, 400, 500", () => {
      const paths = spec.paths as Record<string, Record<string, Record<string, unknown>>>;
      const get = paths["/books"].get;
      const responses = get.responses as Record<string, unknown>;
      expect(responses["200"]).toBeDefined();
      expect(responses["400"]).toBeDefined();
      expect(responses["500"]).toBeDefined();
    });

    it("GET /books/{id} documents 200, 400, 404, 500", () => {
      const paths = spec.paths as Record<string, Record<string, Record<string, unknown>>>;
      const get = paths["/books/{id}"].get;
      const responses = get.responses as Record<string, unknown>;
      expect(responses["200"]).toBeDefined();
      expect(responses["400"]).toBeDefined();
      expect(responses["404"]).toBeDefined();
      expect(responses["500"]).toBeDefined();
    });

    it("PATCH /books/{id} documents 200, 400, 404, 409, 500", () => {
      const paths = spec.paths as Record<string, Record<string, Record<string, unknown>>>;
      const patch = paths["/books/{id}"].patch;
      const responses = patch.responses as Record<string, unknown>;
      expect(responses["200"]).toBeDefined();
      expect(responses["400"]).toBeDefined();
      expect(responses["404"]).toBeDefined();
      expect(responses["409"]).toBeDefined();
      expect(responses["500"]).toBeDefined();
    });

    it("DELETE /books/{id} documents 204, 400, 404, 500", () => {
      const paths = spec.paths as Record<string, Record<string, Record<string, unknown>>>;
      const del = paths["/books/{id}"].delete;
      const responses = del.responses as Record<string, unknown>;
      expect(responses["204"]).toBeDefined();
      expect(responses["400"]).toBeDefined();
      expect(responses["404"]).toBeDefined();
      expect(responses["500"]).toBeDefined();
    });
  });
});
