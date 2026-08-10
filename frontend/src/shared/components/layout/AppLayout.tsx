import { Outlet } from "react-router";
import Navbar from "@/shared/components/layout/Navbar";

function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
