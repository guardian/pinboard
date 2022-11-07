CREATE OR REPLACE FUNCTION getUsersToNotify(NEW record)
    RETURNS JSON
    LANGUAGE PLPGSQL
AS
$$
DECLARE result JSON;
BEGIN
    SELECT json_agg(users_to_notify)
    INTO result
    FROM (
             SELECT "email", to_json("webPushSubscription") as "webPushSubscription"
             FROM "User"
             WHERE "webPushSubscription" IS NOT NULL
               AND (
                    (
                        NEW."pinboardId" = ANY("manuallyOpenedPinboardIds") -- the user has the pinboard on their list of open pinboards
                        AND "email" != NEW."userEmail" -- don't notify the user who created the item (unless mentioned themselves)
                    )
                 OR "email" = ANY(NEW."mentions") -- the user is mentioned
                 OR "googleID" IN ( -- the user is group mentioned
                        SELECT "userGoogleID"
                        FROM "GroupMember"
                        WHERE "GroupMember"."groupShorthand" = ANY(NEW."groupMentions")
                    )
                 )
         ) as users_to_notify;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION invokeNotificationLambda()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
AS
$$
DECLARE users_to_notify JSON;
BEGIN
    users_to_notify := getUsersToNotify(NEW);
    IF users_to_notify IS NOT NULL THEN
        PERFORM * FROM aws_lambda.invoke(
                aws_commons.create_lambda_function_arn(
                        '$notificationLambdaFunctionName',
                        '$awsRegion'
                    ),
                json_build_object(
                        'item', NEW,
                        'users', users_to_notify
                    )::json,
                'Event' --asynchronous invocation
            );
    END IF;
    RETURN NULL;
END
$$;

DROP TRIGGER IF EXISTS "$triggerName" ON "Item";
CREATE TRIGGER "$triggerName"
    AFTER INSERT
    ON "Item"
    FOR EACH ROW
EXECUTE FUNCTION invokeNotificationLambda();
