import { isRouteErrorResponse } from 'react-router-dom';

import { FRONTEND_CLIENT_ERROR, isWisePenError, parseErrorMessage } from '@/utils/error';

export interface AppErrorInfo {
  status: 'error' | 'warning' | '404' | '403' | '500' | 'success' | 'info';
  title: string;
  subTitle: string;
}

export const buildAppErrorInfo = (error: unknown): AppErrorInfo => {
  if (isRouteErrorResponse(error)) {
    const status =
      error.status === 404
        ? '404'
        : error.status === 403
          ? '403'
          : error.status >= 500
            ? '500'
            : 'warning';
    return {
      status,
      title: error.status >= 500 ? '出错啦' : `请求异常 (${error.status})`,
      subTitle: error.statusText || '页面加载失败，请稍后重试。',
    };
  }

  if (isWisePenError(error)) {
    const isInternal =
      error.code === FRONTEND_CLIENT_ERROR.INTERNAL_STATE ||
      error.code === FRONTEND_CLIENT_ERROR.UNKNOWN;
    return {
      status: isInternal ? '500' : 'warning',
      title: isInternal ? '页面发生错误' : '操作未完成',
      subTitle: parseErrorMessage(error),
    };
  }

  if (error instanceof Error) {
    return {
      status: '500',
      title: '出错啦',
      subTitle: '页面发生了意外错误，请刷新后重试。',
    };
  }

  return {
    status: '500',
    title: '出错啦',
    subTitle: '发生了未知错误，请稍后再试。',
  };
};
