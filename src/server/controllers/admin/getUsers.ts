import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import adminUserFields from "./adminUserFields";

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Lists users, newest first. The search matches the start of the email or username, which are
// stored lowercased, so it can use their indexes.
const getUsers = async (_req: Request, res: Response, next: NextFunction) => {
  const { page, limit, search, role, isDisabled, isActivated } = res.locals.listQuery;

  const filter: Record<string, unknown> = {};

  if (search) {
    const startsWithSearch = new RegExp(`^${escapeRegex(search.toLowerCase())}`);
    filter.$or = [
      { "credentials.email": startsWithSearch },
      { "credentials.username": startsWithSearch },
    ];
  }

  if (role) {
    filter.role = role;
  }

  if (isDisabled !== undefined) {
    filter.isDisabled = isDisabled;
  }

  if (isActivated !== undefined) {
    filter.activatedAt = isActivated ? { $ne: null } : null;
  }

  try {
    const [users, total] = await Promise.all([
      Users.find(filter)
        .select(adminUserFields)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Users.countDocuments(filter),
    ]);

    res.json({ users, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export default getUsers;
