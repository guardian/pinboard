CREATE OR REPLACE FUNCTION invokeEmailLambda()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
AS
$$
BEGIN
    IF (NEW."groupMentions" IS NOT NULL AND NEW."groupMentions" != '{}')
       OR (NEW."mentions" IS NOT NULL AND NEW."mentions" != '{}') THEN
        PERFORM * FROM aws_lambda.invoke(
                aws_commons.create_lambda_function_arn(
                        '$lambdaFunctionName',
                        '$awsRegion'
                    ),
                json_build_object(
                        'itemId', NEW."id",
                        'maybeRelatedItemId', NEW."relatedItemId"
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
EXECUTE FUNCTION invokeEmailLambda();
