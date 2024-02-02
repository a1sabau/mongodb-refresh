import "dotenv/config";
import * as request from "supertest";
import { bootstrap, shutdown } from "../../../src/bootstrap";
import { seedDatabase } from "../seed";
import { Connection } from "mongoose";
import { NestedKeyProps } from "../../../src/types";
import { ProductModel } from "../../../src/product/Product.entity";

describe("ProductResolver", () => {
  let app: Express.Application;
  let connection: Connection;
  let expectedProduct: NestedKeyProps;

  beforeAll(async () => {
    ({ app, connection } = await bootstrap());
    await connection.db.dropDatabase();
    ({ product: expectedProduct } = await seedDatabase());
  });

  afterAll(async () => {
    await shutdown();
  });

  it("should return all products", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        {
            GetProducts {
            _id
            name
            vintage
            }
        }
        `,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.GetProducts.length).toEqual(1);
    const actualProduct = response.body.data.GetProducts[0];

    expect(actualProduct._id).toBeDefined();

    // products returned from list either don't contain the producer or contain only the producer's _id even if extra info is requested
    const expectedListProduct = { ...expectedProduct };
    delete expectedListProduct.producer;
    expect(actualProduct).toMatchObject(expectedListProduct);
  });

  it("should return full product by id using $lookup", async () => {
    const product = await ProductModel.findOne();
    const actualProductId = product._id;

    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        {
          GetProductByLookup (_id: "${actualProductId}") {
            _id
            name
            vintage
            producer {
              name
              country
              region
            }
            }
        }
        `,
      });

    expect(response.status).toBe(200);
    const actualProduct = response.body.data.GetProductByLookup;

    expect(actualProduct._id).toBeDefined();
    expect(actualProduct).toMatchObject(expectedProduct);
  });

  it("should return full product by id using populate", async () => {
    const product = await ProductModel.findOne();
    const actualProductId = product._id;

    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        {
          GetProductByPopulate (_id: "${actualProductId}") {
            _id
            name
            vintage
            producer {
              name
              country
              region
            }
            }
        }
        `,
      });

    expect(response.status).toBe(200);
    const actualProduct = response.body.data.GetProductByPopulate;

    expect(actualProduct._id).toBeDefined();
    expect(actualProduct).toMatchObject(expectedProduct);
  });
});
