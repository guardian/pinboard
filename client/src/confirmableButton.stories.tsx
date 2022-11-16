import React from "react";
import { Meta, Story } from "@storybook/react";
import { ConfirmableButton, ConfirmableButtonProps } from "./confirmableButton";
import { composer } from "../colours";

const onClickHandler = () => console.log("click");

export default {
  title: "Claim Button",
  component: ConfirmableButton,
  args: {
    label: "Claim",
    backgroundColor: composer.primary[300],
    onClick: onClickHandler,
  },
} as Meta;

const Template: Story<ConfirmableButtonProps> = (args) => (
  <ConfirmableButton {...args} />
);

export const Claim = Template.bind({});

export const ConfirmClaim = Template.bind({});
ConfirmClaim.args = {
  label: "Click again to confirm",
  backgroundColor: composer.warning[300],
};
