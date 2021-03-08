type Payload = Record<string, string | undefined> & {
  thumbnail?: string;
  primaryId?: string;
  secondaryId?: string;
};

export interface PayloadAndType {
  type: string;
  payload: Payload;
}
