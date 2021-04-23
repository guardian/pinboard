type Payload = {
  thumbnail?: string;
  embeddableUrl?: string;
}; // & Record<string, string | undefined>

export interface PayloadAndType {
  type: string;
  payload: Payload;
}

export const OCTOPUS_IMAGING_ORDER_TYPE = "octopus-imaging-order";
