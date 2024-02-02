import { join } from "path";
import { Worker, isMainThread, parentPort } from "worker_threads";

export type SyncWorkerData = {
  filepath: string;
};

export type SyncPostMessage = Partial<{
  status: string;
  error: Error;
}>;

export function postMessage(msg: SyncPostMessage) {
  return isMainThread ? console.log(msg.status || msg.error) : parentPort.postMessage(msg);
}

export class SyncAdapter {
  public syncInProgress: boolean = false;

  public run(filepath: string): void {
    if (this.syncInProgress) {
      console.error("sync already in progress");
      return;
    }

    this.syncInProgress = true;
    console.log("preparing to launch a new sync worker thread");
    const workerData: SyncWorkerData = { filepath };

    /*
    figure out if we're running in ts-node or not
    if we do, we need to require ts-node/register when spawning the worker
    also change the worker file extension accordingly
    */
    const isTsNode = /\.ts$/.test(__filename);
    const workerFile = isTsNode ? "sync.worker.ts" : "sync.worker.js";
    const execArgv = isTsNode ? ["--require", "ts-node/register"] : [];

    const worker = new Worker(join(__dirname, workerFile), {
      workerData,
      execArgv,
    });

    worker.on("message", this.syncMessageHandler.bind(this));
    worker.on("error", this.syncErrorHandler.bind(this));
    worker.on("exit", this.syncExitHandler.bind(this));
  }

  syncMessageHandler(msg: SyncPostMessage) {
    console.log(msg.status || msg.error);
  }

  syncErrorHandler(err: Error) {
    this.syncInProgress = false;
    console.error("Worker error", err);
  }

  syncExitHandler(code: number) {
    this.syncInProgress = false;

    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
    } else {
      console.log("Worker ended");
    }
  }
}
