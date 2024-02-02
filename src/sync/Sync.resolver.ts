import { join } from "path";
import { Resolver, Mutation } from "type-graphql";
import { SyncAdapter } from "./SyncAdapter";

/*
only keep one instance of the sync adapter running at a time per Sync.resolver.module
this allows us to enforce a single sync mutation at a time
*/
const syncAdapter = new SyncAdapter();

@Resolver()
export class SyncResolver {
  @Mutation(() => Boolean)
  Sync() {
    // get the initial state of the sync adapter, after run() it will always show in progress
    const initialInProgressState = syncAdapter.syncInProgress;

    const filepath = join(process.cwd(), "data", "all_listings.csv");
    syncAdapter.run(filepath);

    return !initialInProgressState;
  }
}
