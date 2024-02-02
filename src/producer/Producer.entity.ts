import { prop as Property, getModelForClass, index } from "@typegoose/typegoose";
import { ObjectType, Field } from "type-graphql";
import { GraphQLObjectID } from "graphql-scalars";
import { ObjectId } from "mongoose";

@ObjectType()
@index({ name: 1, country: 1 }, { unique: true })
export class Producer {
  @Field(() => GraphQLObjectID)
  _id: ObjectId;

  @Field(() => String)
  @Property({ required: true })
  name: string;

  @Field({ nullable: true })
  @Property()
  country?: string;

  @Field({ nullable: true })
  @Property()
  region?: string;
}

export const ProducerModel = getModelForClass(Producer);
