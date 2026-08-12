import { createBrowserRouter } from "react-router";
import AppLayout from "@/shared/components/layout/AppLayout";
import BooksPage from "@/pages/BooksPage";
import BookDetailsPage from "@/pages/BookDetailsPage";
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
      {
        path: "books/:id",
        element: <BookDetailsPage />,
      },
    ],
  },
]);

export default router;
