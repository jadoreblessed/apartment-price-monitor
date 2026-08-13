import { readFile } from "node:fs/promises";
import { getCurrentUser } from "@/lib/auth";
import { createTemporarySqliteBackup } from "@/lib/backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return new Response("Доступ запрещён", { status: 403 });

  let backup: Awaited<ReturnType<typeof createTemporarySqliteBackup>> | null = null;
  try {
    backup = await createTemporarySqliteBackup();
    const database = await readFile(backup.filePath);
    return new Response(database, {
      headers: {
        "Content-Type": "application/vnd.sqlite3",
        "Content-Disposition": `attachment; filename="${backup.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Файл базы данных не найден", { status: 404 });
  } finally {
    await backup?.cleanup();
  }
}
