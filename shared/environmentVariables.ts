export const ENVIRONMENT_VARIABLE_KEYS = {
  usersTableName: "USERS_TABLE_NAME",
  workflowDnsName: "WORKFLOW_DATASTORE_LOAD_BALANCER_DNS_NAME",
  graphqlEndpoint: "GRAPHQL_ENDPOINT",
  sentryDSN: "SENTRY_DSN",
};

export const getEnvironmentVariableOrThrow = (
  keyName: keyof typeof ENVIRONMENT_VARIABLE_KEYS
) => {
  const name = ENVIRONMENT_VARIABLE_KEYS[keyName];
  const value = process.env[name];
  if (!value) {
    throw Error(`'${name}' environment variable not set.`);
  }
  return value;
};
