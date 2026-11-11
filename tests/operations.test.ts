import dns from "node:dns";
import { createServer, Server } from "node:http";
import { AddressInfo } from "node:net";
import mongoose from "mongoose";
import connectToDB from "../src/database";
import validateEnv from "../src/data/serverConfig/validateEnv";
import app from "../src/server";
import setupGracefulShutdown from "../src/server/setupGracefulShutdown";

const uri = () => process.env.MONGO_URI as string;

const validEnv = {
  CONN_STRING: "x",
  TOKEN_SECRET: "y".repeat(32),
  SMTP_HOST: "smtp.example.com",
  EMAIL: "e",
  EMAIL_PASSWORD: "p",
  FRONTEND_URL: "http://f",
  BACKEND_URL: "http://b",
};

describe("environment validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ...validEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("a valid environment passes", () => {
    expect(validateEnv).not.toThrow();
  });

  test("it names every problem, without showing the values", () => {
    process.env.TOKEN_SECRET = "short-secret";
    delete process.env.EMAIL;

    expect(validateEnv).toThrow(/TOKEN_SECRET.*EMAIL/);
    expect(validateEnv).not.toThrow(/short-secret/);
  });

  test("DNS_SERVERS has to be a list of IPs", () => {
    process.env.DNS_SERVERS = "8.8.8.8, 1.1.1.1";
    expect(validateEnv).not.toThrow();

    process.env.DNS_SERVERS = "8.8.8.8,not-an-ip";
    expect(validateEnv).toThrow(/DNS_SERVERS/);
  });

  test("SMTP_PORT and CORS_ORIGINS are checked when set", () => {
    process.env.SMTP_PORT = "587";
    process.env.CORS_ORIGINS = "http://localhost:3000, https://app.example.com";
    expect(validateEnv).not.toThrow();

    process.env.SMTP_PORT = "not-a-port";
    process.env.CORS_ORIGINS = "http://ok.com,not a url";
    expect(validateEnv).toThrow(/SMTP_PORT.*CORS_ORIGINS/);
  });
});

describe("connecting to the database", () => {
  const originalServers = dns.getServers();

  afterEach(async () => {
    delete process.env.DNS_SERVERS;
    dns.setServers(originalServers);
    await mongoose.disconnect();
  });

  test("the system DNS is left alone without DNS_SERVERS", async () => {
    await connectToDB(uri());

    expect(dns.getServers()).toEqual(originalServers);
  });

  test("DNS_SERVERS is applied", async () => {
    process.env.DNS_SERVERS = "9.9.9.9, 1.0.0.1";
    await connectToDB(uri());

    expect(dns.getServers()).toEqual(["9.9.9.9", "1.0.0.1"]);
  });

  test("a missing connection string is rejected", async () => {
    await expect(connectToDB(undefined)).rejects.toThrow("CONN_STRING");
  });
});

describe("health without a database", () => {
  test("answers 503", async () => {
    const server = await new Promise<Server>((resolve) => {
      const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    const { port } = server.address() as AddressInfo;

    const response = await fetch(`http://127.0.0.1:${port}/health`);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable", database: "disconnected" });

    server.closeAllConnections();
    server.close();
  });
});

describe("graceful shutdown", () => {
  test("SIGTERM closes the server and the database, then exits 0", async () => {
    await connectToDB(uri());

    const server = createServer();
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });
    setupGracefulShutdown(server);

    let resolveExit: (code: unknown) => void = () => {};
    const exitCalled = new Promise((resolve) => {
      resolveExit = resolve;
    });
    const exit = jest.spyOn(process, "exit").mockImplementation((code) => {
      resolveExit(code);
      return undefined as never;
    });

    process.emit("SIGTERM", "SIGTERM");
    const exitCode = await exitCalled;
    exit.mockRestore();

    expect(exitCode).toBe(0);
    expect(server.listening).toBe(false);
    expect(mongoose.connection.readyState).toBe(mongoose.ConnectionStates.disconnected);

    process.removeAllListeners("SIGTERM");
    process.removeAllListeners("SIGINT");
  });
});
