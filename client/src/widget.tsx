import React, { useState } from "react";
import { User } from "../../shared/User";
import { Pinboard, PinboardData } from "./pinboard";
import { SelectPinboard } from "./selectPinboard";
import Modal from "react-modal";
import { gql, useQuery } from "@apollo/client";

export interface WidgetProps {
  user: User;
  preselectedComposerId: string | undefined;
}

export const Widget = (props: WidgetProps) => {
  const [manuallyOpenedPinboards, setManuallyOpenedPinboards] = useState<
    PinboardData[]
  >([]);

  const preselectedPinboard = useQuery(gql`
      query MyQuery {
        getPinboardByComposerId(composerId: "${props.preselectedComposerId}")
        {    
          title
          status
          id
          composerId
        }
      }`).data?.getPinboardByComposerId;

  const pinboards: PinboardData[] = preselectedPinboard
    ? [preselectedPinboard, ...manuallyOpenedPinboards]
    : manuallyOpenedPinboards;

  const openPinboard = (pinboardData: PinboardData) =>
    !pinboards.includes(pinboardData) &&
    setManuallyOpenedPinboards([...manuallyOpenedPinboards, pinboardData]);

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
