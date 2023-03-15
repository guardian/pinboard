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
import { demoPinboardData } from "../../../shared/tour";
import { ApolloLink, useApolloClient } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

type TourStepRefMap = Record<TourStepID, React.RefObject<HTMLDivElement>>;

interface TourStateContextShape {
  isRunning: boolean;
  stepIndex: number;
  start: () => void;
  refs: React.RefObject<HTMLDivElement>[];
  getRef: (stepId: TourStepID) => React.RefObject<HTMLDivElement>;
  handleCallback: (data: CallBackProps) => void;
  jumpStepTo: (stepId: TourStepID) => void;
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

export const useTourStepRef = (stepId: TourStepID) =>
  useTourStateContext().getRef(stepId);

export const useTourStepRefs = () => useTourStateContext().refs;

export const useTourProgress = () => {
  const { isRunning, stepIndex, handleCallback, start } = useTourStateContext();

  return {
    stepIndex,
    handleCallback,
    run: isRunning,
    start,
  };
};

export const useJumpToTourStep = (stepId: TourStepID) => {
  const { jumpStepTo } = useTourStateContext();
  return () => jumpStepTo(stepId);
};

export const TourStateProvider: React.FC = ({ children }) => {
  // const refMap = useRef<TourStepRefMap>({}).current;
  const refMap: TourStepRefMap = useMemo(
    () =>
      Object.fromEntries(
        tourStepIDs.map((stepId) => [stepId, React.createRef<HTMLElement>()])
      ) as TourStepRefMap,
    []
  );
  const getRef = (stepId: TourStepID) => refMap[stepId];

  const [stepIndex, setStepIndex] = useState<number>(-1);

  const isRunning = stepIndex !== -1;

  const jumpStepTo = (stepId: TourStepID) => {
    const stepIndex = tourStepIDs.indexOf(stepId);
    setStepIndex(stepIndex + 1); // +1 is to account for the contents step
  };

  const apolloClient = useApolloClient();

  const apolloOriginalLinkChain = useMemo(() => apolloClient.link, []);

  useEffect(() => {
    apolloClient.setLink(
      ApolloLink.concat(
        setContext((_, { headers, ...restOfContext }) => ({
          ...restOfContext,
          headers: {
            ...headers,
            "X-is-demo": isRunning,
          },
        })),
        apolloOriginalLinkChain
      )
    );
  }, [stepIndex]);

  useLayoutEffect(() => {
    const tourStepId = tourStepIDs[stepIndex - 1]; // -1 is to account for the contents step

    if (tourStepId) {
      tourStepMap[tourStepId].isIndexView
        ? clearSelectedPinboard()
        : openPinboard(demoPinboardData, false);
    }
  }, [stepIndex]);

  const { openPinboard, clearSelectedPinboard } = useGlobalStateContext();

  const handleCallback = (data: CallBackProps) => {
    const { type, index, action } = data;
    console.log(data);

    if (type === EVENTS.TOUR_END) {
      setStepIndex(-1);
    } else if (type === EVENTS.STEP_AFTER) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      if (index !== 0 || nextStepIndex === 1) {
        setStepIndex(nextStepIndex);
      }
    }
  };

  const start = () => {
    openPinboard(demoPinboardData, false);
    clearSelectedPinboard();
    setStepIndex(0);
  };

  const contextValue: TourStateContextShape = {
    refs: Object.values(refMap),
    getRef,
    stepIndex,
    handleCallback,
    start,
    jumpStepTo,
    isRunning,
  };

  return (
    <TourStateContext.Provider value={contextValue}>
      {children}
    </TourStateContext.Provider>
  );
};
