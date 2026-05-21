import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// 引入布局（保持同步加载，保证首屏壳子稳定）
import AdminLayout from '@/layouts/AdminLayout';
import AppLayout from '@/layouts/AppLayout';
import AuthLayout from '@/layouts/AuthLayout';
import HomeLayout from '@/layouts/HomeLayout';
import AdminRouteGuard from '@/views/admin/guard/AdminRouteGuard';

// 页面使用 lazy load，按路由切分 chunk
const AdminPage = lazy(() => import('@/views/admin/AdminPage'));
const Home = lazy(() => import('@/views/app/home'));
const Drive = lazy(() => import('@/views/app/drive/Drive'));
const MyGroup = lazy(() => import('@/views/app/group/MyGroup'));
const GroupDetail = lazy(() => import('@/views/app/group/GroupDetail'));
const Account = lazy(() => import('@/views/app/profile/Account'));
const Usage = lazy(() => import('@/views/app/profile/Usage'));
const Login = lazy(() => import('@/views/app/auth/Login'));
const Register = lazy(() => import('@/views/app/auth/Register'));
const ResetPassword = lazy(() => import('@/views/app/auth/ResetPassword'));
const NewPassword = lazy(() => import('@/views/app/auth/NewPassword'));
const VerifyEmail = lazy(() => import('@/views/app/auth/VerifyEmail'));
const NoteView = lazy(() => import('@/views/app/note'));
const PdfPreview = lazy(() => import('@/views/app/pdf/PdfPreview'));
const ResourceNotFound = lazy(() => import('@/views/app/error/ResourceNotFound'));
const AppError = lazy(() => import('@/views/app/error/AppError'));

const router = createBrowserRouter([
  // ==============================
  // 外部门户区域
  // ==============================
  {
    path: '/',
    element: <HomeLayout />,
    errorElement: <AppError />,
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },
  {
    path: '/login',
    element: <AuthLayout />,
    errorElement: <AppError />,
    children: [
      {
        index: true,
        element: <Login />,
      },
    ],
  },
  {
    path: '/register',
    element: <AuthLayout />,
    errorElement: <AppError />,
    children: [
      {
        index: true,
        element: <Register />,
      },
    ],
  },
  {
    path: '/reset-pwd',
    element: <AuthLayout />,
    errorElement: <AppError />,
    children: [
      {
        index: true,
        element: <ResetPassword />,
      },
    ],
  },
  {
    path: '/new-pwd',
    element: <AuthLayout />,
    errorElement: <AppError />,
    children: [
      {
        index: true,
        element: <NewPassword />,
      },
    ],
  },
  {
    path: '/verify-email',
    element: <AuthLayout />,
    errorElement: <AppError />,
    children: [
      {
        index: true,
        element: <VerifyEmail />,
      },
    ],
  },

  // ==============================
  // 内部系统区域
  // ==============================
  {
    path: '/app',
    element: <AppLayout />, // 承载：左侧导航 + 右侧助手 + 中间内容
    errorElement: <AppError />,
    children: [
      // 默认重定向到文档列表
      {
        index: true,
        element: <Navigate to="/app/drive" replace />,
      },
      {
        path: 'note',
        element: <NoteView />,
      },
      {
        path: 'note/:noteId',
        element: <NoteView />,
      },
      // 文档与云盘页
      {
        path: 'drive',
        element: <Drive />,
      },
      {
        path: 'my-group',
        element: <MyGroup />,
      },
      {
        path: 'my-group/:id',
        element: <GroupDetail />,
      },
      {
        path: 'profile/usage',
        element: <Usage />,
      },
      {
        path: 'profile/account',
        element: <Account />,
      },
      {
        path: 'pdf/:resourceId',
        element: <PdfPreview />,
      },
    ],
  },

  // ==============================
  // 管理后台区域
  // ==============================
  {
    path: '/admin',
    element: <AdminRouteGuard />,
    errorElement: <AppError />,
    children: [
      {
        element: <AdminLayout />, // 承载：admin 根页面内容
        children: [
          {
            index: true,
            element: <Navigate to="/admin/users" replace />,
          },
          {
            path: 'users',
            element: <AdminPage pageKey="users" />,
          },
          {
            path: 'resources',
            element: <AdminPage pageKey="resources" />,
          },
          {
            path: 'groups',
            element: <AdminPage pageKey="groups" />,
          },
          {
            path: 'announcements',
            element: <AdminPage pageKey="announcements" />,
          },
          {
            path: 'statistics',
            element: <AdminPage pageKey="statistics" />,
          },
          {
            path: 'permissions',
            element: <AdminPage pageKey="permissions" />,
          },
          {
            path: 'settings',
            element: <AdminPage pageKey="settings" />,
          },
          {
            path: 'logs',
            element: <AdminPage pageKey="logs" />,
          },
          {
            path: 'tasks',
            element: <AdminPage pageKey="tasks" />,
          },
        ],
      },
    ],
  },

  // ==============================
  // 兜底
  // ==============================
  {
    path: '*',
    element: <ResourceNotFound />,
  },
]);

export default router;
