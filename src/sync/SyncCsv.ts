import { parse } from "csv-parse";
import { createReadStream } from "fs";
import { postMessage } from "./SyncAdapter";
import { Producer, ProducerModel } from "../producer/Producer.entity";
import { ProductModel } from "../product/Product.entity";
import { ObjectId } from "mongoose";

export type CsvRecord = {
  vintage: string;
  name: string;
  producer: string;
  country: string;
  region: string;
};

export class SyncCsv {
  filepath: string;
  batchSize: number;

  // total record count across all temp record batches
  recordCount: number = 0;

  constructor(filepath: string, batchSize: number = 100) {
    this.filepath = filepath;
    this.batchSize = batchSize;
  }

  public async run() {
    postMessage({ status: "sync csv start" });

    const parser = parse({
      delimiter: ",",
      columns: true,
      on_record: (record) => ({
        vintage: record.Vintage,
        name: record["Product Name"],
        producer: record.Producer,
        country: record.Country,
        region: record.Region,
      }),

      // limit number of csv lines parsed
      // to_line: 1000,
    });

    const readable = createReadStream(this.filepath).pipe(parser);
    readable
      /*
        can't enforce an async listener on readable event
        instead use the for await loop directly on readable below event handlers
        this way we process the csv entries in exact order enforcing each individual batch contains consecutive records
            even if the readable event fires multiple times during the time we manage to consume (save to db) elements from a single readabale event
            aka we read a lot faster the csv than saving it to the db
            stream backpressure is handled by the stream.pipe() method
        .on('readable', () => { console.log("readable") });
        */
      .on("error", (error) => {
        postMessage({ error });
      })
      .on("end", async () => {
        postMessage({
          status: "sync csv complete, total records parsed " + this.recordCount,
        });
      });

    const records: CsvRecord[] = [];

    // sync records in batches
    for await (const record of readable) {
      records.push(record);
      if (records.length % this.batchSize === 0) {
        await this.batchSync(records);
        records.length = 0;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));

    // there may be leftover records not filling an entire batch, sync them as well
    await this.batchSync(records);
  }

  private async batchSync(records: CsvRecord[]) {
    this.recordCount += records.length;

    // assume product vintage, product name, producer and country are unique
    const uniqueProductKey = (record: Partial<CsvRecord>) => `${record.vintage}-${record.name}-${record.producer}-${record.country}`;

    // assume producer and country are unique
    const uniqueProducerKey = (record: Partial<CsvRecord>) => `${record.producer}-${record.country}`;

    const uniqueProducts = this.filterRecords(records, uniqueProductKey)
      /*
      product requires a name, vintage, and producer, producer requires a name
      silently discard invalid csv rows not containing required fields
      */
      .filter((record) => record.name && record.vintage && record.producer);
    const uniqueProducers = this.filterRecords(uniqueProducts, uniqueProducerKey);

    // bulkWrite only returns upsertedIds, so we need to do a separate query to get all existing producers
    await ProducerModel.bulkWrite(
      uniqueProducers.map((producer) => ({
        updateOne: {
          filter: { name: producer.producer, country: producer.country },
          update: {
            name: producer.producer,
            country: producer.country,
            region: producer.region,
            $pullAll: { products: [producer.name] },
          },
          upsert: true,
        },
      })),
    );

    // get all existing producers by name and country arrays, matching name[0] with country[0], name[1] with country[1], etc.
    const existingProducers: Producer[] = await ProducerModel.find({
      $or: uniqueProducers.map((producer) => ({
        name: producer.producer,
        country: producer.country,
      })),
    });

    // construct a Map of unique producer keys to their ids
    const uniqueProducerIds: Map<string, ObjectId> = existingProducers.reduce((uniqueProducerIds, producer) => {
      const producerKey = `${producer.name}-${producer.country}`;

      uniqueProducerIds.set(producerKey, producer._id);
      return uniqueProducerIds;
    }, new Map());

    // bulkWrite the products, using uniqueProducerIds to get the producer ids
    await ProductModel.bulkWrite(
      uniqueProducts.map((product) => ({
        updateOne: {
          filter: {
            name: product.name,
            vintage: product.vintage,
            producer: uniqueProducerIds.get(uniqueProducerKey(product)),
          },
          update: {
            name: product.name,
            vintage: product.vintage,
            producer: uniqueProducerIds.get(uniqueProducerKey(product)),
          },
          upsert: true,
        },
      })),
    );

    postMessage({ status: "sync csv batch complete, total records parsed " + this.recordCount });
  }

  filterRecords(records: Partial<CsvRecord>[], keyFnc: (record: Partial<CsvRecord>) => string): Partial<CsvRecord>[] {
    const keySet = new Set();

    return records.filter((record) => {
      const key = keyFnc(record);
      if (!keySet.has(key)) {
        keySet.add(key);
        return true;
      }
      return false;
    });
  }
}
