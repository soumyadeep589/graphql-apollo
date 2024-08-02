import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useQuery, gql, useMutation, useSubscription } from "@apollo/client";

const GET_TODOS = gql`
  query GetTodos {
    getTodos {
      id
      title
    }
  }
`;

const ADD_TODO = gql`
  mutation AddTodo($title: String!) {
    addTodo(title: $title) {
      id
      title
    }
  }
`;

const MESSAGE_ADDED_SUBSCRIPTION = gql`
  subscription messageAdded {
    messageAdded {
      id
      content
      author
    }
  }
`;

function Messages() {
  const { data, loading, error } = useSubscription(MESSAGE_ADDED_SUBSCRIPTION);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h3>New Message</h3>
      {data && (
        <div>
          <p>ID: {data.messageAdded.id}</p>
          <p>Content: {data.messageAdded.content}</p>
          <p>Author: {data.messageAdded.author}</p>
        </div>
      )}
    </div>
  );
}

function DisplayTodo() {
  const { loading, error, data } = useQuery(GET_TODOS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return data.getTodos.map(({ id, title }) => (
    <div key={id}>
      <h3>{id}</h3>
      <p>{title}</p>
      <br />
    </div>
  ));
}

function AddTodo() {
  let input;
  const [addTodo, { data, loading, error }] = useMutation(ADD_TODO);

  if (loading) return "Submitting...";
  if (error) return `Submission error! ${error.message}`;

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addTodo({ variables: { title: input.value } });
          input.value = "";
        }}
      >
        <input
          ref={(node) => {
            input = node;
          }}
        />
        <button type="submit">Add Todo</button>
      </form>
    </div>
  );
}

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Messages />
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
