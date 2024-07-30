const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const bodyParser = require("body-parser");
const cors = require("cors");
const { default: axios } = require("axios");

// Sample data
let todos = [
  { id: "1", title: "John Doe", completed: false },
  { id: "2", title: "Jane Doe", completed: false },
];

async function startServer() {
  const app = express();
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

    type Query {
        getTodos: [Todo]
        getUsers: [User]
        getUser(id: ID!): User
    
    }
    
    type Mutation {
      addTodo(title: String!): Todo!
    
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
    },
  };
  const server = new ApolloServer({ typeDefs, resolvers });

  app.use(bodyParser.json());
  app.use(cors());

  await server.start();
  app.use("/graphql", expressMiddleware(server));

  app.listen(8000, () => console.log("server started at port 8000"));
}

startServer();
