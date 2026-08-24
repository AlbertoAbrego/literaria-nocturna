import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OPENAPI_PATH = resolve(__dirname, "openapi.json");

interface OpenAPISpec {
  servers?: Array<{ url: string }>;
  paths: Record<string, Record<string, { summary: string; responses: Record<string, unknown> }>>;
}

interface EndpointInfo {
  method: string;
  path: string;
  summary: string;
  responses: Record<string, { description: string; ref?: string }>;
}

const REQUIRED_ERROR_CODES = ["400", "404", "409", "500"];

function getExpectedEndpoints(spec: OpenAPISpec): EndpointInfo[] {
  const serverUrl = spec.servers?.[0]?.url ?? "";
  const endpoints: EndpointInfo[] = [];
  for (const [path, methods] of Object.entries(spec.paths)) {
    const fullPath = `${serverUrl}${path}`;
    for (const [method, definition] of Object.entries(methods)) {
      endpoints.push({
        method: method.toUpperCase(),
        path: fullPath,
        summary: definition.summary,
        responses: definition.responses as Record<string, { description: string; ref?: string }>,
      });
    }
  }
  return endpoints;
}

function getHandlerMap(): Map<string, string> {
  const handlerMap = new Map<string, string>();

  const methodMap: Record<string, string> = {
    GET: "get",
    POST: "post",
    PATCH: "patch",
    DELETE: "delete",
  };

  const patterns = [
    { method: "GET", path: "/api/books" },
    { method: "POST", path: "/api/books" },
    { method: "GET", path: "/api/books/:id" },
    { method: "PATCH", path: "/api/books/:id" },
    { method: "DELETE", path: "/api/books/:id" },
  ];

  for (const pattern of patterns) {
    const key = `${pattern.method} ${pattern.path}`;
    handlerMap.set(key, methodMap[pattern.method]);
  }

  return handlerMap;
}

interface DriftIssue {
  type: "missing_handler" | "missing_error_code" | "path_mismatch";
  endpoint: string;
  detail: string;
}

function verify(spec: OpenAPISpec): DriftIssue[] {
  const issues: DriftIssue[] = [];
  const expectedEndpoints = getExpectedEndpoints(spec);
  const handlerMap = getHandlerMap();

  for (const endpoint of expectedEndpoints) {
    const openApiPath = endpoint.path;
    const mswPath = openApiPath.replace(/{(\w+)}/g, ":$1");
    const key = `${endpoint.method} ${mswPath}`;

    if (!handlerMap.has(key)) {
      issues.push({
        type: "missing_handler",
        endpoint: `${endpoint.method} ${openApiPath}`,
        detail: `No MSW handler found for ${key}`,
      });
      continue;
    }

    const errorCodes = Object.keys(endpoint.responses).filter((code) =>
      REQUIRED_ERROR_CODES.includes(code),
    );

    for (const code of errorCodes) {
      const resp = endpoint.responses[code];
      if (resp && "ref" in resp) {
        const refName = (resp.ref as string).split("/").pop();
        if (refName === "ValidationError" && code !== "400") {
          issues.push({
            type: "missing_error_code",
            endpoint: `${endpoint.method} ${openApiPath}`,
            detail: `OpenAPI defines ${code} but ValidationError should be 400`,
          });
        }
      }
    }
  }

  const handlerKeys = new Set(handlerMap.keys());
  for (const endpoint of expectedEndpoints) {
    const openApiPath = endpoint.path;
    const mswPath = openApiPath.replace(/{(\w+)}/g, ":$1");
    const key = `${endpoint.method} ${mswPath}`;

    if (!handlerKeys.has(key)) {
      issues.push({
        type: "path_mismatch",
        endpoint: `${endpoint.method} ${openApiPath}`,
        detail: `MSW handler path ${mswPath} does not match OpenAPI path ${openApiPath}`,
      });
    }
  }

  return issues;
}

function main() {
  const spec: OpenAPISpec = JSON.parse(readFileSync(OPENAPI_PATH, "utf-8"));

  console.log("Verifying MSW handlers against OpenAPI contract...\n");

  const issues = verify(spec);

  if (issues.length === 0) {
    console.log("✓ All MSW handlers match the OpenAPI contract.");
    process.exit(0);
  }

  console.log(`Found ${issues.length} issue(s):\n`);
  for (const issue of issues) {
    console.log(`  [${issue.type}] ${issue.endpoint}`);
    console.log(`    ${issue.detail}\n`);
  }

  process.exit(1);
}

main();
