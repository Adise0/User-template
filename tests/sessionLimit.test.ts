import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { call, createUser, getMe, useApi } from "./helpers/api";

jest.mock("../src/data/serverConfig/server-config", () => ({
  ...jest.requireActual("../src/data/serverConfig/server-config"),
  userSessionMaxAgeInHours: 24,
}));

useApi();

const sessionFrom = (user: { id: string }, hoursAgo: number) =>
  jwt.sign(
    {
      purpose: "SESSION",
      id: user.id,
      tokenVersion: 0,
      sessionId: randomUUID(),
      authTime: Math.floor(Date.now() / 1000) - hoursAgo * 60 * 60,
    },
    process.env.TOKEN_SECRET as string,
  );

test("a session inside the limit works", async () => {
  const user = await createUser();

  expect((await getMe(sessionFrom(user, 1))).status).toBe(200);
});

test("a session past the limit is rejected, and refreshing can't revive it", async () => {
  const user = await createUser();
  const token = sessionFrom(user, 25);
  const { status, json } = await getMe(token);

  expect(status).toBe(401);
  expect(json.code).toBe("INVALID_TOKEN");
  expect((await call("GET", "/auth/refreshToken", { token })).status).toBe(401);
});
