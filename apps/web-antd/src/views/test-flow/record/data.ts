import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { TestRecord } from '#/api';

import { $t } from '@vben/locales';

export const testResultOptions = [
  { color: 'processing', label: '待测', value: 0 },
  { color: 'success', label: '通过', value: 1 },
  { color: 'error', label: '失败', value: 2 },
  { color: 'default', label: '跳过', value: 3 },
];

export const testStepMap: Record<number, string> = {
  0: '等待测试',
  1: 'PID 写入',
  2: 'Lora 通信',
  3: '定位测试',
  4: '温度测试',
  5: '内部电压',
  6: '外部电压',
  7: '六轴倾角',
  8: 'IO 状态',
  9: 'ROM 读取',
  10: 'RS232 测试',
  11: '请求 CID',
  12: '解码 CID',
  13: '写入 CID',
  14: '测试通过',
  15: '测试失败',
};

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'pid',
    label: '产品标识',
  },
  {
    component: 'Input',
    fieldName: 'product_tag',
    label: '产品标签',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: testResultOptions.map(({ label, value }) => ({ label, value })),
    },
    fieldName: 'test_result',
    label: '测试结果',
  },
];

export function useColumns(
  onActionClick?: OnActionClickFn<TestRecord>,
): VxeGridProps['columns'] {
  return [
    { field: 'checkbox', type: 'checkbox', align: 'left', width: 50 },
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'pid', title: '产品标识', width: 150 },
    { field: 'cid', title: '客户标识', width: 110 },
    { field: 'product_tag', title: '产品标签', width: 130 },
    {
      field: 'test_step',
      title: '测试步骤',
      width: 120,
      formatter: ({ cellValue }) => testStepMap[cellValue] ?? `步骤 ${cellValue}`,
    },
    {
      field: 'test_result',
      title: '测试结果',
      width: 90,
      cellRender: {
        name: 'CellTag',
        options: testResultOptions,
      },
    },
    { field: 'baseline_version', title: '基线版本', width: 120 },
    { field: 'test_time', title: '测试时间', width: 170 },
    {
      field: 'operation',
      title: $t('common.table.operation'),
      align: 'center',
      fixed: 'right',
      width: 100,
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'details',
            text: '详情',
          },
        ],
      },
    },
  ];
}
