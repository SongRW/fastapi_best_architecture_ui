import type { RouteRecordStringComponent } from '@vben/types';

import { $t } from '@vben/locales';

import { requestClient } from '#/api/request';

const legacyMenuTitleMap: Record<string, string> = {
  'page.menu.gm': 'page.menu.baselineManagement',
  'page.menu.gmBaseline': 'page.menu.projectBaseline',
  'page.menu.gmBaselineV2': 'page.menu.projectBaselineV2',
  'page.menu.gmConfigItem': 'page.menu.baselineConfigItem',
};

const legacyMenuNameMap: Record<string, string> = {
  GM: 'BaselineManagement',
  GmBaseline: 'Baseline',
  GmBaselineV2: 'BaselineV2',
  GmConfigItem: 'BaselineConfigItem',
};

const legacyComponentMap: Record<string, string> = {
  '/gm/baseline/index.vue': '/baseline/index.vue',
  '/gm/baseline-v2/index.vue': '/baseline-v2/index.vue',
  '/gm/config-item/index.vue': '/baseline/config-item/index.vue',
  '/baseline/baseline/index.vue': '/baseline/index.vue',
  '/views/gm/baseline/index.vue': '/views/baseline/index.vue',
  '/views/gm/baseline-v2/index.vue': '/views/baseline-v2/index.vue',
  '/views/gm/config-item/index.vue': '/views/baseline/config-item/index.vue',
};

function normalizeLegacyMenuTitle(title: string) {
  return legacyMenuTitleMap[title] ?? title;
}

function normalizeLegacyMenuName(name: string) {
  return legacyMenuNameMap[name] ?? name;
}

function normalizeLegacyMenuPath(path: null | string) {
  return path?.replace(/^\/gm(?=\/|$)/, '/baseline') ?? '';
}

function normalizeLegacyComponent(component: string): string;
function normalizeLegacyComponent(component: undefined): undefined;
function normalizeLegacyComponent(component?: string) {
  if (!component) {
    return component;
  }
  if (legacyComponentMap[component]) {
    return legacyComponentMap[component];
  }
  if (component.includes('/gm/baseline-v2/')) {
    return component.replace('/gm/baseline-v2/', '/baseline-v2/');
  }
  if (component.includes('/views/gm/baseline-v2/')) {
    return component.replace('/views/gm/baseline-v2/', '/views/baseline-v2/');
  }
  if (component.includes('/gm/')) {
    return component.replace('/gm/', '/baseline/');
  }
  return component.replace('/views/gm/', '/views/baseline/');
}

function resolveMenuTitle(title: string) {
  const normalizedTitle = normalizeLegacyMenuTitle(title);
  const translatedTitle = $t(normalizedTitle);
  return translatedTitle || normalizedTitle;
}

export interface SysMenuResult {
  id: number;
  title: string;
  translatedTitle?: string;
  name: string;
  path: string;
  sort: number;
  icon?: string;
  type: number;
  component?: string;
  perms?: string;
  status: number;
  display: number;
  cache: number;
  remark?: string;
  parent_id?: number;
  created_time: string;
}

export interface SysMenuTreeResult extends SysMenuResult {
  children?: SysMenuTreeResult[];
}

export interface SysMenuParams {
  title: string;
  name: string;
  path?: string;
  parent_id?: number;
  sort?: number;
  icon?: string;
  type?: number;
  component?: string;
  perms?: string;
  status?: number;
  display?: number;
  cache?: number;
  link?: string;
  remark?: string;
}

export interface SysMenuTreeParams {
  title?: string;
  status: number;
}

/**
 * 获取用户所有菜单
 */
export async function getAllMenusApi() {
  const data = await requestClient.get<RouteRecordStringComponent[]>(
    '/api/v1/sys/menus/sidebar',
  );

  const transformRoutes = (
    routes: RouteRecordStringComponent[],
  ): RouteRecordStringComponent[] => {
    return routes.map((route) => {
      const normalizedMeta = route.meta
        ? {
            ...route.meta,
            title:
              typeof route.meta.title === 'string'
                ? normalizeLegacyMenuTitle(route.meta.title)
                : route.meta.title,
          }
        : route.meta;

      return {
        ...route,
        name:
          typeof route.name === 'string'
            ? normalizeLegacyMenuName(route.name)
            : route.name,
        path: normalizeLegacyMenuPath(route.path),
        component: route.component
          ? normalizeLegacyComponent(route.component)
          : route.component,
        meta: normalizedMeta,
        children: route.children ? transformRoutes(route.children) : route.children,
      };
    });
  };

  return transformRoutes(data);
}

export async function getSysMenuTreeApi(params: SysMenuTreeParams) {
  const transformMenuTitles = (menuData: SysMenuTreeResult[]) => {
    return menuData.map((item) => {
      const transformedItem = {
        ...item,
        title: normalizeLegacyMenuTitle(item.title),
        name: normalizeLegacyMenuName(item.name),
        path: normalizeLegacyMenuPath(item.path),
        component: item.component
          ? normalizeLegacyComponent(item.component)
          : item.component,
        translatedTitle: resolveMenuTitle(item.title),
      };

      if (item.children && item.children.length > 0) {
        transformedItem.children = transformMenuTitles(item.children);
      }

      return transformedItem;
    });
  };

  const data = await requestClient.get<SysMenuTreeResult[]>(
    '/api/v1/sys/menus',
    {
      params,
    },
  );

  return transformMenuTitles(data);
}

export async function createSysMenuApi(data: SysMenuParams) {
  return requestClient.post('/api/v1/sys/menus', data);
}

export async function updateSysMenuApi(pk: number, data: SysMenuParams) {
  return requestClient.put(`/api/v1/sys/menus/${pk}`, data);
}

export async function deleteSysMenuApi(pk: number) {
  return requestClient.delete(`/api/v1/sys/menus/${pk}`);
}
