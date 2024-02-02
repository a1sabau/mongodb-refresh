import { Resolver, Query, Arg } from "type-graphql";
import { Producer, ProducerModel } from "./Producer.entity";
import { Product, ProductModel } from "../product/Product.entity";

@Resolver()
export class ProducerResolver {
  @Query(() => [Producer])
  GetProducers() {
    return ProducerModel.find();
  }

  @Query(() => Producer)
  GetProducer(@Arg("_id") _id: string) {
    return ProducerModel.findById(_id);
  }

  @Query(() => [Product])
  GetProducerProducts(@Arg("_id") _id: string) {
    return ProductModel.find().where("producer").equals(_id);
  }
}
