import { NextFunction, Request, Response } from "express";
import { getMethodNotAllowedError } from "../../data/errorObjects/routingErrors";

export enum Methods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
}

// Guards a route registered with router.all(path, method([...]), ...) so hitting it with the
// wrong verb returns a clear "this endpoint only accepts X" (405) instead of Express falling
// through to the generic 404 "Resource not found" handler.
const method = (...methods: Methods[]) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!methods.includes(req.method as Methods)) {
    res.set("Allow", methods.join(", "));
    next(getMethodNotAllowedError(methods, req.method));
    return;
  }
  next();
};

export default method;
