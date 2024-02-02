import { workerData } from "worker_threads";
import { SyncCsv } from "./SyncCsv";
import { SyncWorkerData } from "./SyncAdapter";
import { connect } from "mongoose";

// call connect and close it
async function run() {
  const mongoose = await connect(process.env.MONGODB_URI);

  /*
  depending on workdata we can start different sync types in the current worker, for now only csv is available
  */
  const syncCsv = new SyncCsv((workerData as SyncWorkerData).filepath);
  await syncCsv.run();

  // close the connection when thread ends
  await mongoose.connection.close();
}

run();
