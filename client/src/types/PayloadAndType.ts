export type Payload = {
  thumbnail?: string;
  embeddableUrl?: string;
}; // & Record<string, string | undefined>

export interface PayloadAndType {
  type: string;
  payload: Payload;
}
