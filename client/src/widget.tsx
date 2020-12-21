import React, { useState } from "react";
import { User } from "../../shared/User";
import { Pinboard, PinboardData } from "./pinboard";
import { SelectPinboard } from "./selectPinboard";
import Modal from "react-modal";

export interface WidgetProps {
  user: User;
}

export const Widget = (props: WidgetProps) => {
  const [pinboards, setPinboards] = useState<PinboardData[]>([]);

  const openPinboard = (pinboardData: PinboardData) =>
    !pinboards.includes(pinboardData) &&
    setPinboards([...pinboards, pinboardData]);

  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // TODO: provide visual indicator that more than one pinboard is open and a way to toggle between pinboards

  return (
    <>
      <button onClick={() => setModalOpen(!modalOpen)}>Select Pinboard</button>
      <Modal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        contentLabel="Select a pinboard"
        ariaHideApp={false}
      >
        <button onClick={() => setModalOpen(false)}>close</button>
        <SelectPinboard openPinboard={openPinboard} />
      </Modal>
      {pinboards.map((pinboardData) => (
        <Pinboard
          {...props}
          pinboardData={pinboardData}
          key={pinboardData.id}
        />
      ))}
    </>
  );
};
