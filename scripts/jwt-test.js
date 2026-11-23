/*
 * Generates valid, invalid and expired JWTs for testing the auth-lambda,
 * and verifies each one the same way the lambda does (jose.jwtVerify).
 *
 * Usage:
 *   node auth-lambda/src/jwt-test.js [userEmail] [--invoke]
 *
 * With --invoke, each token is also sent to the deployed auth lambda via the
 * AWS CLI, and its `isAuthorized` response is checked against the local
 * verification result. Override the target with FUNCTION_NAME (default
 * pinboard-auth-lambda-CODE), AWS_PROFILE (default workflow) and AWS_REGION
 * (default eu-west-1).
 *
 * By default a throwaway RSA key pair is generated. To sign with a real panda
 * private key (e.g. the CODE one, so tokens work against the deployed
 * authorizer), set PRIVATE_KEY_FILE to a file containing either a PEM or the
 * bare base64 body as stored in the panda settings. In that case tokens are
 * truncated in the output, as they would be usable credentials.
 */
import * as jose from "jose";
import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const alg = "RS256";
const issuer = "pinboard";
const args = process.argv.slice(2);
const shouldInvoke = args.includes("--invoke");
const userEmail =
  args.find((arg) => !arg.startsWith("--")) ?? "test.user@guardian.co.uk";

const functionName = process.env.FUNCTION_NAME ?? "pinboard-auth-lambda-CODE";
const awsProfile = process.env.AWS_PROFILE ?? "workflow";
const awsRegion = process.env.AWS_REGION ?? "eu-west-1";

const toPem = (body, label) =>
  body.includes("-----BEGIN")
    ? body
    : `-----BEGIN ${label}-----\n${body.trim()}\n-----END ${label}-----`;

const generateKeyPair = () =>
  crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });

const usingRealKey = Boolean(process.env.PRIVATE_KEY_FILE);

const { privateKey, publicKey } = usingRealKey
  ? (() => {
      const keyString = fs.readFileSync(process.env.PRIVATE_KEY_FILE, "utf8");
      const privateKey = crypto.createPrivateKey(
        toPem(keyString, "RSA PRIVATE KEY")
      );
      return { privateKey, publicKey: crypto.createPublicKey(privateKey) };
    })()
  : generateKeyPair();

const { privateKey: wrongPrivateKey } = generateKeyPair();

const nowSeconds = Math.floor(Date.now() / 1000);
const HOUR = 60 * 60;

const sign = ({
  key = privateKey,
  iat = nowSeconds,
  exp = nowSeconds + 24 * HOUR,
  nbf,
  payload = { userEmail },
} = {}) => {
  const jwt = new jose.SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuer(issuer)
    .setIssuedAt(iat)
    .setExpirationTime(exp);
  if (nbf !== undefined) jwt.setNotBefore(nbf);
  return jwt.sign(key);
};

const tamperPayload = (token) => {
  const [header, , signature] = token.split(".");
  const forgedPayload = Buffer.from(
    JSON.stringify({
      userEmail: "attacker@example.com",
      iss: issuer,
      iat: nowSeconds,
      exp: nowSeconds + 24 * HOUR,
    })
  ).toString("base64url");
  return [header, forgedPayload, signature].join(".");
};

const validToken = await sign();

const tokens = {
  valid: validToken,
  expired: await sign({ iat: nowSeconds - 25 * HOUR, exp: nowSeconds - HOUR }),
  notYetValid: await sign({ nbf: nowSeconds + HOUR }),
  wrongKey: await sign({ key: wrongPrivateKey }),
  tamperedPayload: tamperPayload(validToken),
  unsigned: new jose.UnsecuredJWT({ userEmail })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime("24h")
    .encode(),
  malformed: "not.a.jwt",
};

const displayToken = (token) =>
  usingRealKey
    ? `${token.slice(0, 20)}… (truncated: signed with PRIVATE_KEY_FILE)`
    : token;

console.log("Public key (SPKI):");
console.log(publicKey.export({ type: "spki", format: "pem" }));

const invokeAuthLambda = async (token) => {
  const outFile = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "auth-lambda-")),
    "response.json"
  );
  try {
    const { stdout } = await promisify(execFile)("aws", [
      "lambda",
      "invoke",
      "--profile",
      awsProfile,
      "--region",
      awsRegion,
      "--function-name",
      functionName,
      "--cli-binary-format",
      "raw-in-base64-out",
      "--payload",
      JSON.stringify({ authorizationToken: token }),
      outFile,
    ]);
    const { FunctionError } = JSON.parse(stdout);
    const response = fs.readFileSync(outFile, "utf8");
    if (FunctionError) {
      throw new Error(`lambda error (${FunctionError}): ${response}`);
    }
    return JSON.parse(response);
  } finally {
    fs.rmSync(path.dirname(outFile), { recursive: true, force: true });
  }
};

let failures = 0;

for (const [name, token] of Object.entries(tokens)) {
  let result;
  let expectedAuthorized;
  try {
    const { payload } = await jose.jwtVerify(token, publicKey);
    result = `✅ verified (userEmail: ${payload.userEmail})`;
    expectedAuthorized = true;
  } catch (error) {
    result = `❌ rejected (${error.code ?? error.name}: ${error.message})`;
    expectedAuthorized = false;
  }
  console.log(`\n${name}: ${result}\n${displayToken(token)}`);

  if (shouldInvoke) {
    try {
      const response = await invokeAuthLambda(token);
      if (response.isAuthorized === expectedAuthorized) {
        console.log(
          `  lambda: ✅ isAuthorized=${response.isAuthorized} as expected`
        );
      } else {
        failures++;
        console.log(
          `  lambda: ❌ isAuthorized=${
            response.isAuthorized
          }, expected ${expectedAuthorized} (response: ${JSON.stringify(
            response
          )})`
        );
      }
    } catch (error) {
      failures++;
      console.log(
        `  lambda: 💥 ${error.message.split(token).join("[REDACTED]")}`
      );
    }
  }
}

if (shouldInvoke) {
  const total = Object.keys(tokens).length;
  console.log(
    `\n${functionName}: ${total - failures}/${total} matched expectations`
  );
  process.exitCode = failures ? 1 : 0;
}
