/* eslint-disable import-x/prefer-default-export */

import { ErrorSeverety } from "../../types/errorTypes/ServerError";
import ControledError from "./ControledError";

export const getMethodNotAllowedError = (
  allowedMethods: string[],
  requestedMethod: string
): ControledError =>
  new ControledError({
    name: "METHODNOTALLOWED",
    message: `Method ${requestedMethod} not allowed, expected one of: ${allowedMethods.join(
      ", "
    )}`,
    statusCode: 405,
    messageToSend: `This endpoint only accepts: ${allowedMethods.join(", ")}`,
    severety: ErrorSeverety.low,
    extraData: {
      allowedMethods,
      requestedMethod,
    },
  });
