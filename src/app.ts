/* eslint-disable @typescript-eslint/no-unused-vars */
import { seedDatabase } from "../test/unit/seed";
import { bootstrap } from "./bootstrap";

async function init() {
  // import common bootstrap seq also used in tests
  await bootstrap();

  // seed database with some (test) data
  // seedDatabase();
}

init();
