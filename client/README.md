## `client`

This module contains the all the real client side code, and is served by the [`bootstrapping-lambda`](../bootstrapping-lambda) (aggressively cached). We use [webpack](https://webpack.js.org/) for bundling the client.

### `entry.tsx`

This exposes the `mount` function which is called in the javascript served by the `/pinboard.loader.js` endpoint mentioned above, receiving the AppSync connection information along with the signed in user's email. With this information it builds an `ApolloClient` and renders the top-level component `PinBoardApp` as defined by `app.tsx`...

### `app.tsx`

This is passed the `ApolloClient` as prop (by `entry.tsx` above) and makes it available to the rest of the application via an `ApolloProvider` (which means a client needn't be explicitly provided elsewhere in the application when using the hooks: `useQuery`, `useMutation` and `useSubscription`). This component is also responsible for searching through DOM of the host page looking for `<asset-handle>` tags (which the grid for example exposes on each crop, with useful info in the ['data attributes'](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes)) it also sets up a [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) to repeatedly do this as the DOM of the host application changes (this way, pinboard need not care about how the host application is rendered; Angular1 in the case of composer & grid). It uses this list to render a set of [`ButtonPortal` (see below)](#addToPinboardButtontsx). Its also responsible for adding the [`Floaty` component (see below)](#floatytsx).

### `addToPinboardButton.tsx`

This receives the DOM node found by `app.tsx` (see above) and using [React Portals](https://reactjs.org/docs/portals.html) takes over the rendering of that DOM node, in order to present an 'Add To Pinboard' button. Clicking this button takes the ['data attributes'](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes) to build a `payload` for the Item (shared with the `SendMessageArea` via a top-level bit of state `payloadToBeSent`).

### `floaty.tsx`

This component is the main UI of pinboard and brings together the majority of the other visual components, i.e. it's the floating blue pin icon in the yellow circle, which expands to reveal the main rectangular area of pinboard. It holds state on if there is a pinboard selected (including if preselected, detected by the [`app.tsx`](#apptsx) based on the presence of `<pinboard-preselect>` tag in the host applications DOM - notably in composer when viewing an article), and either renders the [`SelectPinboard` (see below)](#selectPinboardtsx) or not, accordingly. It also maintains a list of 'active' pinboards and renders each using the [`Pinboard` component (see below)](#pinboardtsx), these stay 'mounted' and hide themselves (with `display: none` if it's not the 'selected pinboard') that way we can keep the 'subscription' open to receive new items. It also has a 'subscription' to hear about 'mentions' on ANY pinboard.

### `selectPinboard.tsx`

This component presents a rudimentary list of available pinboards (with basic client-side free text search), retrieved via a `useQuery` that ultimately gets workflow stubs and presents their working titles as clickable buttons.

### `pinboard.tsx`

This has both an initial 'query' to retrieve the existing items and a 'subscription' to keep this live, as well as some state for the sends the user makes, all of which are aggregated/de-duplicated and passed to `ScrollableItems` (which repeats the `ItemDisplay` component for each item). It also brings in the `SendMessageArea` component, which is responsible for the 'mutation' to create items.
