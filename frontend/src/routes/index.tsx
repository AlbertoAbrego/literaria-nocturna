import { createBrowserRouter, Navigate } from "react-router";
import AppLayout from "@/shared/components/layout/AppLayout";
import BooksPage from "@/pages/BooksPage";
import BookDetailsPage from "@/pages/BookDetailsPage";
import CreateBookPage from "@/pages/CreateBookPage";
import EditBookPage from "@/pages/EditBookPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/books" replace />,
      },
      {
        path: "books",
        element: <BooksPage />,
      },
      {
        path: "books/create",
        element: <CreateBookPage />,
      },
      {
        path: "books/:id/edit",
        element: <EditBookPage />,
      },
      {
        path: "books/:id",
        element: <BookDetailsPage />,
      },
    ],
  },
]);

export default router;
