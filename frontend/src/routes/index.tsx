import { createBrowserRouter } from "react-router";
import AppLayout from "@/shared/components/layout/AppLayout";
import BooksPage from "@/pages/BooksPage";
import HomePage from "@/pages/HomePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "books",
        element: <BooksPage />,
      },
    ],
  },
]);

export default router;
