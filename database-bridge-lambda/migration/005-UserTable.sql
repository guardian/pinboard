CREATE TABLE "User" (
    "email" varchar(512) PRIMARY KEY,
    "firstName" varchar(128) NOT NULL,
    "lastName" varchar(128) NOT NULL,
    "avatarUrl" varchar(2046),
    "isMentionable" BOOLEAN NOT NULL,
    "webPushSubscription" JSONB,
    "manuallyOpenedPinboardIds" varchar(128)[]
);
