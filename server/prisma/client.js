const { PrismaClient } = require("@prisma/client");

// Prisma 6.6.0 automatically reads DATABASE_URL from environment
const prisma = new PrismaClient();

module.exports = prisma;
