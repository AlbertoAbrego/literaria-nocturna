import fs from "node:fs";
import mongoose from "mongoose";
import { BookModel } from "../models/book.model";
import { globalConfigPath } from "./globalSetup";

jest.setTimeout(20000);

beforeAll(async () => {
  const config = JSON.parse(fs.readFileSync(globalConfigPath, "utf8")) as {
    MONGODB_URI: string;
  };
  await mongoose.connect(config.MONGODB_URI, { dbName: `test-${process.pid}` });
});

beforeEach(async () => {
  await BookModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
