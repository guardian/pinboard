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
             SELECT "email", "firstName", "lastName", to_json("webPushSubscription") as "webPushSubscription"
             FROM "User"
             WHERE "webPushSubscription" IS NOT NULL
               AND (
                         "email" != NEW."userEmail" -- don't notify the user who created the item
                     OR "email" = ANY(NEW."mentions") -- unless they mention themselves (mainly for testing purposes)
                 )
               AND (
                         "email" = ANY(NEW."mentions") -- the user is mentioned
                     OR NEW."pinboardId" = ANY("manuallyOpenedPinboardIds") -- the user has the pinboard on their list of open pinboards
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
