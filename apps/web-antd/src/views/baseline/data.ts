import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { ProductBaselineResult } from '#/api';

import { $t } from '@vben/locales';

import { DictEnum, getDictOptions } from '#/utils/dict';

// 搜索表单配置
export const querySchema: VbenFormSchema[] = [
  { component: 'Input', fieldName: 'product_tag', label: '产品标签' },
  { component: 'Input', fieldName: 'product_name', label: '产品名称' },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: getDictOptions(DictEnum.SYS_STATUS),
    },
    fieldName: 'status',
    label: $t('common.form.status'),
  },
];

// 表格列配置 - 简化为核心字段
export function useColumns(
  onActionClick?: OnActionClickFn<ProductBaselineResult>,
): VxeGridProps['columns'] {
  return [
    { field: 'seq', title: $t('common.table.id'), type: 'seq', width: 50 },
    { field: 'product_tag', title: '产品标签', width: 140 },
    { field: 'product_name', title: '产品名称', minWidth: 180 },
    {
      field: 'dept_names',
      title: '可访问部门',
      width: 200,
      formatter: ({ row }) => {
        if (!row.dept_ids || row.dept_ids.length === 0) return '全部部门';
        return `${row.dept_ids.length} 个部门`;
      },
    },
    {
      field: 'config_count',
      title: '工况配置',
      width: 100,
      formatter: ({ row }) => {
        const count = row.conditions?.length ?? 0;
        return count > 0 ? `${count} 项` : '未配置';
      },
    },
    {
      field: 'status',
      title: '状态',
      cellRender: { name: 'CellTag' },
      width: 80,
    },
    {
      field: 'created_time',
      title: $t('common.table.created_time'),
      width: 168,
    },
    {
      field: 'operation',
      title: $t('common.table.operation'),
      align: 'center',
      fixed: 'right',
      width: 200,
      cellRender: {
        attrs: { nameField: 'product_name', onClick: onActionClick },
        name: 'CellOperation',
        options: [
          { code: 'config', text: '配置工况' },
          { code: 'edit', text: '编辑' },
          { code: 'delete', text: '删除' },
        ],
      },
    },
  ];
}

// 基础信息表单配置（第一步）
export const baseInfoSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'product_tag',
    label: '产品标签',
    rules: 'required',
    componentProps: { placeholder: '请输入产品标签，如: TQZD通用终端' },
  },
  {
    component: 'Input',
    fieldName: 'product_name',
    label: '产品名称',
    rules: 'required',
    componentProps: { placeholder: '请输入产品名称' },
  },
  {
    component: 'Divider',
    fieldName: 'permissionDivider',
    label: '部门权限',
  },
  {
    component: 'ApiSelect',
    fieldName: 'dept_ids',
    label: '可访问部门',
    componentProps: {
      mode: 'multiple',
      placeholder: '选择可访问此产品的部门',
      api: async () => {
        // TODO: 调用部门API
        return [];
      },
      resultField: 'data',
      labelField: 'name',
      valueField: 'id',
    },
    help: '留空表示所有部门可访问',
  },
  {
    component: 'Divider',
    fieldName: 'statusDivider',
    label: '状态',
  },
  {
    component: 'RadioGroup',
    fieldName: 'status',
    label: '状态',
    rules: 'required',
    defaultValue: 1,
    componentProps: {
      buttonStyle: 'solid',
      options: getDictOptions(DictEnum.SYS_STATUS),
      optionType: 'button',
    },
  },
  {
    component: 'Textarea',
    fieldName: 'remark',
    label: '备注',
    componentProps: { placeholder: '请输入备注信息', rows: 3 },
  },
];
