import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CONTEXTS = [
  {
    name: "Legal",
    key: "legal",
    description: "The full legal name as it appears on official documents such as a passport, ID, or government records."
  },
  {
    name: "Professional",
    key: "professional",
    description: "The name used in a work or academic context, such as on a CV, email signature, or university profile."
  },
  {
    name: "Religious",
    key: "religious",
    description: "The name used within a religious or spiritual community."
  },
  {
    name: "Informal",
    key: "informal",
    description: "The name used with friends and family, such as a nickname or shortened version of the name."
  },
];

async function main() {
  await prisma.context.createMany({
    data: CONTEXTS,
    skipDuplicates: true,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());