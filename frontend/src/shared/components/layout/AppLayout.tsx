import { Outlet } from "react-router";
import Navbar from "@/shared/components/layout/Navbar";

function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
