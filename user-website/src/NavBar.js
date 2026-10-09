import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext";

function NavBar() {
  const { username, logout } = useAuth();
  return (
    <nav className="nav-bar">
      <NavLink to="/" end>
        Battery builder
      </NavLink>
      <NavLink to="/batteries">Batteries</NavLink>
      <NavLink to="/library/parameter">Parameter sets</NavLink>
      <NavLink to="/library/instruction">Instruction sets</NavLink>
      <span className="nav-spacer" />
      <span>Signed in as {username}</span>
      <button onClick={logout}>Log out</button>
    </nav>
  );
}

export default NavBar;
