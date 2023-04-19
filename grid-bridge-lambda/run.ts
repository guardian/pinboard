import { handler } from "./src";
import prompts from "prompts";

(async () => {
  const { args } = await prompts({
    type: "select",
    name: "args",
    message: "",
    choices: [
      {
        title: "getGridSearchSummary",
        value: {
          apiUrl:
            "https://api.media.test.dev-gutools.co.uk/images?q=flag%20%20~%22australia%22%20%23xyz%20country:%22United%20Kingdom%22&length=1&orderBy=-uploadTime",
        },
        selected: true,
      },
      {
        title: "asGridPayload (grid-search)",
        value: {
          gridUrl:
            "https://media.test.dev-gutools.co.uk/search?query=test&nonFree=true",
        },
      },
      {
        title: "asGridPayload (grid-original)",
        value: {
          gridUrl:
            "https://media.test.dev-gutools.co.uk/images/65c8e0cb691ccedb73f30822d2e9c9999d3a0e87",
        },
      },
      {
        title: "asGridPayload (grid-crop)",
        value: {
          gridUrl:
            "https://media.test.dev-gutools.co.uk/images/65c8e0cb691ccedb73f30822d2e9c9999d3a0e87?crop=0_0_20772_12500",
        },
      },
    ],
  });
  handler({ arguments: args })
    .then(JSON.stringify)
    .then(console.dir)
    .catch(console.error);
})();
