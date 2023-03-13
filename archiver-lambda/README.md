## `archiver-lambda`

We'd like the pinboards associated with deleted workflow items to just drop away, to keep things relevant for users.

This lambda runs on a 6 hourly schedule and does the following...

- invokes [`workflow-bridge-lambda`](../workflow-bridge-lambda) to get active workflow IDs
- for items with `pinboardId` NOT in the list of active workflow IDs
  - sets `isArchived` to `true` (note these items are then filtered out of relevant queries such as `listItems`, `getGroupPinboardIds`, `getItemCounts`)
  - clear the `message` and `payload` for storage reasons
- removes any archived pinboards from the `manuallyOpenedPinboardIds` field of relevant users

... details of the above is all logged, such that we could restore if needs be (albeit with an ad-hoc script).
