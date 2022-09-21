CREATE TABLE "Item" (
    "id" SERIAL PRIMARY KEY,
    "message" TEXT,
    "payload" JSONB,
    "timestamp" TIMESTAMP DEFAULT current_timestamp,
    "type" varchar(128) NOT NULL,
    "userEmail" varchar(512) NOT NULL,
    "pinboardId" varchar(128) NOT NULL,
    "mentions" varchar(512)[]
);
