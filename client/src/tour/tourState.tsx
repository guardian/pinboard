import React, {
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TourStepID, tourStepIDs, tourStepMap } from "./tourStepMap";
import { ACTIONS, CallBackProps, EVENTS } from "react-joyride";
import { useGlobalStateContext } from "../globalState";
import { STATUS } from "react-joyride";
import { PendingItem } from "../types/PendingItem";
import {
  CreateItemInput,
  EditItemInput,
  Item,
  LastItemSeenByUser,
  LastItemSeenByUserInput,
  User,
} from "../../../shared/graphql/graphql";
import { pendingAsReceivedItem, replyTo } from "./tourMessageReplies";
import {
  demoMentionableUsers,
  demoPinboardData,
  demoUser,
} from "./tourConstants";
import { userToMentionHandle } from "../mentionsUtil";
import { LastItemSeenByUserLookup } from "../pinboard";

type TourStepRef = React.MutableRefObject<HTMLDivElement | null>;

type TourStepRefMap = Record<TourStepID, TourStepRef>;

interface TourStateContextShape {
  isRunning: boolean;
  stepIndex: number;
  start: () => void;
  refs: TourStepRef[];
  getRef: (stepId: TourStepID) => TourStepRef;
  handleCallback: (data: CallBackProps) => void;
  jumpStepTo: (stepId: TourStepID) => void;
  sendItem: (
    callback: () => void
  ) => (_: { variables: { input: CreateItemInput } }) => unknown;
  editItem: (
    callback: () => void
  ) => (_: { variables: { itemId: string; input: EditItemInput } }) => unknown;
  deleteItem: (itemId: string) => unknown;
  successfulSends: PendingItem[];
  subscriptionItems: Item[];
  lastItemSeenByUserLookup: LastItemSeenByUserLookup;
  seenItem: (
    userEmail: string
  ) => (_: { variables: { input: LastItemSeenByUserInput } }) => unknown;
}

const TourStateContext = React.createContext<TourStateContextShape | null>(
  null
);

// Ugly but allows us to assume that the context has been set, which it always will be
const useTourStateContext = (): TourStateContextShape => {
  const ctx = useContext(TourStateContext);
  if (ctx === null) {
    throw new Error("TourStateContext is uninitialised");
  }
  return ctx;
};

export function useTourStepRef(stepId: TourStepID): TourStepRef;
export function useTourStepRef(
  stepId: TourStepID,
  ...otherStepIds: TourStepID[]
): React.Ref<HTMLDivElement>;
export function useTourStepRef(
  stepId: TourStepID,
  ...otherStepIds: TourStepID[]
): React.Ref<HTMLDivElement> {
  const context = useTourStateContext();

  if (otherStepIds.length === 0) {
    return context.getRef(stepId);
  }

  return (node: HTMLDivElement | null) =>
    [stepId, ...otherStepIds]
      .map(context.getRef)
      .forEach((ref) => (ref.current = node));
}

export const useTourStepRefs = () => useTourStateContext().refs;

export const useTourProgress = () => {
  const {
    isRunning,
    stepIndex,
    handleCallback,
    start,
    successfulSends,
    subscriptionItems,
    lastItemSeenByUserLookup,
    sendItem,
    editItem,
    deleteItem,
    seenItem,
  } = useTourStateContext();

  const demoMentionsProvider = (token: string): Promise<User[]> =>
    Promise.resolve(
      demoMentionableUsers.filter(
        (_) =>
          _.firstName.toLowerCase().includes(token.toLowerCase()) ||
          _.lastName.toLowerCase().includes(token.toLowerCase())
      )
    );

  return {
    stepIndex,
    handleCallback,
    isRunning,
    start,
    successfulSends,
    subscriptionItems,
    lastItemSeenByUserLookup,
    sendItem,
    editItem,
    deleteItem,
    seenItem,
    demoMentionsProvider,
    interactionFlags: {
      hasSentBasicMessage: successfulSends.length > 0,
      hasMentionedIndividual: !!successfulSends.find(
        (_) => (_.mentions || []).length > 0
      ),
      hasMentionedTeam: !!successfulSends.find(
        (_) => (_.groupMentions || []).length > 0
      ),
      hasEditedMessage: !!subscriptionItems.find(
        (_) => (_.editHistory || []).length > 0
      ),
      hasDeletedMessage: !!subscriptionItems.find((_) => _.deletedAt),
    },
  };
};

export const useJumpToTourStep = (stepId: TourStepID) => {
  const { jumpStepTo } = useTourStateContext();
  return () => jumpStepTo(stepId);
};

