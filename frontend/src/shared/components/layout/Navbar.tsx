import { NavLink } from "react-router";

function Navbar() {
  return (
    <header className="border-b border-slate-800">
      <nav className="mx-auto flex w-full max-w-5xl items-center gap-6 px-4 py-4">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "font-semibold text-slate-100" : "text-slate-400 hover:text-slate-200"
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/books"
          className={({ isActive }) =>
            isActive ? "font-semibold text-slate-100" : "text-slate-400 hover:text-slate-200"
          }
        >
          Books
        </NavLink>
      </nav>
    </header>
  );
}

export default Navbar;
