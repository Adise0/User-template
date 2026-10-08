import ResponseError from "../../types/errorTypes/ResponseError";

/* eslint-disable import/prefer-default-export */

// Not found error builder
export const getNotFoundError = (): ResponseError => ({
  error: true,
  code: 404,
  message: "Resource not found",
});

// Response error builder
export const buiildResponseError = (
  code: number,
  message: string
): ResponseError => ({
  error: true,
  code,
  message,
});
