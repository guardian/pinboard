<script lang="ts">
  let count: number = $state(0)
  const increment = () => {
    count += 1
  }
</script>

<!--
TODO
 - distinguish between iframed use (show minimal UI) vs standalone (show more UI)
 - make entry point that can be applied to other tools in iframe (like pinboard is)
 - port service worker over
-->

<button onclick={increment}>
  The COUNT is {count}
</button>