export const TourStateProvider: React.FC = ({ children }) => {
  const refMap: TourStepRefMap = useMemo(
    () =>
      Object.fromEntries(
        tourStepIDs.map((stepId) => [stepId, useRef<HTMLElement>(null)])
      ) as TourStepRefMap,
    []
  );
  const getRef = (stepId: TourStepID) => refMap[stepId];

  const [tourState, setTourState] = useState({
    isRunning: false,
    stepIndex: -1,
  });
  const { isRunning, stepIndex } = tourState;
  const [tourHistory, setTourHistory] = useState<number[]>([]);

  const jumpStepTo = (stepId: TourStepID) => {
    const stepIndex = tourStepIDs.indexOf(stepId);
    setTourState({ ...tourState, isRunning: false });
    setTourHistory([...tourHistory, -1, stepIndex + 1]); // -1 refers to the contents step
    requestAnimationFrame(() =>
      setTourState({ isRunning: true, stepIndex: stepIndex + 1 })
    ); // +1 is to account for the contents step
  };

  useLayoutEffect(() => {
    const tourStepId = tourStepIDs[stepIndex - 1]; // -1 is to account for the contents step

    if (stepIndex < 1) {
      clearSelectedPinboard();
    } else if (tourStepId) {
      tourStepMap[tourStepId].isIndexView
        ? clearSelectedPinboard()
        : openPinboard(true)(demoPinboardData, false);
    }
  }, [stepIndex]);

  const { openPinboard, clearSelectedPinboard, userEmail } =
    useGlobalStateContext();

  const continueTourTo = (nextStepIndex: number) => {
    setTourState({ ...tourState, isRunning: false });
    requestAnimationFrame(() =>
      setTourState({ isRunning: true, stepIndex: nextStepIndex })
    );
  };

  const handleCallback = (data: CallBackProps) => {
    const { type, index, action, status } = data;

    if (status === (STATUS.FINISHED as string) || action === ACTIONS.CLOSE) {
      setTourState({ isRunning: false, stepIndex: -1 });
    } else if (index !== 0 && type === EVENTS.STEP_AFTER) {
      switch (action) {
        case ACTIONS.PREV: {
          const nextStepIndex = tourHistory[tourHistory.length - 2];
          continueTourTo(nextStepIndex);
          setTourHistory(() => tourHistory.slice(0, -1));
          break;
        }
        case ACTIONS.NEXT: {
          const nextStepIndex = index + 1;
          setTourHistory([...tourHistory, nextStepIndex]);
          continueTourTo(nextStepIndex);
          break;
        }
      }
    }
  };

  const start = () => {
    setTourHistory([]);
    setTourState({ isRunning: true, stepIndex: -1 });
  };

  const [successfulSends, setSuccessfulSends] = useState<PendingItem[]>([]);
  const [subscriptionItems, setSubscriptionItems] = useState<Item[]>([]);
  const [lastItemSeenByUserLookup, setLastItemSeenByUserLookup] =
    useState<LastItemSeenByUserLookup>({});

  const sendItem =
    (callback: () => void) =>
    ({ variables }: { variables: { input: CreateItemInput } }) => {
      const newItem: PendingItem = {
        ...variables.input,
        id: (successfulSends.length + 1).toString(),
        timestamp: new Date().toISOString(),
        pending: true,
        userEmail,
        claimedByEmail: null,
        relatedItemId: null,
        editHistory: null,
        deletedAt: null,
        mentions: (variables.input.mentions || []).map((email) => ({
          label: demoMentionableUsers
            .filter((_) => _.email === email)
            .map(userToMentionHandle)[0],
          isMe: false,
        })),
        groupMentions: [], //TODO - map variables.input.groupMentions to mention handle,
        claimable: variables.input.claimable || false,
      };
      setSuccessfulSends((prevSuccessfulSends) => [
        ...prevSuccessfulSends,
        newItem,
      ]);
      callback();
      setTimeout(
        () =>
          setSubscriptionItems((prevSubscriptionItems) => [
            ...prevSubscriptionItems,
            pendingAsReceivedItem(newItem),
          ]),
        500
      );
      const replyingUser =
        demoMentionableUsers.find(
          (_) => _.email === variables.input.mentions?.[0]
        ) || demoUser;
      setTimeout(() => {
        const args = {
          variables: {
            input: { pinboardId: demoPinboardData.id, itemID: newItem.id },
          },
        };
        seenItem(replyingUser.email)(args);

        const otherUsers = [...demoMentionableUsers, demoUser].filter(
          (_) => _.email !== replyingUser.email
        );
        const otherUser =
          otherUsers[Math.floor(Math.random() * otherUsers.length)];
        seenItem(otherUser.email)(args);
      }, 1000);
      setTimeout(
        () =>
          setSubscriptionItems((prevSubscriptionItems) => [
            ...prevSubscriptionItems,
            ...replyTo(replyingUser, newItem, successfulSends),
          ]),
        1500
      );
    };

  const editItem =
    (callback: () => void) =>
    ({
      variables,
    }: {
      variables: { itemId: string; input: EditItemInput };
    }) => {
      callback();
      setSubscriptionItems((prevSubscriptionItems) => {
        const existingItem = prevSubscriptionItems.find(
          (_) => _.id === variables.itemId
        )!;
        return [
          ...prevSubscriptionItems,
          {
            ...existingItem,
            editHistory: [
              ...(existingItem.editHistory || []),
              new Date().toISOString(),
            ],
            ...variables.input,
          },
        ];
      });
    };

  const deleteItem = (itemId: string) => {
    setSubscriptionItems((prevSubscriptionItems) => {
      const itemToDelete = prevSubscriptionItems.find((_) => _.id === itemId)!;
      return [
        ...prevSubscriptionItems,
        {
          ...itemToDelete,
          deletedAt: new Date().toISOString(),
        },
      ];
    });
  };

  const seenItem =
    (userEmail: string) =>
    ({ variables }: { variables: { input: LastItemSeenByUserInput } }) => {
      setLastItemSeenByUserLookup((prevLookup) => ({
        ...prevLookup,
        [userEmail]: {
          pinboardId: variables.input.pinboardId,
          itemID: variables.input.itemID,
          userEmail,
          seenAt: new Date().toISOString(),
        },
      }));
    };

  const contextValue: TourStateContextShape = {
    refs: Object.values(refMap),
    getRef,
    stepIndex,
    handleCallback,
    start,
    jumpStepTo,
    isRunning,
    successfulSends,
    subscriptionItems,
    lastItemSeenByUserLookup,
    sendItem,
    editItem,
    deleteItem,
    seenItem,
  };
  return (
    <TourStateContext.Provider value={contextValue}>
      {" "}
      {children}
    </TourStateContext.Provider>
  );
};
