// prismaClient.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// En Prisma 7 NO pasamos datasourceUrl aquí.
// Ya se configura en prisma.config.ts y .env
const prisma = new PrismaClient();

module.exports = prisma;
