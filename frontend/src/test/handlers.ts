import type { HttpHandler } from "msw";
import { bookHandlers } from "./handlers/books";

export const handlers: HttpHandler[] = [...bookHandlers];
