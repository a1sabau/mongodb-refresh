/* eslint-disable @typescript-eslint/no-unused-vars */
import { type MiddlewareFn } from "type-graphql";

export const ErrorInterceptor: MiddlewareFn = async ({ context, info }, next) => {
  try {
    return await next();
  } catch (err) {
    console.log("error", err);
    // Write error to file log
    // Hide errors from db like printing sql query

    // Rethrow the error
    throw err;
  }
};
