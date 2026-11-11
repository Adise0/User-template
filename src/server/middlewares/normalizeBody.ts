import { NextFunction, Request, Response } from "express";

// express.json() leaves req.body as undefined when a request has no body or an unrecognized
// Content-Type (eg. a POST sent with nothing attached). Defaulting it to {} here means the Joi
// validators are the ones that catch missing fields (producing a proper 400), instead of the
// controllers crashing on the destructure/assign and surfacing as an uncontrolled 500.
const normalizeBody = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.body) {
    req.body = {};
  }
  next();
};

export default normalizeBody;
