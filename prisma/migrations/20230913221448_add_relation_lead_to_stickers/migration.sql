/*
  Warnings:

  - You are about to drop the column `transcription` on the `Sticker` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sticker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "leadId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sticker_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sticker" ("createdAt", "id", "name", "path") SELECT "createdAt", "id", "name", "path" FROM "Sticker";
DROP TABLE "Sticker";
ALTER TABLE "new_Sticker" RENAME TO "Sticker";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
