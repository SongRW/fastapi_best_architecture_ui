import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { WorkOrderResult } from '#/api';

export type WorkOrderActionCode =
  | 'cancel'
  | 'complete'
  | 'delete'
  | 'edit'
  | 'resume'
  | 'start'
  | 'view';

// 工单状态选项（兼容当前后端 4 态模型，同时向生产语义对齐）
export const statusOptions = [
  { label: '待生产', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已完成', value: 2 },
  { label: '已取消', value: 3 },
];

// 优先级选项
export const priorityOptions = [
  { label: '普通', value: 0 },
  { label: '紧急', value: 1 },
  { label: '非常紧急', value: 2 },
];

export const workOrderReasonCodeMap: Record<string, string> = {
  MANUAL_CID_ALREADY_USED: '手动输入的 CID 已被使用',
  MANUAL_CID_OUT_OF_RANGE: '手动输入的 CID 不在允许号段内',
  SEGMENT_CID_EXHAUSTED: '当前工单绑定号段的 CID 已用尽',
  SEGMENT_NOT_AVAILABLE: '当前工单绑定号段不可用',
  WORK_ORDER_CANCELLED: '工单已取消，不能继续申请 CID',
  WORK_ORDER_COMPLETED: '工单已完成，不能继续申请 CID',
  WORK_ORDER_FIELDS_FROZEN: '工单已开工，核心字段不可修改',
  WORK_ORDER_NOT_FOUND: '当前部门和产品没有可用工单',
  WORK_ORDER_SEGMENT_CONFLICT: '当前号段已经被其他工单占用',
  WORK_ORDER_STATUS_INVALID: '当前工单状态不允许执行该操作',
};

export function mapWorkOrderReasonCode(code?: string) {
  if (!code) {
    return '当前操作不满足工单规则';
  }
  return workOrderReasonCodeMap[code] ?? '当前操作不满足工单规则';
}

export function getWorkOrderStatusLabel(row: Pick<WorkOrderResult, 'status'>) {
  const item = statusOptions.find((option) => option.value === row.status);
  return item?.label ?? '未知';
}

export function canEditWorkOrder(
  row: Pick<WorkOrderResult, 'is_started' | 'status'>,
) {
  return !row.is_started && row.status !== 2 && row.status !== 3;
}

export const workOrderActionOptions: Array<Record<string, unknown> | string> = [
  { code: 'view', text: '详情' },
  {
    code: 'edit',
    disabled: (row: WorkOrderResult) => !canEditWorkOrder(row),
    text: (row: WorkOrderResult) => (canEditWorkOrder(row) ? '编辑' : '已冻结'),
  },
  {
    code: 'start',
    show: (row: WorkOrderResult) => row.status === 0,
    text: '开始',
  },
  {
    code: 'complete',
    show: (row: WorkOrderResult) => row.status === 1,
    text: '完成',
  },
  {
    code: 'resume',
    disabled: true,
    show: (row: WorkOrderResult) => row.status === 1,
    text: '进行中',
  },
  {
    code: 'cancel',
    show: (row: WorkOrderResult) => row.status !== 2 && row.status !== 3,
    text: '取消',
  },
  { code: 'delete', text: '删除' },
];

// 产品标签选项
export const productTagOptions = [
  { label: 'TQZD通用终端', value: 'TQZD通用终端' },
  { label: '一体化终端', value: '一体化终端' },
  { label: 'AIS终端', value: 'AIS终端' },
  { label: '救援终端', value: '救援终端' },
  { label: 'GM模组', value: 'GM模组' },
  { label: 'GM-模组-WB', value: 'GM-模组-WB' },
];

// 查询表单 Schema
export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'order_no',
    label: '工单编号',
    componentProps: {
      placeholder: '请输入工单编号',
    },
  },
  {
    component: 'ApiSelect',
    fieldName: 'dept_id',
    label: '工厂',
    componentProps: {
      allowClear: true,
      placeholder: '请选择工厂',
      // API 将在 index.vue 中动态设置
    },
  },
  {
    component: 'Select',
    fieldName: 'product_tag',
    label: '产品标签',
    componentProps: {
      allowClear: true,
      placeholder: '请选择产品标签',
      options: productTagOptions,
    },
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    componentProps: {
      allowClear: true,
      placeholder: '请选择状态',
      options: statusOptions,
    },
  },
  {
    component: 'Select',
    fieldName: 'priority',
    label: '优先级',
    componentProps: {
      allowClear: true,
      placeholder: '请选择优先级',
      options: priorityOptions,
    },
  },
];

// 表格列定义
export function useColumns(
  onActionClick?: OnActionClickFn<WorkOrderResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: '序号',
      type: 'seq',
      width: 60,
    },
    {
      field: 'order_no',
      title: '工单编号',
      width: 150,
    },
    {
      field: 'dept_name',
      title: '工厂',
      width: 120,
    },
    {
      field: 'product_tag',
      title: '产品标签',
      width: 120,
    },
    {
      field: 'quantity',
      title: '数量',
      width: 80,
      formatter: ({ cellValue }) => cellValue?.toLocaleString() || '0',
    },
    {
      field: 'status_text',
      title: '状态',
      width: 96,
      formatter: ({ row }) => getWorkOrderStatusLabel(row),
    },
    {
      field: 'is_started',
      title: '开工状态',
      width: 96,
      formatter: ({ row }) => (row.is_started ? '已开工' : '未开工'),
    },
    {
      field: 'priority',
      title: '优先级',
      width: 80,
      formatter: ({ cellValue }) => {
        const item = priorityOptions.find((opt) => opt.value === cellValue);
        return item?.label || '普通';
      },
    },
    {
      field: 'remark',
      title: '备注',
      width: 150,
      showOverflow: 'tooltip',
    },
    {
      field: 'created_time',
      title: '创建时间',
      width: 160,
    },
    {
      field: 'operation',
      title: '操作',
      align: 'center',
      fixed: 'right',
      width: 150,
      cellRender: {
        attrs: {
          nameField: 'order_no',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: workOrderActionOptions,
      },
    },
  ];
}

// 新增/编辑表单 Schema
export function useFormSchema(
  row?: Pick<WorkOrderResult, 'is_started' | 'status'>,
): VbenFormSchema[] {
  const frozen = !!row?.is_started;
  return [
    {
      component: 'Select',
      fieldName: 'product_tag',
      label: '产品标签',
      rules: 'required',
      componentProps: {
        disabled: frozen,
        placeholder: '请选择产品标签',
        options: productTagOptions,
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'quantity',
      label: '数量',
      rules: 'required',
      componentProps: {
        placeholder: '请输入数量',
        min: 1,
        disabled: frozen,
        style: { width: '100%' },
      },
    },
    {
      component: 'Select',
      fieldName: 'priority',
      label: '优先级',
      componentProps: {
        placeholder: '请选择优先级',
        options: priorityOptions,
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        placeholder: '请选择状态',
        options: statusOptions,
      },
    },
    {
      component: 'InputTextArea',
      fieldName: 'remark',
      label: '备注',
      componentProps: {
        placeholder: '请输入备注（200字以内）',
        maxlength: 200,
        showCount: true,
        rows: 3,
      },
    },
  ];
}
