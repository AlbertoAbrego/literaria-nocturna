import request from "supertest";
import app from "../../app";

export const testRequest = request(app);
