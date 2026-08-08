import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis

const baseClient = globalForPrisma.prisma ?? new PrismaClient()

/**
 * Extended Prisma Client providing automatic soft-delete filtering (deletedAt: null)
 * on read queries across Assignment and Submission models.
 */
export const db = baseClient.$extends({
  query: {
    assignment: {
      async findMany({ args, query }) {
        args.where = { deletedAt: null, ...args.where }
        return query(args)
      },
      async findFirst({ args, query }) {
        args.where = { deletedAt: null, ...args.where }
        return query(args)
      },
      async count({ args, query }) {
        args.where = { deletedAt: null, ...args.where }
        return query(args)
      },
    },
    submission: {
      async findMany({ args, query }) {
        args.where = { deletedAt: null, ...args.where }
        return query(args)
      },
      async findFirst({ args, query }) {
        args.where = { deletedAt: null, ...args.where }
        return query(args)
      },
      async count({ args, query }) {
        args.where = { deletedAt: null, ...args.where }
        return query(args)
      },
    },
  },
})

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = baseClient
}