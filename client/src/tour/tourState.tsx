import React, { useContext, useRef } from "react";

type TourStepIDs = "myPinboards" | "teamsPinboards" | "messageArea";

type TourStepRefMap = Partial<Record<TourStepIDs, HTMLElement | null>>;

interface TourStateContextShape {
  refs: Array<HTMLElement | null>;
  setRef: (stepId: TourStepIDs) => (node: HTMLElement | null) => void;
  getRef: (stepId: TourStepIDs) => HTMLElement | null | undefined;
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

export const useSetTourStepRef = (stepId: TourStepIDs) =>
  useTourStateContext().setRef(stepId);

export const useTourStepRef = (stepId: TourStepIDs) =>
  useTourStateContext().getRef(stepId) || stepId;

export const useTourStepRefs = () => useTourStateContext().refs;

export const TourStateProvider: React.FC = ({ children }) => {
  const refMap = useRef<TourStepRefMap>({}).current;
  const getRef = (stepId: TourStepIDs) => refMap[stepId];
  const setRef = (stepId: TourStepIDs) => (node: HTMLElement | null) => {
    refMap[stepId] = node;
  };

  const contextValue: TourStateContextShape = {
    refs: Object.values(refMap),
    setRef,
    getRef,
  };

  return (
    <TourStateContext.Provider value={contextValue}>
      {children}
    </TourStateContext.Provider>
  );
};
