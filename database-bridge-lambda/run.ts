import { handler } from "./src";

handler().then(JSON.stringify).then(console.log).catch(console.error);
