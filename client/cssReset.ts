import { css } from "@emotion/react";
import { space } from "@guardian/src-foundations";
import { textSans } from "@guardian/src-foundations/typography";
import { pinMetal } from "./colours";

export const cssReset = css`
  * {
    ${textSans.small({unit: "px"})}
    color: ${pinMetal};
    margin: 0;
    padding: 0; 
    border: none;  
  }

  h4 {
    ${textSans.medium({unit: "px"})}
    font-weight: 700;
    margin: ${space[1]}px 0;
    padding: 0;  
  }
`;
