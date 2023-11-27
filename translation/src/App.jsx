import { useState } from "react";

import "./App.css";
import Topbar from "./Components/Topbar";
import Main from "./Components/Main";

function App() {
  return (
    <div className="content">
      <Topbar />

      <Main />
    </div>
  );
}

export default App;
