import { prop as Property, getModelForClass, index } from "@typegoose/typegoose";
import { ObjectType, Field, InputType } from "type-graphql";
import { GraphQLObjectID } from "graphql-scalars";
import { ObjectId } from "mongoose";
import { Producer } from "../producer/Producer.entity";
import { Ref } from "../types";

@ObjectType()
@index({ name: 1, vintage: 1, producer: 1 }, { unique: true })
export class Product {
  @Field(() => GraphQLObjectID)
  _id: ObjectId;

  @Field(() => String)
  @Property({ required: true })
  name: string;

  @Field(() => String)
  @Property({ required: true })
  vintage: string;

  @Field(() => Producer)
  @Property({ ref: Producer })
  producer: Ref<Producer>;
}

@InputType()
export class CreateProductInput implements Partial<Product> {
  @Field(() => String)
  name: string;

  @Field(() => String)
  vintage: string;

  @Field(() => GraphQLObjectID)
  producer: ObjectId;
}

@InputType()
export class UpdateProductInput implements Partial<Product> {
  @Field(() => GraphQLObjectID)
  _id: ObjectId;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  vintage?: string;

  @Field(() => GraphQLObjectID, { nullable: true })
  producer?: ObjectId;
}

export const ProductModel = getModelForClass(Product);
