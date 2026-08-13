import path from "node:path";
import { createSqliteBackupFile, fallbackCopyDatabase, pruneBackups } from "@/lib/backup";
import { prisma } from "@/lib/db";

const destination = path.resolve("backups");
const keep = 30;

async function main() {
  let target: string;
  try {
    target = await createSqliteBackupFile(destination);
  } catch (error) {
    console.warn("VACUUM INTO не сработал, создана обычная файловая копия:", error);
    target = await fallbackCopyDatabase(destination);
  }

  await pruneBackups(destination, keep);
  console.log(`Резервная копия создана: ${target}`);
}

main().catch((error) => {
  console.error("Не удалось создать резервную копию:", error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
