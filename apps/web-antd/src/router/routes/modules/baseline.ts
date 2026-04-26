import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'BaselineManagement',
    path: '/baseline',
    meta: {
      title: $t('page.menu.baselineManagement'),
      icon: 'mdi:cog-outline',
      order: 10,
    },
    children: [
      {
        name: 'Baseline',
        path: '',
        alias: 'baseline',
        component: () => import('#/views/baseline/index.vue'),
        meta: {
          title: $t('page.menu.projectBaseline'),
          icon: 'mdi:tune-vertical',
        },
      },
      {
        name: 'BaselineConfigItem',
        path: 'config-item',
        component: () => import('#/views/baseline/config-item/index.vue'),
        meta: {
          title: $t('page.menu.baselineConfigItem'),
          icon: 'mdi:format-list-bulleted-square',
        },
      },
      {
        name: 'BaselineConfig',
        path: ':id/config',
        component: () => import('#/views/baseline/config/index.vue'),
        meta: {
          title: '工况配置',
          icon: 'mdi:cog',
          hideInMenu: true,
        },
      },
      {
        name: 'BaselineV2',
        path: 'baseline-v2',
        component: () => import('#/views/baseline-v2/index.vue'),
        meta: {
          title: $t('page.menu.projectBaselineV2'),
          icon: 'mdi:flask-outline',
          hideInMenu: true,
        },
      },
    ],
  },
];

export default routes;
