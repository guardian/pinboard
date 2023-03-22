import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TourStepID, tourStepIDs, tourStepMap } from "./tourStepMap";
import { ACTIONS, CallBackProps, EVENTS } from "react-joyride";
import { useGlobalStateContext } from "../globalState";
import { demoPinboardData, IS_DEMO_HEADER } from "../../../shared/tour";
import { useApolloClient } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { STATUS } from "react-joyride";
import { PendingItem } from "../types/PendingItem";
import { CreateItemInput, Item } from "../../../shared/graphql/graphql";

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
  successfulSends: PendingItem[];
  subscriptionItems: Item[];
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
    sendItem,
  } = useTourStateContext();

  return {
    stepIndex,
    handleCallback,
    isRunning,
    start,
    successfulSends,
    subscriptionItems,
    sendItem,
  };
};

export const useJumpToTourStep = (stepId: TourStepID) => {
  const { jumpStepTo } = useTourStateContext();
  return () => jumpStepTo(stepId);
};

export const TourStateProvider: React.FC = ({ children }) => {
  const apolloClient = useApolloClient();

  const apolloOriginalLinkChain = useMemo(() => apolloClient.link, []);

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

  useEffect(
    () =>
      apolloClient.setLink(
        setContext((_, { headers, ...restOfContext }) => ({
          ...restOfContext,
          headers: {
            ...headers,
            [IS_DEMO_HEADER]: isRunning,
          },
        })).concat(apolloOriginalLinkChain)
      ),
    [isRunning]
  );

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
        : openPinboard(demoPinboardData, false);
    }
  }, [stepIndex]);

  const {
    openPinboard,
    clearSelectedPinboard,
    userEmail,
  } = useGlobalStateContext();

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
          const nextStepIndex = tourHistory[tourHistory.length - 1];
          setTourHistory(tourHistory.slice(0, -1));
          continueTourTo(nextStepIndex);
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
    continueTourTo(0);
  };

  const [successfulSends, setSuccessfulSends] = useState<PendingItem[]>([]);
  const sendItem = (callback: () => void) => ({
    variables,
  }: {
    variables: { input: CreateItemInput };
  }) => {
    // TODO - consider slight delay;
    setSuccessfulSends([
      ...successfulSends,
      {
        ...variables.input,
        id: (successfulSends.length + 1).toString(),
        timestamp: new Date().toISOString(),
        pending: true,
        userEmail,
        claimedByEmail: null,
        relatedItemId: null,
        editHistory: null,
        deletedAt: null,
        mentions: [], //TODO - map variables.input.mentions to mention handle,
        groupMentions: [], //TODO - map variables.input.groupMentions to mention handle,
        claimable: variables.input.claimable || false,
      },
    ]);
    callback();
    // TODO - increment stepIndex (assuming the item fulfills the steps criteria)
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
    subscriptionItems: [],
    sendItem,
  };
  return (
    <TourStateContext.Provider value={contextValue}>
      {" "}
      {children}
    </TourStateContext.Provider>
  );
};
