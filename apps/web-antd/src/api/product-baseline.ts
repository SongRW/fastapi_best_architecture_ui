import { requestClient } from './request';

export interface ConditionItem {
  condition_id: string;
  condition_name: string;
  config_key?: null | string;
  group_name?: null | string;
  is_required?: boolean | null;
  rule_expression?: null | number | string;
  sort_order?: null | number;
  value?: unknown;
}

export interface ProductBaselineParams {
  page?: number;
  product_name?: string;
  product_tag?: string;
  size?: number;
  status?: number;
}

export interface ProductBaselinePageResult<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

export interface ProductBaselineResult {
  conditions: ConditionItem[] | null;
  created_time?: string;
  dept_ids: null | string[];
  id: string;
  product_name: string;
  product_tag: string;
  remark: null | string;
  status: number;
  updated_time?: null | string;
}

export interface CreateProductBaselineParams {
  conditions?: ConditionItem[] | null;
  dept_ids?: null | string[];
  product_name: string;
  product_tag: string;
  remark?: null | string;
  status?: number;
}

function normalizeBaselinePageResult(
  data:
    | ProductBaselinePageResult<ProductBaselineResult>
    | ProductBaselineResult[],
  params: ProductBaselineParams,
): ProductBaselinePageResult<ProductBaselineResult> {
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

export async function getProductBaselineListApi(params: ProductBaselineParams) {
  const data = await requestClient.get<
    ProductBaselinePageResult<ProductBaselineResult> | ProductBaselineResult[]
  >('/api/v1/sys/baseline/list', { params });
  return normalizeBaselinePageResult(data, params);
}

export async function getAllProductBaselineApi(
  params: ProductBaselineParams = {},
) {
  const data = await requestClient.get<
    ProductBaselinePageResult<ProductBaselineResult> | ProductBaselineResult[]
  >('/api/v1/sys/baseline/list', {
    params,
  });
  return Array.isArray(data) ? data : data.items;
}

export async function getProductBaselineApi(product_tag: string) {
  return requestClient.get<ProductBaselineResult>(
    `/api/v1/sys/baseline/${encodeURIComponent(product_tag)}`,
  );
}

export async function getProductBaselineByIdApi(
  _pk: string,
  productTag?: string,
) {
  if (!productTag) {
    throw new Error('缺少产品标签，无法加载基线详情');
  }
  return getProductBaselineApi(productTag);
}

export async function createProductBaselineApi(
  data: CreateProductBaselineParams,
) {
  return requestClient.post('/api/v1/sys/baseline/create', data);
}

export async function updateProductBaselineApi(
  pk: string,
  data: CreateProductBaselineParams,
) {
  return requestClient.put(`/api/v1/sys/baseline/${pk}`, data);
}

export async function deleteProductBaselineApi(pk: string) {
  return requestClient.delete(`/api/v1/sys/baseline/${pk}`);
}
