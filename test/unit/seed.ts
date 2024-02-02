import { ProducerModel } from "../../src/producer/Producer.entity";
import { ProductModel } from "../../src/product/Product.entity";

export async function seedDatabase() {
  const producer = {
    name: "ProducerA",
    country: "CountryA",
    region: "RegionA",
  };
  const producerModel = new ProducerModel(producer);
  await producerModel.save();

  const product = {
    name: "ProductA",
    vintage: "2020",
    producer: producerModel,
  };
  await new ProductModel(product).save();

  return {
    producer,
    product: {
      ...product,
      producer,
    },
  };
}
