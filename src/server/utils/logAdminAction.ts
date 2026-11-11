import { Request, Response } from "express";

// Every admin action leaves one line in the logs saying who did what to whom, with the request id
// the logger adds. Search the logs for "audit" to follow them.
const logAdminAction = (
  req: Request,
  res: Response,
  action: string,
  details?: Record<string, unknown>,
) => {
  req.log.info(
    {
      audit: true,
      action,
      adminId: res.locals.userId,
      targetUserId: res.locals.requestedUserId,
      ...details,
    },
    "Admin action",
  );
};

export default logAdminAction;
