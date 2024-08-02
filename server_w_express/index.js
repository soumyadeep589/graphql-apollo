const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { PubSub } = require("graphql-subscriptions");
const { createServer } = require('http');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');

const bodyParser = require("body-parser");
const cors = require("cors");
const { default: axios } = require("axios");

const pubsub = new PubSub();

// Sample data
let todos = [
  { id: "1", title: "John Doe", completed: false },
  { id: "2", title: "Jane Doe", completed: false },
];

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  
  const typeDefs = `
    type User {
        id: ID!
        name: String!
        username: String!
        email: String!
    }
    type Todo {
        id: ID!
        title: String!
        completed: Boolean
    }
    type Message {
        id: ID!
        content: String!
        author: String!
    }

    type Query {
        getTodos: [Todo]
        getUsers: [User]
        getUser(id: ID!): User
        messages: [Message]
    
    }
    
    type Mutation {
      addTodo(title: String!): Todo!
      addMessage(content: String!, author: String!): Message
    
    }
    type Subscription {
        messageAdded: Message
    }
  `;
  const resolvers = {
    // Todo: {
    //   user: async (todo) =>
    //     (
    //       await axios.get(
    //         `https://jsonplaceholder.typicode.com/users/${todo.userId}`
    //       )
    //     ).data,
    // },
    Query: {
      getTodos: () => todos,
      getUsers: async () =>
        (await axios.get("https://jsonplaceholder.typicode.com/users")).data,
      getUser: async (parent, { id }) =>
        (await axios.get(`https://jsonplaceholder.typicode.com/users/${id}`))
          .data,
    },
    Mutation: {
      addTodo: (parent, args) => {
        const newTodo = { id: todos.length + 1, ...args };
        todos.push(newTodo);
        return newTodo;
      },
      addMessage: (root, args) => {
        const message = {
          id: Date.now(),
          content: args.content,
          author: args.author,
        };
        // Save the message to your data source

        // Publish the event
        pubsub.publish("MESSAGE_ADDED", { messageAdded: message });

        return message;
      },
    },
    Subscription: {
      messageAdded: {
        subscribe: () => pubsub.asyncIterator(["MESSAGE_ADDED"]),
      },
    },
  };

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/subscriptions',
  });
  const serverCleanup = useServer({ schema }, wsServer);

  const server = new ApolloServer({
    schema,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),
  
      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();
  app.use("/graphql", cors(),bodyParser.json(), expressMiddleware(server));

  httpServer.listen(8000, () => console.log("server started at port 8000"));
}

startServer();
