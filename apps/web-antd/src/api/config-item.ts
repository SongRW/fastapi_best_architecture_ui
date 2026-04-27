import { requestClient } from './request';

export interface ConfigItemQueryParams {
  config_key?: string;
  config_name?: string;
  page?: number;
  product_tag?: string;
  size?: number;
  status?: number;
}

export interface ConfigItemPageResult<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

export interface ConfigItemResult {
  config_key: string;
  config_name: string;
  created_time: string;
  default_value: null | string;
  id: string;
  product_tag: string;
  remark: null | string;
  rule_expression: null | number;
  rule_value: null | string;
  sort_order: number;
  status: number;
  updated_time: null | string;
  value_type: null | string;
}

export interface ConfigItemCreate {
  config_key: string;
  config_name: string;
  default_value?: null | string;
  product_tag: string;
  remark?: null | string;
  rule_expression?: null | number;
  rule_value?: null | string;
  sort_order?: number;
  status?: number;
  value_type?: string;
}

export interface ConfigItemUpdate {
  config_key?: string;
  config_name?: string;
  default_value?: null | string;
  product_tag?: string;
  remark?: null | string;
  rule_expression?: null | number;
  rule_value?: null | string;
  sort_order?: number;
  status?: number;
  value_type?: string;
}

function normalizeConfigItemPageResult(
  data: ConfigItemPageResult<ConfigItemResult> | ConfigItemResult[],
  params: ConfigItemQueryParams,
): ConfigItemPageResult<ConfigItemResult> {
  if (Array.isArray(data)) {
    return {
      items: data,
      page: params.page ?? 1,
      size: params.size ?? data.length,
      total: data.length,
    };
  }
  return data;
}

export async function getConfigItemListApi(params: ConfigItemQueryParams) {
  const data = await requestClient.get<
    ConfigItemPageResult<ConfigItemResult> | ConfigItemResult[]
  >('/api/v1/sys/config-item/list', { params });
  return normalizeConfigItemPageResult(data, params);
}

export async function getAllConfigItemsApi(
  params?: Pick<ConfigItemQueryParams, 'product_tag' | 'status'>,
) {
  const data = await requestClient.get<
    ConfigItemPageResult<ConfigItemResult> | ConfigItemResult[]
  >('/api/v1/sys/config-item/list', {
    params,
  });
  return Array.isArray(data) ? data : data.items;
}

export async function createConfigItemApi(data: ConfigItemCreate) {
  return requestClient.post('/api/v1/sys/config-item/create', data);
}

export async function updateConfigItemApi(pk: string, data: ConfigItemUpdate) {
  return requestClient.put(`/api/v1/sys/config-item/${pk}`, data);
}

export async function deleteConfigItemApi(id: string) {
  return requestClient.delete(`/api/v1/sys/config-item/${id}`);
}
