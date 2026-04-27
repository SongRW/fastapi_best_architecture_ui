import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { CidSegmentResult } from '#/api';

// 查询表单 Schema
export const querySchema: VbenFormSchema[] = [
  {
    component: 'InputNumber',
    fieldName: 'start_cid',
    label: '起始CID',
    componentProps: {
      placeholder: '请输入起始CID',
      min: 0,
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'end_cid',
    label: '结束CID',
    componentProps: {
      placeholder: '请输入结束CID',
      min: 0,
    },
  },
  {
    component: 'Select',
    fieldName: 'frequency_band',
    label: '频段',
    componentProps: {
      allowClear: true,
      placeholder: '请选择频段',
      options: [
        { label: '240M', value: '240M' },
        { label: '400M', value: '400M' },
      ],
    },
  },
];

// 表格列定义
export function useColumns(
  onActionClick?: OnActionClickFn<CidSegmentResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: '序号',
      type: 'seq',
      width: 60,
    },
    {
      field: 'start_cid',
      title: '起始CID',
      width: 120,
    },
    {
      field: 'end_cid',
      title: '结束CID',
      width: 120,
    },
    {
      field: 'frequency_band',
      title: '频段',
      width: 80,
    },
    {
      field: 'total_count',
      title: '数量',
      minWidth: 100,
      formatter: ({ cellValue }) => cellValue?.toLocaleString() || '0',
    },
    {
      field: 'usage_rate',
      title: '使用率',
      minWidth: 100,
      formatter: ({ cellValue }) => `${Number(cellValue || 0).toFixed(2)}%`,
    },
    {
      field: 'dept_id',
      title: '绑定部门',
      minWidth: 110,
      formatter: ({ cellValue }) =>
        cellValue ? `部门 ${cellValue}` : '未绑定',
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 150,
      showOverflow: 'tooltip',
    },
    {
      field: 'created_time',
      title: '创建时间',
      minWidth: 160,
    },
    {
      field: 'operation',
      title: '操作',
      align: 'center',
      fixed: 'right',
      width: 200,
      cellRender: {
        attrs: {
          nameField: 'start_cid',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'split',
            text: '拆分',
          },
          'edit',
          'delete',
        ],
      },
    },
  ];
}

// 新增/编辑表单 Schema
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'InputNumber',
      fieldName: 'start_cid',
      label: '起始CID',
      rules: 'required',
      formItemClass: 'col-span-1',
      componentProps: {
        placeholder: '请输入起始CID',
        min: 0,
        style: { width: '100%' },
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'end_cid',
      label: '结束CID',
      rules: 'required',
      formItemClass: 'col-span-1',
      componentProps: {
        placeholder: '请输入结束CID',
        min: 0,
        style: { width: '100%' },
      },
    },
    {
      component: 'Select',
      fieldName: 'frequency_band',
      label: '频段',
      rules: 'required',
      formItemClass: 'col-span-1',
      componentProps: {
        placeholder: '请选择频段',
        options: [
          { label: '240M (200万-400万)', value: '240M' },
          { label: '400M (0-200万)', value: '400M' },
        ],
        style: { width: '100%' },
      },
    },
    {
      component: 'Input',
      fieldName: 'remark',
      label: '备注',
      formItemClass: 'col-span-1',
      componentProps: {
        placeholder: '请输入备注（50字以内）',
        maxlength: 50,
        showCount: true,
        style: { width: '100%' },
      },
    },
  ];
}

// 拆分表单 Schema
export function useSplitFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'InputNumber',
      fieldName: 'split_point',
      label: '拆分点',
      rules: 'required',
      formItemClass: 'col-span-1',
      componentProps: {
        placeholder: '请输入第一段的结束号码',
        min: 0,
        style: { width: '100%' },
      },
      help: '新号段将从 [拆分点 + 1] 开始',
    },
    {
      component: 'Input',
      fieldName: 'new_remark',
      label: '新号段备注',
      formItemClass: 'col-span-1',
      componentProps: {
        placeholder: '请输入新号段的备注（50字以内）',
        maxlength: 50,
        showCount: true,
        style: { width: '100%' },
      },
    },
  ];
}
