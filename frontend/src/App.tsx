import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { queryClient } from "@/lib/query-client";
import { toastContainerProps } from "@/lib/toast";
import { appRoutes } from "@/router";

const router = createBrowserRouter(appRoutes);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastContainer {...toastContainerProps} />
    </QueryClientProvider>
  );
}
