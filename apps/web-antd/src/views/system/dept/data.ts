import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { SysDeptTreeResult } from '#/api';

import { $t } from '@vben/locales';

import { z } from '#/adapter/form';
import { getSysDeptTreeApi, getSysUserListApi } from '#/api';
import { DictEnum, getDictOptions } from '#/utils/dict';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '部门名称',
  },
  {
    component: 'Input',
    fieldName: 'leader',
    label: '负责人',
  },
  {
    component: 'Input',
    fieldName: 'phone',
    label: '手机号码',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      // options: [
      //   {
      //     label: '正常',
      //     value: 1,
      //   },
      //   {
      //     label: '停用',
      //     value: 0,
      //   },
      // ],
      options: getDictOptions(DictEnum.SYS_STATUS),
    },
    fieldName: 'status',
    label: $t('common.form.status'),
  },
];

export function useColumns(
  onActionClick?: OnActionClickFn<SysDeptTreeResult>,
): VxeGridProps['columns'] {
  return [
    { field: 'name', title: '名称', align: 'left', treeNode: true },
    { field: 'leader', title: '负责人' },
    { field: 'phone', title: '手机号码' },
    { field: 'email', title: '邮箱' },
    { field: 'sort', title: '排序' },
    {
      field: 'status',
      title: '状态',
      cellRender: {
        name: 'CellTag',
      },
    },
    {
      field: 'is_external',
      title: '外部客户',
      width: 100,
      cellRender: {
        name: 'CellTag',
      },
    },
    {
      field: 'created_time',
      title: $t('common.table.created_time'),
      width: 168,
      formatter: 'formatDateTime',
    },
    {
      field: 'operation',
      title: $t('common.table.operation'),
      align: 'center',
      fixed: 'right',
      width: 200,
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'add',
            text: '新增下级',
          },
          'edit',
          {
            code: 'delete',
            disabled: (row: SysDeptTreeResult) => {
              return row.id === '1';
            },
          },
        ],
      },
    },
  ];
}

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '部门名称',
    rules: 'required',
  },
  {
    component: 'ApiTreeSelect',
    componentProps: {
      allowClear: true,
      api: getSysDeptTreeApi,
      class: 'w-full',
      labelField: 'name',
      valueField: 'id',
      childrenField: 'children',
    },
    fieldName: 'parent_id',
    label: '父级部门',
  },
  {
    component: 'Input',
    fieldName: 'leader',
    label: '负责人',
  },
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
    },
    fieldName: 'phone',
    label: '手机号码',
  },
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
    },
    fieldName: 'email',
    label: '邮箱地址',
    rules: z.string().email({ message: '无效的邮箱地址' }).optional(),
  },
  {
    component: 'RadioGroup',
    componentProps: {
      buttonStyle: 'solid',
      // options: [
      //   { label: $t('common.enabled'), value: 1 },
      //   { label: $t('common.disabled'), value: 0 },
      // ],
      options: getDictOptions(DictEnum.SYS_STATUS),
      optionType: 'button',
    },
    defaultValue: 1,
    fieldName: 'status',
    label: '状态',
    rules: 'required',
  },
  {
    component: 'ApiSelect',
    fieldName: 'dept_admin_id',
    label: '部门管理员',
    componentProps: {
      allowClear: true,
      api: async () => {
        const result = await getSysUserListApi({ size: 200, status: 1 });
        return (result as any).items || result;
      },
      labelField: 'nickname',
      valueField: 'id',
      showSearch: true,
      filterOption: (input: string, option: any) => {
        return option.nickname?.toLowerCase().includes(input.toLowerCase());
      },
    },
    help: '设置该部门的管理员，管理员可管理本部门用户',
  },
  // ==================== 外部客户集成配置 ====================
  {
    component: 'Divider',
    fieldName: 'divider_external',
    label: '外部客户集成配置',
  },
  {
    component: 'Switch',
    fieldName: 'is_external',
    label: '外部客户',
    defaultValue: false,
    help: '标记该部门是否为外部客户（工厂），外部客户可接入开放平台',
  },
  {
    component: 'Input',
    fieldName: 'boss_app_id',
    label: 'BOSS App ID',
    componentProps: {
      placeholder: '请输入 BOSS 系统分配的 App ID',
    },
    dependencies: {
      triggerFields: ['is_external'],
      show: (values) => values.is_external === true,
    },
  },
  {
    component: 'Textarea',
    fieldName: 'rsa_private_key',
    label: 'RSA 私钥',
    componentProps: {
      placeholder: '请输入 RSA 私钥（PEM 格式）',
      rows: 4,
    },
    dependencies: {
      triggerFields: ['is_external'],
      show: (values) => values.is_external === true,
    },
  },
  {
    component: 'Input',
    fieldName: 'open_platform_url',
    label: '开放平台地址',
    componentProps: {
      placeholder: '例如：https://api.example.com',
    },
    dependencies: {
      triggerFields: ['is_external'],
      show: (values) => values.is_external === true,
    },
  },
  // ==================== 工厂地址配置（GPS 验证用） ====================
  {
    component: 'Divider',
    fieldName: 'divider_location',
    label: '工厂地址配置',
  },
  {
    component: 'InputNumber',
    fieldName: 'latitude',
    label: '工厂纬度',
    componentProps: {
      placeholder: '如: 39.9042',
      style: { width: '100%' },
      precision: 6,
    },
    help: '用于 GPS 定位验证',
  },
  {
    component: 'InputNumber',
    fieldName: 'longitude',
    label: '工厂经度',
    componentProps: {
      placeholder: '如: 116.4074',
      style: { width: '100%' },
      precision: 6,
    },
    help: '用于 GPS 定位验证',
  },
  {
    component: 'InputNumber',
    fieldName: 'gps_offset_meters',
    label: 'GPS偏移量(米)',
    componentProps: {
      placeholder: '允许的定位偏差范围',
      style: { width: '100%' },
      min: 0,
    },
    help: 'GPS 定位允许的最大偏移距离（米）',
  },
];
