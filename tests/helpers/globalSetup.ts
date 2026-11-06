import { MongoMemoryServer } from "mongodb-memory-server";

const globalSetup = async () => {
  // The first start can be slow, it may have to download MongoDB.
  const mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 180000 } });

  (globalThis as { mongod?: MongoMemoryServer }).mongod = mongod;
  process.env.MONGO_URI = mongod.getUri();
};

export default globalSetup;
