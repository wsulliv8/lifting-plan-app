import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const directConnection = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const prisma = new PrismaClient({
  adapter: directConnection,
});

module.exports = prisma;
