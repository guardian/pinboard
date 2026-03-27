<script lang="ts">
  import { onMount } from 'svelte';

  const isIFramed = window.self !== window.parent; // could do this with ownerDocument === document
  let maybeStatus = $state();

  onMount(() => {
    if(isIFramed){
      fetch("/api/status").then(response => {
        if(response.ok){
          return response.json()
        }
        throw Error(`API call failed with status ${response.status}`);
      }).then(status => {
        maybeStatus = status;
        // TODO this json will be richer than just boolean in the future
        if(status!="valid"){
          // TODO api call to see if we need to show the iframe (to prompt user to turn on desktop notifications)
          //FIXME this * should be complemented by a CSP that only allows iframing on tools domains
          window.parent.postMessage("visible", "*")
        }
      }).catch(error => {
        console.error("Error fetching status:", error);
      });
    }

  });

</script>

<main>
  <!--
    TODO check for browser permissions for notifications (probably via service worker)
  -->
  {#if maybeStatus === "expired"}
    <span>
      Your notification permissions have expired. Please
      <button>re-enable desktop notifications</button>
      to continue receiving notifications.</span>

  {:else if maybeStatus === "none"}
    <span>
      It is encouraged to
      <button>enable desktop notifications</button>
      for editorial tools. See benefits.
    </span>
  {/if}


  <!--
  TODO
   - make entry point that can be applied to other tools in iframe (like pinboard is)
   - port service worker over
  -->
</main>

<style>

    :global(body) {
        margin: 0;
        font-family: "Guardian Agate Sans", sans-serif;
        text-align: center;
    }

    main {
        padding: 10px;
        background: hotpink;
        border-radius: 0 0 5px 5px;
    }

    button {
        font-family: "Guardian Agate Sans", sans-serif;
        font-size: inherit;
        cursor: pointer;
    }

    /* TODO use ed tools design system for these font definitions (and ideally hosting of the fonts)🤞 */
    @font-face {
        font-family: "Guardian Agate Sans";
        src: url("https://interactive.guim.co.uk/fonts/guss-webfonts/GuardianAgateSans1Web/GuardianAgateSans1Web-Regular.woff2") format("woff2");
        font-weight: 400;
        font-style: normal;
        font-display: swap;
    }
    @font-face {
        font-family: "Guardian Agate Sans";
        src: url("https://interactive.guim.co.uk/fonts/guss-webfonts/GuardianAgateSans1Web/GuardianAgateSans1Web-Bold.woff2") format("woff2");
        font-weight: 700;
        font-style: normal;
        font-display: swap;
    }
    @font-face {
        font-family: "Guardian Agate Sans";
        src: url("https://interactive.guim.co.uk/fonts/guss-webfonts/GuardianAgateSans1Web/GuardianAgateSans1Web-RegularItalic.woff2")
        format("woff2");
        font-weight: 400;
        font-style: italic;
        font-display: swap;
    }
    @font-face {
        font-family: "Guardian Agate Sans";
        src: url("https://interactive.guim.co.uk/fonts/guss-webfonts/GuardianAgateSans1Web/GuardianAgateSans1Web-BoldItalic.woff2") format("woff2");
        font-weight: 700;
        font-style: italic;
        font-display: swap;
    }

</style>
