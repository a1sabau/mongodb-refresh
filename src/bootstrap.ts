import "dotenv/config";
import * as http from "http";
import * as express from "express";
import { graphqlHTTP } from "express-graphql";
import { connect } from "mongoose";
import { buildSchema } from "type-graphql";
import { ProductResolver } from "./product/Product.resolver";
import { ProducerResolver } from "./producer/Producer.resolver";
import { TypegooseMiddleware } from "./utils/middleware/typegoose.middleware";
import { ErrorInterceptor } from "./utils/middleware/error.middleware";
import { SyncResolver } from "./sync/Sync.resolver";

let app: express.Express;
let srv: http.Server;
let mongoose: typeof import("mongoose");

export async function bootstrap() {
  try {
    // create mongoose connection
    mongoose = await connect(process.env.MONGODB_URI);

    // clean database
    // await mongoose.connection.db.dropDatabase();

    const schema = await buildSchema({
      resolvers: [ProductResolver, ProducerResolver, SyncResolver],
      globalMiddlewares: [TypegooseMiddleware, ErrorInterceptor],
      nullableByDefault: false,
      emitSchemaFile: true,
      // validate: false,
    });

    app = express();
    app.use(
      "/graphql",
      graphqlHTTP({
        schema: schema,
        graphiql: true,
      }),
    );

    // start express server
    srv = app.listen(3000);
    console.log("srv started on http://localhost:3000/graphql");
  } catch (err) {
    console.error(err);
  }

  return { app, srv, connection: mongoose.connection };
}

export async function shutdown() {
  await srv.close();
  await mongoose.connection.close();
}
