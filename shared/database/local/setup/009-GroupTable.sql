CREATE TABLE "Group" (
    "shorthand" VARCHAR(128) PRIMARY KEY,
    "googleID" VARCHAR(512) NOT NULL,
    "name" TEXT NOT NULL,
    "primaryEmail" VARCHAR(512) NOT NULL,
    "otherEmails" VARCHAR(512)[]
);
