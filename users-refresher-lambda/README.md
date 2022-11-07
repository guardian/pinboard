## `users-refresher-lambda`

This lambda runs on two schedules...

- one every minute with `isProcessPermissionChangesOnly: true` in its input payload
- one every 24hours with an empty input payload.

It looks up which users have Pinboard permission and looks up their details using the Google Admin Directory API (for people's names) and the Google People API (for their `avatarUrl` - where available).

It stores all these into the `User` table. Based on the input event it will either process all users or just those who have had their permission changed (compared to the DB).

If people no longer have Pinboard permission, it sets the `isMentionable` property to `false` in the `User` table.

This User information serves various purposes, such as populating the list of people available to 'mention', as well as acting as a lookup for resolving people's names and avatars in the display of each item (meaning we only need to store `userEmail` against each row in the `Item` table, rather than repeating all that metadata for every single message).

On the daily 'full run' we also load the map of groups (_key_: a 'shorthand' for the group, _value_: any email address associated with the group) from the AWS Param Store, then for each we lookup the group details (via `groups.get` call) and the group members (via `members.list` call) and write to the `Group` and `GroupMember` tables respectively.
