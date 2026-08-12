import { NavLink } from "react-router";

function Navbar() {
  return (
    <header className="h-16 border-b border-graphite bg-midnight">
      <nav className="mx-auto flex h-full w-full max-w-[1200px] items-center gap-6 px-4 sm:px-6">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "font-medium text-parchment" : "text-ash transition-colors duration-200 hover:text-fog"
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/books"
          className={({ isActive }) =>
            isActive ? "font-medium text-parchment" : "text-ash transition-colors duration-200 hover:text-fog"
          }
        >
          Books
        </NavLink>
      </nav>
    </header>
  );
}

export default Navbar;
