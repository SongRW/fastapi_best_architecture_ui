<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { TestRecord } from '#/api';

import { computed, ref } from 'vue';

import { JsonViewer, Page, useVbenDrawer } from '@vben/common-ui';
import { downloadFileFromBlob } from '@vben/utils';
import { $t } from '@vben/locales';
import { message } from 'ant-design-vue';

import { useIsMobile } from '@vben-core/composables';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { exportTestRecordsApi, getTestRecordListApi } from '#/api';

import {
  querySchema,
  testResultOptions,
  testStepMap,
  useColumns,
} from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<TestRecord> = {
  rowConfig: {
    keyField: 'id',
  },
  height: 'auto',
  exportConfig: {},
  printConfig: {},
  toolbarConfig: {
    export: true,
    print: true,
    refresh: true,
    refreshOptions: {
      code: 'query',
    },
    custom: true,
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getTestRecordListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

function onActionClick({ code, row }: OnActionClickParams<TestRecord>) {
  switch (code) {
    case 'details': {
      recordDetails.value = row;
      drawerApi.open();
    }
  }
}

// 导出 Excel
async function handleExport() {
  try {
    const formValues = await gridApi.formApi?.getValues?.() ?? {};
    const blob = await exportTestRecordsApi({
      pid: formValues.pid,
      product_tag: formValues.product_tag,
      test_result: formValues.test_result,
    });
    const fileName = `test_records_${Date.now()}.xlsx`;
    downloadFileFromBlob({ fileName, source: blob });
    message.success('导出成功');
  } catch (error) {
    message.error('导出失败');
    console.error(error);
  }
}

// 响应式检测：小屏幕（md < 768px）时使用单列布局
const { isMobile } = useIsMobile();

// 动态计算 Descriptions 列数：小屏幕单列，大屏幕双列
const descriptionsColumn = computed(() => (isMobile.value ? 1 : 2));

// Drawer 宽度响应式：默认40%，lg(1024px)以上用33%
// 内置 isMobile 机制会在 md(<768px) 时自动变为 w-full
const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  footer: false,
  class: 'w-2/5 lg:w-1/3',
});

const recordDetails = ref<TestRecord>();

function testResultLabel(value: number): string {
  return (
    testResultOptions.find((option) => option.value === value)?.label ?? '未知'
  );
}

function testResultColor(value: number): string {
  return (
    testResultOptions.find((option) => option.value === value)?.color ??
    'default'
  );
}

function testStepLabel(value: number): string {
  return testStepMap[value] ?? `步骤 ${value}`;
}
</script>

<template>
  <Page auto-content-height>
    <div class="mb-4 flex gap-2">
      <a-button type="primary" @click="handleExport">
        导出 Excel
      </a-button>
    </div>
    <Grid />
    <Drawer title="测试记录详情">
      <a-descriptions
        class="ml-1"
        :label-style="{ color: '#6b7280' }"
        :column="descriptionsColumn"
      >
        <a-descriptions-item label="产品标识">
          {{ recordDetails?.pid }}
        </a-descriptions-item>
        <a-descriptions-item label="客户标识">
          {{ recordDetails?.cid }}
        </a-descriptions-item>
        <a-descriptions-item label="产品标签">
          {{ recordDetails?.product_tag }}
        </a-descriptions-item>
        <a-descriptions-item label="测试步骤">
          {{ testStepLabel(recordDetails?.test_step ?? 0) }}
        </a-descriptions-item>
        <a-descriptions-item label="测试结果">
          <a-tag :color="testResultColor(recordDetails?.test_result ?? 0)">
            {{ testResultLabel(recordDetails?.test_result ?? 0) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="基线版本">
          {{ recordDetails?.baseline_version || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="工厂 ID">
          {{ recordDetails?.factory_id ?? '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="操作员 ID">
          {{ recordDetails?.worker_id ?? '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="测试时间">
          {{ recordDetails?.test_time || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="备注">
          {{ recordDetails?.remark || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="测试数据" :span="descriptionsColumn">
          <JsonViewer
            v-if="recordDetails?.test_data"
            class="w-full"
            :value="recordDetails.test_data"
            copyable
            boxed
            expanded
            :expand-depth="3"
            :show-array-index="false"
          />
          <span v-else class="text-gray-400">暂无数据</span>
        </a-descriptions-item>
        <a-descriptions-item label="服务端验证" :span="descriptionsColumn">
          <JsonViewer
            v-if="recordDetails?.validation_result"
            class="w-full"
            :value="recordDetails.validation_result"
            copyable
            boxed
            expanded
            :expand-depth="3"
            :show-array-index="false"
          />
          <span v-else class="text-gray-400">暂无数据</span>
        </a-descriptions-item>
        <a-descriptions-item label="客户端验证" :span="descriptionsColumn">
          <JsonViewer
            v-if="recordDetails?.client_validation"
            class="w-full"
            :value="recordDetails.client_validation"
            copyable
            boxed
            expanded
            :expand-depth="3"
            :show-array-index="false"
          />
          <span v-else class="text-gray-400">暂无数据</span>
        </a-descriptions-item>
        <a-descriptions-item label="验证差异" :span="descriptionsColumn">
          <JsonViewer
            v-if="recordDetails?.validation_discrepancies"
            class="w-full"
            :value="recordDetails.validation_discrepancies"
            copyable
            boxed
            expanded
            :expand-depth="3"
            :show-array-index="false"
          />
          <span v-else class="text-gray-400">暂无数据</span>
        </a-descriptions-item>
      </a-descriptions>
    </Drawer>
  </Page>
</template>
