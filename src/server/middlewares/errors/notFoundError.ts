import { Request, Response } from "express";
import { getNotFoundError } from "../../../data/errorObjects/responseErrors";

const notFoundError = (_req: Request, res: Response) => {
  const notFoundErrorResponse = getNotFoundError(); // Grabing the error object from the builder

  res.status(404).json(notFoundErrorResponse); // Sending the error as the response with the correct code
};

export default notFoundError;
