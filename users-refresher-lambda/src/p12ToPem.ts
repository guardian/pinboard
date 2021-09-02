import forge from "node-forge";
import { S3 } from "aws-sdk";

// mostly copied from https://github.com/googleapis/google-p12-pem/blob/b6fab0b70d24e35768588ae53d844f6b5953bba5/src/index.ts#L50-L61
// as `convertToPem` is not exported in the 'googleapis/google-p12-pem' library
export const p12ToPem = (body: S3.Body | undefined) => {
  if (!body) {
    throw new Error("Body (of p12) is falsy!");
  }

  const p12base64 = body.toString("base64");
  const p12Der = forge.util.decode64(p12base64);
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, "notasecret");
  const bags = p12.getBags({ friendlyName: "privatekey" });
  const privateKey = bags?.friendlyName?.[0].key;
  if (privateKey) {
    const pem = forge.pki.privateKeyToPem(privateKey);
    return pem.replace(/\r\n/g, "\n");
  } else {
    throw new Error("Unable to get friendly name.");
  }
};
