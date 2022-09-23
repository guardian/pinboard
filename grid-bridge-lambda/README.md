## `grid-bridge-lambda`

This exists to interact with [`grid`](https://github.com/guardian/grid) (`media-api` specifically), authenticating using an API key (retrieved from AWS Param Store).

When displaying `grid-search` type payloads in the pinboard UI (used for collections, labels and other searches) we need to fetch the latest thumbnails and image counts, which requires an API call. This lambda is configured as a 'data source' in AppSync with an associated resolver, and is called by the pinboard client to fetch this data (building a grid API call from the simple params and transforming the response into the simplest shape expected by the pinboard client).
