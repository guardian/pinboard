ALTER TABLE "Item"
    ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX ItemTableIsArchivedIndex ON "Item"("isArchived");

