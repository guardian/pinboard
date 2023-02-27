import React, { useContext, useRef, useState } from "react";
import { TourStepID, tourStepIDs } from "./tourStepMap";
import { ACTIONS, CallBackProps, EVENTS } from "react-joyride";

type TourStepRefMap = Partial<Record<TourStepID, HTMLElement | null>>;

interface TourStateContextShape {
  stepIndex: number;
  start: () => void;
  refs: Array<HTMLElement | null>;
  setRef: (stepId: TourStepID) => (node: HTMLElement | null) => void;
  getRef: (stepId: TourStepID) => HTMLElement | null | undefined;
  handleCallback: (data: CallBackProps) => void;
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

export const useSetTourStepRef = (stepId: TourStepID) =>
  useTourStateContext().setRef(stepId);

export const useTourStepRef = (stepId: TourStepID) =>
  useTourStateContext().getRef(stepId) || stepId;

export const useTourStepRefs = () => useTourStateContext().refs;

export const useTourProgress = () => {
  const { stepIndex, handleCallback, start } = useTourStateContext();

  return {
    stepIndex,
    handleCallback,
    run: stepIndex !== -1,
    start,
  };
};

export const TourStateProvider: React.FC = ({ children }) => {
  const refMap = useRef<TourStepRefMap>({}).current;
  const getRef = (stepId: TourStepID) => refMap[stepId];
  const setRef = (stepId: TourStepID) => (node: HTMLElement | null) => {
    refMap[stepId] = node;
  };
  const [stepIndex, setStepIndex] = useState<number>(-1);

  const handleCallback = (data: CallBackProps) => {
    const { type, index, action } = data;
    console.log(data);

    if (type === EVENTS.TOUR_END) {
      setStepIndex(-1);
    } else if (
      ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND] as string[]).includes(type)
    ) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      setStepIndex(nextStepIndex);
      const tourStepId = tourStepIDs[nextStepIndex];
      /* TODO - use globalStateContext to retrieve functions like setSelectedPinboard, clearSelectedPinboard (which drive the UI)
       and run them conditionally based on tourStepID */
    }
  };

  const contextValue: TourStateContextShape = {
    refs: Object.values(refMap),
    setRef,
    getRef,
    stepIndex,
    handleCallback,
    start: () => setStepIndex(0),
  };

  return (
    <TourStateContext.Provider value={contextValue}>
      {children}
    </TourStateContext.Provider>
  );
};
