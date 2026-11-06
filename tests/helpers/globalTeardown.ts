import { MongoMemoryServer } from "mongodb-memory-server";

const globalTeardown = async () => {
  await (globalThis as { mongod?: MongoMemoryServer }).mongod?.stop();
};

export default globalTeardown;
