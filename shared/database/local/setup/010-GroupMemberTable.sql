CREATE TABLE "GroupMember" (
    "groupShorthand" VARCHAR(128) PRIMARY KEY,
    "userGoogleID" VARCHAR(512) NOT NULL,
    CONSTRAINT fk_group FOREIGN KEY ("groupShorthand") REFERENCES "Group"("shorthand")
);
