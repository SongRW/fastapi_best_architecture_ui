import type { PaginationResult } from '#/types';

import { requestClient } from './request';

export interface TestRecordParams {
  pid?: string;
  cid?: number;
  product_tag?: string;
  test_result?: number;
  page?: number;
  size?: number;
}

export interface TestRecord {
  id: number;
  pid: string;
  cid: number;
  product_tag: string;
  test_step: number;
  test_result: number;
  test_data: null | Record<string, unknown>;
  validation_result: null | Record<string, unknown>;
  client_validation: null | Record<string, unknown>;
  validation_discrepancies: null | Record<string, unknown>;
  baseline_version: null | string;
  factory_id: null | number;
  worker_id: null | number;
  test_time: null | string;
  remark: null | string;
}

export async function getTestRecordListApi(params?: TestRecordParams) {
  return requestClient.get<PaginationResult<TestRecord>>(
    '/api/v1/sys/test/list',
    {
      params,
    },
  );
}

export async function getTestRecordDetailApi(pk: number) {
  return requestClient.get<TestRecord>(`/api/v1/sys/test/${pk}`);
}

export interface ExportTestRecordsParams {
  pid?: string;
  cid?: number;
  product_tag?: string;
  test_result?: number;
  start_time?: string;
  end_time?: string;
}

export async function exportTestRecordsApi(params?: ExportTestRecordsParams) {
  return requestClient.download<Blob>('/api/v1/sys/test/export', { params });
}
