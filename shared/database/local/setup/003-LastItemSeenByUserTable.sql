CREATE TABLE "LastItemSeenByUser" (
      "pinboardId" varchar(128) NOT NULL,
      "itemID" INT NOT NULL
          CONSTRAINT lastitemseenbyuser_item_id_fk
              REFERENCES "Item",
      "userEmail" varchar(512) NOT NULL,
      "seenAt" TIMESTAMP NOT NULL,
      PRIMARY KEY ("pinboardId", "userEmail")
);
