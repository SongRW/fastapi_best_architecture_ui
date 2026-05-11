import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
  RouteRecordStringComponent,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { message } from 'ant-design-vue';

import { getAllMenusApi } from '#/api';
import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

/**
 * 递归过滤掉 Qt 桌面端路由，只保留 Vue Web 路由
 * Qt 路由的 component 以 "desktop" 开头（如 "desktop"、"desktop:U_HomePage"）
 * 目录路由（component 为 null）仅在其子路由全部是 Qt 路由时才被过滤
 */
function filterQtRoutes(
  routes: RouteRecordStringComponent[],
): RouteRecordStringComponent[] {
  return routes
    .map((route) => {
      const isQtRoute =
        !!route.component && route.component.startsWith('desktop');
      const filteredChildren = route.children
        ? filterQtRoutes(route.children)
        : undefined;

      // Qt 路由节点直接过滤
      if (isQtRoute) {
        return null;
      }

      // 目录路由（component 为 null）：如果子路由全部被过滤，也过滤该目录
      if (filteredChildren !== undefined && filteredChildren.length === 0) {
        return null;
      }

      return {
        ...route,
        ...(filteredChildren !== undefined
          ? { children: filteredChildren }
          : {}),
      };
    })
    .filter(Boolean) as RouteRecordStringComponent[];
}

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const pageMap: ComponentRecordType = {
    ...import.meta.glob('../views/**/*.vue'),
    ...import.meta.glob('../plugins/**/*.vue'),
  };

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  return await generateAccessible(preferences.app.accessMode, {
    ...options,
    fetchMenuListAsync: async () => {
      message.loading({
        content: `${$t('common.loadingMenu')}...`,
        duration: 1.5,
      });
      const allMenus = await getAllMenusApi();
      // 在数据源头过滤 Qt 路由，避免框架层处理不识别的组件
      return filterQtRoutes(allMenus);
    },
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });
}

export { generateAccess };
