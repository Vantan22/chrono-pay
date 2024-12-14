import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProjectPage } from "@/pages/ProjectPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { MainLayout } from "@/layouts/MainLayout";
import { PrivateRoute } from "./PrivateRoute";
import { TaskPage } from "@/pages/TaskPage";
import { TimeTrackingPage } from "@/pages/TimeTrackingPage";
import { IncomePage } from "@/pages/IncomePage";
import { useEffect } from 'react';
import { updateMetaTags } from '@/utils/metaTags';
import { Navigate } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/",
    element: <PrivateRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: "dashboard",
            element: <DashboardPage />,
          },
          {
            path: "projects",
            element: <ProjectPage />,
          },
          {
            path: "tasks",
            element: <TaskPage />,
          },
          {
            path: "timesheet",
            element: <TimeTrackingPage />,
          },
          {
            path: "income",
            element: <IncomePage />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "settings",
            element: <div>Settings Page</div>,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
