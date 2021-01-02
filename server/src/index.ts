import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import { ApolloServer } from 'apollo-server-express';
import cookieParser from 'cookie-parser';
import { typeDefs, resolvers } from './graphql';
import { connectDatabase } from './database';

const mount = async (app: Application) => {
  const db = await connectDatabase();

  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser(process.env.SECRET));

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }) => ({ db, req, res }),
  });
  server.applyMiddleware({ app, path: '/api' });

  app.listen(process.env.PORT);

  console.log(`[app]: http://localhost:${process.env.PORT}`);
};

mount(express());
