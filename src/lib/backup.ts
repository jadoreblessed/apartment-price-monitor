import path from "node:path";
import { copyFile, mkdir, readdir, stat, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { prisma } from "@/lib/db";

const backupNamePattern = /^apartment-monitor-.*\.db$/;

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function sqliteLiteral(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

export async function createSqliteBackupFile(directory: string) {
  await mkdir(directory, { recursive: true });
  const filePath = path.join(directory, `apartment-monitor-${timestamp()}.db`);
  await prisma.$executeRawUnsafe(`VACUUM INTO ${sqliteLiteral(filePath)}`);
  return filePath;
}

export async function createTemporarySqliteBackup() {
  const directory = path.join(tmpdir(), `apartment-monitor-${randomUUID()}`);
  const filePath = await createSqliteBackupFile(directory);
  return {
    filePath,
    fileName: path.basename(filePath),
    async cleanup() {
      await unlink(filePath).catch(() => undefined);
    },
  };
}

export async function pruneBackups(directory: string, keep = 30) {
  await mkdir(directory, { recursive: true });
  const files = (await readdir(directory))
    .filter((name) => backupNamePattern.test(name))
    .sort()
    .reverse();

  await Promise.all(files.slice(keep).map((name) => unlink(path.join(directory, name))));
}

export async function fallbackCopyDatabase(targetDirectory: string) {
  const source = path.resolve("prisma", "dev.db");
  await stat(source);
  await mkdir(targetDirectory, { recursive: true });
  const target = path.join(targetDirectory, `apartment-monitor-${timestamp()}.db`);
  await copyFile(source, target);
  return target;
}
