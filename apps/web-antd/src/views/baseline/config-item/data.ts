import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { ConfigItemResult } from '#/api';

import { $t } from '@vben/locales';

import { DictEnum, getDictOptions } from '#/utils/dict';

const RULE_EXPRESSION_OPTIONS = [
  { label: '等于 (==)', value: 0 },
  { label: '不等于 (!=)', value: 1 },
  { label: '大于 (>)', value: 2 },
  { label: '大于等于 (>=)', value: 3 },
  { label: '小于 (<)', value: 4 },
  { label: '小于等于 (<=)', value: 5 },
  { label: '包含 (in)', value: 6 },
  { label: '不包含 (not_in)', value: 7 },
];

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'config_key',
    label: '配置项 Key',
  },
  {
    component: 'Input',
    fieldName: 'config_name',
    label: '配置项名称',
  },
  {
    component: 'Input',
    fieldName: 'product_tag',
    label: '产品标签',
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: $t('common.form.status'),
    componentProps: {
      allowClear: true,
      options: getDictOptions(DictEnum.SYS_STATUS),
    },
  },
];

export function useColumns(
  onActionClick?: OnActionClickFn<ConfigItemResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'config_name', title: '配置项名称', minWidth: 160 },
    { field: 'config_key', title: '配置项 Key', minWidth: 160 },
    { field: 'product_tag', title: '产品标签', minWidth: 140 },
    { field: 'value_type', title: '值类型', width: 100 },
    { field: 'sort_order', title: '排序', width: 80 },
    {
      field: 'is_required',
      title: '是否必检',
      width: 100,
      formatter: ({ cellValue }) => (cellValue ? '必检' : '可选'),
    },
    {
      field: 'rule_expression',
      title: '规则表达式',
      minWidth: 180,
      showOverflow: 'tooltip',
      formatter: ({ cellValue }) => {
        const map: Record<number, string> = {
          0: '等于 (==)',
          1: '不等于 (!=)',
          2: '大于 (>)',
          3: '大于等于 (>=)',
          4: '小于 (<)',
          5: '小于等于 (<=)',
          6: '包含 (in)',
          7: '不包含 (not_in)',
        };
        return cellValue === null || cellValue === undefined
          ? ''
          : (map[cellValue] ?? cellValue);
      },
    },
    {
      field: 'default_value',
      title: '默认值',
      minWidth: 140,
      showOverflow: 'tooltip',
    },
    {
      field: 'rule_value',
      title: '规则值',
      minWidth: 160,
      showOverflow: 'tooltip',
    },
    {
      field: 'status',
      title: '状态',
      width: 90,
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
      width: 240,
      cellRender: {
        attrs: {
          nameField: 'config_name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          'edit',
          {
            code: 'toggle-status',
            text: (row: ConfigItemResult) =>
              row.status === 1 ? '停用' : '启用',
          },
          'delete',
        ],
      },
    },
  ];
}

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'config_key',
    label: '配置项 Key',
    rules: 'required',
    componentProps: {
      placeholder: '请输入稳定唯一的配置项 Key',
    },
  },
  {
    component: 'Input',
    fieldName: 'config_name',
    label: '配置项名称',
    rules: 'required',
    componentProps: {
      placeholder: '请输入配置项名称',
    },
  },
  {
    component: 'Select',
    fieldName: 'product_tag',
    label: '产品标签',
    rules: 'required',
    componentProps: {
      allowClear: false,
      options: [],
      placeholder: '请选择产品标签',
      showSearch: true,
      style: { width: '100%' },
    },
  },
  {
    component: 'Select',
    fieldName: 'value_type',
    label: '值类型',
    defaultValue: 'string',
    componentProps: {
      options: [
        { label: '字符串', value: 'string' },
        { label: '整数', value: 'int' },
        { label: '浮点数', value: 'float' },
        { label: '布尔值', value: 'bool' },
        { label: '数组', value: 'array' },
        { label: '对象', value: 'object' },
      ],
      placeholder: '请选择值类型',
      style: { width: '100%' },
    },
  },
  {
    component: 'Switch',
    fieldName: 'is_required',
    label: '是否必检',
    defaultValue: true,
    componentProps: {
      checkedChildren: '必检',
      unCheckedChildren: '可选',
    },
  },
  {
    component: 'Input',
    fieldName: 'default_value',
    label: '默认值',
    componentProps: {
      placeholder: '请输入默认值',
    },
  },
  {
    component: 'Select',
    fieldName: 'rule_expression',
    label: '规则表达式',
    componentProps: {
      allowClear: true,
      options: RULE_EXPRESSION_OPTIONS,
      placeholder: '请选择规则表达式',
      style: { width: '100%' },
    },
  },
  {
    component: 'Textarea',
    fieldName: 'rule_value',
    label: '规则值',
    componentProps: {
      placeholder: '请输入规则值',
      rows: 3,
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'sort_order',
    label: '排序',
    defaultValue: 0,
    componentProps: {
      min: 0,
      precision: 0,
      style: { width: '100%' },
    },
  },
  {
    component: 'RadioGroup',
    fieldName: 'status',
    label: '状态',
    rules: 'required',
    defaultValue: 1,
    componentProps: {
      buttonStyle: 'solid',
      optionType: 'button',
      options: getDictOptions(DictEnum.SYS_STATUS),
    },
  },
  {
    component: 'Textarea',
    fieldName: 'remark',
    label: '备注',
    componentProps: {
      rows: 3,
      placeholder: '请输入备注',
    },
  },
];
