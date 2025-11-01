import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://root:rootpassword@localhost:27017/?authSource=admin";
const dbName = process.env.MONGODB_DB || "hack2heal";

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  await client.db(dbName).command({ ping: 1 });
  console.log("MongoDB reachable and responding.");
  await client.close();
}

main().catch((e) => {
  console.error("MongoDB check failed:", e?.message || e);
  process.exit(1);
});
