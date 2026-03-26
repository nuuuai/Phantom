export const BROKER_DATA_TYPES = [
  "name",
  "phone",
  "email",
  "address",
  "age",
  "relatives",
] as const;

export type BrokerDataType = (typeof BROKER_DATA_TYPES)[number];
