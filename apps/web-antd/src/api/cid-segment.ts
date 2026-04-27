import { requestClient } from './request';

// ============ 类型定义 ============

export interface CidSegmentParams {
  page?: number;
  size?: number;
  cid?: number; // CID号（模糊搜索）
  start_cid?: number;
  end_cid?: number;
  frequency_band?: string;
  dept_id?: number; // 部门ID（筛选）
}

export interface CidSegmentResult {
  id: string;
  start_cid: number;
  end_cid: number;
  frequency_band: string;
  dept_id: null | number; // 部门ID
  remark: null | string;
  total_count: number;
  used_count: number;
  usage_rate: number;
  version: number;
  created_time: string;
  created_by: null | string;
  updated_time: string;
  updated_by: null | string;
}

export interface CreateCidSegmentParams {
  start_cid: number;
  end_cid: number;
  frequency_band: string;
  remark?: string;
}

export interface UpdateCidSegmentParams {
  start_cid?: number;
  end_cid?: number;
  remark?: string;
}

export interface SplitCidSegmentParams {
  split_point: number;
  new_remark?: string;
}

export interface SplitCidSegmentResult {
  original_id: string;
  new_id: string;
}

// ============ 分页响应类型 ============

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// ============ API 函数 ============

/** 获取 CID 号段分页列表 */
export async function getCidSegmentListApi(params: CidSegmentParams) {
  return requestClient.get<PageResult<CidSegmentResult>>(
    '/api/v1/sys/cid-segments',
    { params },
  );
}

/** 获取 CID 号段详情 */
export async function getCidSegmentDetailApi(pk: string) {
  return requestClient.get<CidSegmentResult>(`/api/v1/sys/cid-segments/${pk}`);
}

/** 创建 CID 号段 */
export async function createCidSegmentApi(data: CreateCidSegmentParams) {
  return requestClient.post<CidSegmentResult>('/api/v1/sys/cid-segments', data);
}

/** 更新 CID 号段 */
export async function updateCidSegmentApi(
  pk: string,
  data: UpdateCidSegmentParams,
) {
  return requestClient.put(`/api/v1/sys/cid-segments/${pk}`, data);
}

/** 删除 CID 号段 */
export async function deleteCidSegmentApi(pk: string) {
  return requestClient.delete(`/api/v1/sys/cid-segments/${pk}`);
}

/** 拆分 CID 号段 */
export async function splitCidSegmentApi(
  pk: string,
  data: SplitCidSegmentParams,
) {
  return requestClient.post<SplitCidSegmentResult>(
    `/api/v1/sys/cid-segments/${pk}/split`,
    data,
  );
}
