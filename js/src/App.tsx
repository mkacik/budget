import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return <div>Budget</div>;
}

const domContainer = document.querySelector("#root")!;
const root = createRoot(domContainer);
root.render(<App />);
