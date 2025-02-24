## `users-refresher-lambda`

This lambda runs on two schedules...

- one every minute with `isProcessPermissionChangesOnly: true` in its input payload
- one every 24hours with an empty input payload.

It looks up which users have Pinboard permission and looks up their details using the Google Admin Directory API (for people's names) and the Google People API (for their `avatarUrl` - where available).

It stores all these into the `User` table. Based on the input event it will either process all users or just those who have had their permission changed (compared to the DB).

If people no longer have Pinboard permission, it sets the `isMentionable` property to `false` in the `User` table.

This User information serves various purposes, such as populating the list of people available to 'mention', as well as acting as a lookup for resolving people's names and avatars in the display of each item (meaning we only need to store `userEmail` against each row in the `Item` table, rather than repeating all that metadata for every single message).

On the daily 'full run' we also load the map of groups (_key_: a 'shorthand' for the group, _value_: any email address associated with the group) from the AWS Param Store, then for each we lookup the group details (via `groups.get` call) and the group members (via `members.list` call) and write to the `Group` and `GroupMember` tables respectively.

### Managing email groups

The set email groups that can be messaged from Pinboard is defined in the AWS Param Store, as mentioned above. To edit the list, you will need AWS console access for the "Workflow" account in [Janus](https://janus.gutools.co.uk/).

From the AWS console, open the _Parameter Store_ and find the entry for pinboard groups. There are separate entries for CODE and PROD. The value of the parameter is a JSON string in this format:

```JSON
{
"digicms": "digitalcms.dev@guardian.co.uk",
"pinboardHELP": "pinboard@guardian.co.uk"
}
```

The keys in the object are the display name shown in the Pinboard UI, the values are the email address for the group. When updating the value, please note:

- On CODE we use "pinboard@guardian.co.uk" as the email address for all groups except "digitalcms.dev@guardian.co.uk". This is so messages on CODE pinboard are not sent to the real recipients
- In JSON, the last entry in an object must NOT have a trailing comma

The groups are updated in the application once per day on the daily 'full run' mentioned above - but you can trigger an update after making your change by:

- opening the _lambda_ menu from the AWS console ("Workflow" account)
- open the lambda (`pinboard-users-refresher-lambda-PROD` or `pinboard-users-refresher-lambda-CODE`) from the list
- from the _Test_ tab, use the "Test" button to invoke the function (the payload sent to the lambda should be an empty object)
