import { handler } from "./src";

handler({
  arguments: {
    apiUrl:
      "https://api.media.test.dev-gutools.co.uk/images?q=%23Test1&length=1&orderBy=-uploadTime",
  },
})
  .then(JSON.stringify)
  .then(console.log)
  .catch(console.error);
