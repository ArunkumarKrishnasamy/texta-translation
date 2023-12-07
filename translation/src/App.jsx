import { useState } from "react";

import "./App.css";
// import Topbar from "./Components/Topbar";
// import Main from "./Components/Main";
import { BrowserRouter, Routes, Route, Link, Outlet } from "react-router-dom";
import Translator_Dashboard from "./Components/Translator_Dashboard";
import Home from "./Components/Home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Translator_Dashboard />}></Route>
        <Route path="/translation/:file_id" element={<Home />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
