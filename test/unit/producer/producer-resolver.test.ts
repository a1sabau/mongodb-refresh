import "dotenv/config";
import * as request from "supertest";
import { bootstrap, shutdown } from "../../../src/bootstrap";
import { seedDatabase } from "../seed";
import { Connection } from "mongoose";

describe("ProducerResolver", () => {
  let app: Express.Application;
  let connection: Connection;
  let expectedProducer: { name: string; country: string; region: string };

  beforeAll(async () => {
    ({ app, connection } = await bootstrap());
    await connection.db.dropDatabase();
    ({ producer: expectedProducer } = await seedDatabase());
  });

  afterAll(async () => {
    await shutdown();
  });

  it("should return all producers", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        {
            GetProducers {
            _id
            name
            country
            region
            }
        }
        `,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.GetProducers.length).toEqual(1);
    const actualProducer = response.body.data.GetProducers[0];

    expect(actualProducer._id).toBeDefined();
    expect(actualProducer).toMatchObject(expectedProducer);
  });
});
