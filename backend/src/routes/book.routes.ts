import { Router } from "express";
import { createBook, getAllBooks } from "../controllers/book.controller";
 
const router = Router();
 
router.post("/", createBook);
router.get("/", getAllBooks);
 
export default router;
