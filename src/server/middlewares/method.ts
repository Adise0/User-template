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
const method =
  (...methods: Methods[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    // Every route starts with this guard, so it's where the route pattern is known for the metrics.
    res.locals.metricsRoute = `${req.baseUrl}${req.route?.path ?? ""}`;

    // HEAD is a GET without the response body, so anything that answers GET answers it too.
    const allowedMethods = methods.includes(Methods.GET) ? [...methods, Methods.HEAD] : methods;

    if (!allowedMethods.includes(req.method as Methods)) {
      res.set("Allow", allowedMethods.join(", "));
      next(getMethodNotAllowedError(allowedMethods, req.method));
      return;
    }
    next();
  };

export default method;
