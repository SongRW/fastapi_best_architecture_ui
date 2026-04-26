import type { SysMenuTreeResult } from './core/menu';

import { requestClient } from './request';

export interface SysRoleParams {
  name?: string;
  status?: number;
  page?: number;
  size?: number;
}

export interface SysRoleResult {
  id: string;  // Snowflake ID
  name: string;
  status: number;
  is_filter_scopes: boolean;
  /** 角色等级（数值越大权限越高） */
  level: number;
  remark?: string;
  created_time: string;
  updated_time: string;
}

export interface CreateSysRoleParams {
  name: string;
  status: number;
  is_filter_scopes?: boolean;
  /** 角色等级（数值越大权限越高） */
  level?: number;
  remark?: string;
}

/**
 * 获取系统角色列表
 */
export async function getSysRoleListApi(params: SysRoleParams) {
  return requestClient.get<SysRoleResult[]>('/api/v1/sys/roles', { params });
}

export async function getAllSysRoleApi() {
  return requestClient.get<SysRoleResult[]>('/api/v1/sys/roles/all');
}

/**
 * 获取当前用户可分配的角色列表
 */
export async function getAssignableRolesApi() {
  return requestClient.get<SysRoleResult[]>('/api/v1/sys/roles/assignable');
}


export async function getSysRoleMenuApi(pk: string) {
  return requestClient.get<SysMenuTreeResult[]>(
    `/api/v1/sys/roles/${pk}/menus`,
  );
}

export async function getSysRoleDataScopesApi(pk: string) {
  return requestClient.get<number[]>(`/api/v1/sys/roles/${pk}/scopes`);
}

export async function createSysRoleApi(data: CreateSysRoleParams) {
  return requestClient.post('/api/v1/sys/roles', data);
}

export async function updateSysRoleApi(pk: string, data: CreateSysRoleParams) {
  return requestClient.put(`/api/v1/sys/roles/${pk}`, data);
}

export async function updateSysRoleMenuApi(pk: string, menus: number[]) {
  return requestClient.put(`/api/v1/sys/roles/${pk}/menus`, { menus });
}

export async function updateSysRoleDataScopesApi(pk: string, scopes: number[]) {
  return requestClient.put(`/api/v1/sys/roles/${pk}/scopes`, { scopes });
}

export async function deleteSysRoleApi(pks: string[]) {
  return requestClient.delete(`/api/v1/sys/roles`, { data: { pks } });
}
