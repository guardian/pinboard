CREATE TABLE LastItemSeenByUser (
      "pinboardId" varchar(128) NOT NULL,
      "itemID" INT NOT NULL,
      "userEmail" varchar(512) NOT NULL,
      "seenAt" TIMESTAMP NOT NULL,
      PRIMARY KEY ("pinboardId", "itemID", "userEmail")
);