import { useEffect } from "react";
import { nigel } from "./nigel";
import { zarah } from "./zarah";
import { useGlobalStateContext } from "../globalState";
import { EmbedPayload } from "../types/PayloadAndType";

export const useSalienceCorrecter = () => {
  const { setSalienceItems } = useGlobalStateContext();

  useEffect(() => {
    if (
      window.location.href ===
      "https://composer.code.dev-gutools.co.uk/content/68865c1b8f08acf29cc62d2b"
    ) {
      setTimeout(() => {
        setSalienceItems([
          {
            message:
              "Oii oii, thanks for doing Reform's bidding - muhahaha 👿👺",
            userEmail: nigel.email,
            claimable: false,
            claimedByEmail: null,
            deletedAt: null,
            editHistory: null,
            groupMentions: null,
            id: nigel.email,
            mentions: null,
            payload: null,
            pinboardId: "",
            relatedItemId: null,
            timestamp: new Date().toISOString(),
            type: "message-only",
          },
        ]);
      }, 1000);

      setTimeout(() => {
        setSalienceItems((prev) => [
          ...prev,
          {
            message: "Perhaps you could try this visual to help...", //put these figures into perspective, to avoid people thinking things are bigger than they really are
            userEmail: zarah.email,
            claimable: false,
            claimedByEmail: null,
            deletedAt: null,
            editHistory: null,
            groupMentions: null,
            id: zarah.email,
            mentions: null,
            pinboardId: "",
            relatedItemId: null,
            timestamp: new Date().toISOString(),
            type: "embed",
            payload: JSON.stringify({
              embeddableUrl: "http://localhost:5174/treemap/bare",
              html: `<div><iframe style="overflow: hidden; width: 100%; border: 0; height: 130px" src="http://localhost:5174/treemap/bare"></div>`,
            } satisfies EmbedPayload["payload"]),
          },
        ]);
      }, 3000);
    }
  }, []);
};
