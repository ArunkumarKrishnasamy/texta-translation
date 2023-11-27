import React from "react";
import logo from "../assets/applogo.png";

function Topbar() {
  return (
    <div className="topbar">
      <div className="logo">
        <img className="logophoto" src={logo} alt="img"></img>
      </div>
      <div className="search"></div>
      <div className="notification">
        <div className="dictionaryIcon">
          <span class="material-symbols-outlined icon1">dictionary</span>
          <span className="text">Dictionary</span>
        </div>
        <span className="text">Ongoing Projects</span>
      </div>
    </div>
  );
}

export default Topbar;
