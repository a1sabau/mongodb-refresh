import { ObjectId } from "mongoose";

export type Ref<T> = T | ObjectId;

export type NestedKeyProps = {
  [key: string]: string | NestedKeyProps;
};
