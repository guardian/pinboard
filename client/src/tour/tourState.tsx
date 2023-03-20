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
import { useApolloClient } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { STATUS } from "react-joyride";

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
            "X-is-demo": isRunning,
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

    if (tourStepId) {
      tourStepMap[tourStepId].isIndexView
        ? clearSelectedPinboard()
        : openPinboard(demoPinboardData, false);
    }
  }, [stepIndex]);

  const { openPinboard, clearSelectedPinboard } = useGlobalStateContext();

  const continueTourTo = (nextStepIndex: number) => {
    setTourState({ ...tourState, isRunning: false });
    requestAnimationFrame(() =>
      setTourState({ isRunning: true, stepIndex: nextStepIndex })
    );
  };

  const handleCallback = (data: CallBackProps) => {
    const { type, index, action, status } = data;

    if (status === (STATUS.FINISHED as string)) {
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
        case ACTIONS.CLOSE: {
          setTourState({ isRunning: false, stepIndex: -1 });
          break;
        }
      }
    }
  };

  const start = () => {
    openPinboard(demoPinboardData, false);
    clearSelectedPinboard();
    setTourState({ ...tourState, isRunning: false });
    setTimeout(() => setTourState({ isRunning: true, stepIndex: 0 }), 1);
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
      {" "}
      {children}
    </TourStateContext.Provider>
  );
};
