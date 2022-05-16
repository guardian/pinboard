import { handler } from "./src";

handler({
  arguments: {
    apiUrl:
      "https://api.media.test.dev-gutools.co.uk/images?q=flag%20%20~%22australia%22%20%23xyz%20country:%22United%20Kingdom%22&length=1&orderBy=-uploadTime",
  },
})
  .then(JSON.stringify)
  .then(console.log)
  .catch(console.error);
