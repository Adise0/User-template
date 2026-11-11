import { randomUUID } from "node:crypto";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import os from "node:os";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Users from "../../src/database/models/Users";
import app from "../../src/server";
import { mailbox, resetMailbox } from "./fakeNodemailer";

let server: Server;
let baseUrl = "";
let ipCounter = 0;
let userCounter = 0;

// Boots the API on a database of its own for the test file, and empties it before every test.
export const useApi = () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI as string, {
      dbName: `test-${randomUUID()}`,
      serverSelectionTimeoutMS: 10000,
      // The driver loads "os" with a dynamic import(), which Jest's VM doesn't support: it fails
      // silently and the handshake goes out without its metadata, so the server refuses it.
      runtimeAdapters: { os },
    });
    await Users.init();

    // Lets each call come from its own IP, so the per-IP rate limits don't leak between tests.
    app.set("trust proxy", "loopback");

    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => resolve());
    });
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  beforeEach(async () => {
    await Users.deleteMany({});
    resetMailbox();
  });

  afterAll(async () => {
    // If the setup failed there's no server, and crashing here would hide the real error.
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
};

interface CallOptions {
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
  ip?: string;
}

export const newIp = () => {
  ipCounter += 1;
  return `10.0.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
};

export const call = async (method: string, url: string, options: CallOptions = {}) => {
  const { body, token, headers, ip = newIp() } = options;

  const response = await fetch(baseUrl + url, {
    method,
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();

  const isJson = response.headers.get("content-type")?.includes("json");

  return {
    status: response.status,
    headers: response.headers,
    json: isJson && text ? JSON.parse(text) : {},
    text,
  };
};

// A plain HTML form post, like Apple's callback or a cross-site form. Redirects aren't followed.
export const postForm = (url: string, form: Record<string, string>) =>
  fetch(baseUrl + url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": newIp() },
    body: new URLSearchParams(form),
    redirect: "manual",
  });

export const secondsAgo = (seconds: number) => new Date(Date.now() - seconds * 1000);

export const wait = (milliseconds: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

// Most emails go out after the response, so tests wait for them instead of expecting them at once.
export const waitForEmail = async (to: string, subjectPart = "") => {
  const findEmail = () =>
    mailbox.sent.filter((email) => email.to === to && email.subject.includes(subjectPart)).at(-1);

  for (let tries = 0; tries < 250; tries += 1) {
    const email = findEmail();

    if (email) {
      return email;
    }

    await wait(20);
  }

  throw new Error(`No email to ${to} with "${subjectPart}" in the subject`);
};

// For checking an email did NOT go out, or that background work has finished.
// Has to outlast a bcrypt hash at the configured saltRounds (an OTP is hashed before it's sent).
export const settle = () => wait(1000);

export const tokenFromLink = (html: string, path: string) => html.split(path)[1].split('"')[0];

export const otpFromEmail = (html: string) => html.split('otp-code">')[1].split("<")[0];

export const registration = (overrides: Record<string, unknown> = {}) => ({
  firstName: "Ann",
  lastName: "Smith",
  username: "Alice_1",
  email: "alice@x.com",
  password: "password123",
  ...overrides,
});

export const register = (overrides: Record<string, unknown> = {}) =>
  call("POST", "/auth/register", { body: registration(overrides) });

export const testPassword = "password123";

// Puts an already activated user straight in the database.
export const createUser = async (overrides: Record<string, unknown> = {}) => {
  userCounter += 1;
  const username = `user${userCounter}`;
  const email = `${username}@x.com`;

  return Users.create({
    information: { firstName: "Ann", lastName: "Smith", username, email },
    credentials: { username, email, password: await bcrypt.hash(testPassword, 4) },
    activatedAt: new Date(),
    ...overrides,
  });
};

export const login = async (email: string, password = testPassword) => {
  const { json } = await call("POST", "/auth/login", { body: { email, password } });
  return json.token as string;
};

export const loginAs = async (overrides: Record<string, unknown> = {}) => {
  const user = await createUser(overrides);
  return { user, token: await login(user.credentials.email) };
};

// A valid session whose last real login was long ago, so it doesn't count as fresh.
export const staleSession = (user: { id: string; tokenVersion: number }) =>
  jwt.sign(
    {
      purpose: "SESSION",
      id: user.id,
      tokenVersion: user.tokenVersion,
      sessionId: randomUUID(),
      authTime: 1000,
    },
    process.env.TOKEN_SECRET as string,
  );

export const getMe = (token: string) => call("GET", "/users/myUser", { token });
