import { NextFunction, Request, Response } from "express";

// DEBUG ONLY: lets a plain GET link (eg. clicked straight out of an email, with no frontend in
// between) reuse the exact same signedTokenDataValidator/signedIdTokenValidator/controller chain
// the real POST endpoints use, by lifting the token out of the URL and into req.body where that
// chain expects to find it. Remove once a real frontend page takes over hitting these via POST.
const tokenParamToBody = (req: Request, res: Response, next: NextFunction) => {
  req.body = { token: req.params.token };
  next();
};

export default tokenParamToBody;
