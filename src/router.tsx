import { createBrowserRouter } from "react-router-dom";
import Landing from "@/pages/Landing";
import Index from "@/pages/Index";
import NewReview from "@/pages/NewReview";
import ReviewsList from "@/pages/ReviewsList";
import ReviewView from "@/pages/ReviewView";
import NotFound from "@/pages/NotFound";
import { ProtectedLayout } from "@/layouts/ProtectedLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/dashboard",
            element: <Index />,
          },
          {
            path: "/new-review",
            element: <NewReview />,
          },
          {
            path: "/reviews",
            element: <ReviewsList />,
          },
          {
            path: "/review/:id",
            element: <ReviewView />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;

