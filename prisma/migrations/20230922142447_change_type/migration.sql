/*
  Warnings:

  - You are about to drop the column `type` on the `Analytics` table. All the data in the column will be lost.
  - Added the required column `kind` to the `Analytics` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Analytics" ("count", "id") SELECT "count", "id" FROM "Analytics";
DROP TABLE "Analytics";
ALTER TABLE "new_Analytics" RENAME TO "Analytics";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
