const { PrismaClient } = require('@prisma/client')

// single instance — don't create multiple clients
const prisma = new PrismaClient()

module.exports = prisma
