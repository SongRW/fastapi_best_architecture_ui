import { requestClient } from './request';

// ============ 类型定义 ============

export interface WorkOrderParams {
  page?: number;
  size?: number;
  order_no?: string;
  product_tag?: string;
  status?: number;
  priority?: number;
  dept_id?: number; // 部门ID（筛选）
}

export interface WorkOrderResult {
  id: number;
  dept_id: number; // 部门ID
  cid_segment_id: number; // 号段ID
  dept_name: null | string; // 部门名称
  order_no: string;
  product_tag: string;
  quantity: number;
  status: number;
  status_text: string;
  priority: number;
  remark: null | string;
  version: number;
  created_time: string;
  created_by: null | number;
  updated_time: string;
  updated_by: null | number;
  is_started?: boolean;
}
// ============ 分页响应类型 ============

export interface WorkOrderPageResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface CreateWorkOrderParams {
  dept_id: number; // 部门ID（必填）
  cid_segment_id: number; // 号段ID（必填）
  product_tag: string; // 产品标签
  quantity: number; // 数量
  priority?: number; // 优先级
  remark?: string; // 备注
}

export interface UpdateWorkOrderParams {
  quantity?: number;
  status?: number;
  priority?: number;
  remark?: string;
}

// ============ API 函数 ============

/** 获取工单分页列表 */
export async function getWorkOrderListApi(params: WorkOrderParams) {
  return requestClient.get<WorkOrderPageResult<WorkOrderResult>>(
    '/api/v1/sys/work-order',
    { params },
  );
}

/** 获取工单详情 */
export async function getWorkOrderDetailApi(pk: number) {
  return requestClient.get<WorkOrderResult>(`/api/v1/sys/work-order/${pk}`);
}

/** 创建工单 */
export async function createWorkOrderApi(data: CreateWorkOrderParams) {
  return requestClient.post<WorkOrderResult>('/api/v1/sys/work-order', data);
}

/** 更新工单 */
export async function updateWorkOrderApi(
  pk: number,
  data: UpdateWorkOrderParams,
) {
  return requestClient.put(`/api/v1/sys/work-order/${pk}`, data);
}

/** 删除工单 */
export async function deleteWorkOrderApi(pk: number) {
  return requestClient.delete(`/api/v1/sys/work-order/${pk}`);
}
