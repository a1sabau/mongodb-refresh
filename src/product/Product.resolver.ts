import { Resolver, Query, Arg, FieldResolver, Root, Info, Mutation } from "type-graphql";
import { CreateProductInput, Product, ProductModel, UpdateProductInput } from "./Product.entity";
import { Producer, ProducerModel } from "../producer/Producer.entity";
import { GraphQLResolveInfo } from "graphql";
import mongoose, { ObjectId } from "mongoose";
import { GraphQLObjectID } from "graphql-scalars";

@Resolver(() => Product)
export class ProductResolver {
  @Query(() => [Product])
  GetProducts() {
    return ProductModel.find();
  }

  @Query(() => Product)
  async GetProductByLookup(@Arg("_id") productId: string) {
    const productData = await ProductModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(productId) } },
      {
        $lookup: {
          from: "producers",
          let: { producerId: "$producer" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$producerId"] } } }],
          as: "producer",
        },
      },
      { $unwind: "$producer" },
    ]);

    return productData[0];
  }

  @Query(() => Product)
  async GetProductByPopulate(@Arg("_id") productId: string) {
    return ProductModel.findById(productId);
  }

  @Mutation(() => Product)
  CreateProduct(@Arg("data") data: CreateProductInput) {
    const product = new ProductModel(data);
    return product.save();
  }

  @Mutation(() => [GraphQLObjectID])
  async CreateProducts(@Arg("data", () => [CreateProductInput]) data: CreateProductInput[]) {
    /*
        trying to use map, like in
            const products = data.map(d => new ProductModel(d));
        will result in
            Excessive stack depth comparing types 'Document<T, TQueryHelpers, ?>' and 'Document<T, TQueryHelpers, ?>'.
            related to 
                https://github.com/microsoft/TypeScript/issues/34933
        */
    const products = [];
    for (const d of data) {
      const product = new ProductModel(d);
      products.push(product);
    }
    const { insertedIds } = await ProductModel.bulkSave(products);
    console.log("insertedIds", Object.values(insertedIds));
    return Object.values(insertedIds);
  }

  @Mutation(() => Product)
  UpdateProduct(@Arg("data") data: UpdateProductInput) {
    // return the updated document, not the initial one
    return ProductModel.findByIdAndUpdate(data._id, data, { new: true });
  }

  @Mutation(() => Number)
  async DeleteProducts(@Arg("ids", () => [GraphQLObjectID]) ids: ObjectId[]) {
    const deleteResult = await ProductModel.deleteMany({ _id: { $in: ids } });
    return deleteResult.deletedCount;
  }

  @FieldResolver(() => Producer)
  async producer(@Root() product: Product, @Info() info: GraphQLResolveInfo): Promise<ObjectId | Producer> {
    // only populate the producer info on certain graphql queries, leave provider as ObjectId on other queries
    if (info.path.prev.key === "GetProductByPopulate") {
      // as an alternative use mongoose-autopopulate plugin and annotate with @prop({ autopopulate: true, ref: Producer })
      return ProducerModel.findById(product.producer);
    } else {
      /*
            just return product.producer as it is, ObjectId

            if client does a request with producer info different than '_id' like 'name'
            srv will return "Cannot return null for non-nullable field Producer.name."
            */
      return product.producer;
    }
  }
}
