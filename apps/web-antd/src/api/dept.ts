import { requestClient } from './request';

export interface SysDeptResult {
  id: string;  // Snowflake ID
  name: string;
  parent_id: string;  // Snowflake ID
  sort: number;
  leader?: string;
  phone?: string;
  email?: string;
  status: number;
  created_time: string;
  /** 部门管理员用户ID */
  dept_admin_id?: string;  // Snowflake ID
  /** 是否为外部部门（客户） */
  is_external?: boolean;
  /** BOSS 系统 App ID */
  boss_app_id?: string;
  /** RSA 私钥 */
  rsa_private_key?: string;
  /** 开放平台 API 地址 */
  open_platform_url?: string;
  /** 工厂纬度 */
  latitude?: number;
  /** 工厂经度 */
  longitude?: number;
  /** GPS 允许偏移量（米） */
  gps_offset_meters?: number;
}

export interface SysDeptTreeResult extends SysDeptResult {
  children?: SysDeptTreeResult[];
}

export interface SysDeptParams {
  name: string;
  parent_id?: string;  // Snowflake ID
  sort?: number;
  leader?: string;
  phone?: string;
  email?: string;
  status: number;
  /** 部门管理员用户ID */
  dept_admin_id?: string;  // Snowflake ID
  /** 是否为外部部门（客户） */
  is_external?: boolean;
  /** BOSS 系统 App ID */
  boss_app_id?: string;
  /** RSA 私钥 */
  rsa_private_key?: string;
  /** 开放平台 API 地址 */
  open_platform_url?: string;
  /** 工厂纬度 */
  latitude?: number;
  /** 工厂经度 */
  longitude?: number;
  /** GPS 允许偏移量（米） */
  gps_offset_meters?: number;
}

export interface SysDeptTreeParams {
  name?: string;
  leader?: string;
  phone?: string;
  status?: number;
}

/**
 * 获取部门树
 */
export async function getSysDeptTreeApi(params: SysDeptTreeParams) {
  return requestClient.get<SysDeptTreeResult[]>('/api/v1/sys/depts', {
    params,
  });
}

/**
 * 获取部门详情
 */
export async function getSysDeptDetailApi(pk: string) {
  return requestClient.get<SysDeptTreeResult>(`/api/v1/sys/depts/${pk}`);
}

/**
 * 创建部门
 */
export async function createSysDeptApi(data: SysDeptParams) {
  return requestClient.post('/api/v1/sys/depts', data);
}

/**
 * 更新部门
 */
export async function updateSysDeptApi(pk: string, data: SysDeptParams) {
  return requestClient.put(`/api/v1/sys/depts/${pk}`, data);
}

/**
 * 删除部门
 */
export async function deleteSysDeptApi(pk: string) {
  return requestClient.delete(`/api/v1/sys/depts/${pk}`);
}
