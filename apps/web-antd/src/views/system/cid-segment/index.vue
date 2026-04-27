<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  CidSegmentResult,
  CreateCidSegmentParams,
  SplitCidSegmentParams,
  UpdateCidSegmentParams,
} from '#/api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message, Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createCidSegmentApi,
  deleteCidSegmentApi,
  getCidSegmentListApi,
  splitCidSegmentApi,
  updateCidSegmentApi,
} from '#/api';

import {
  querySchema,
  useColumns,
  useFormSchema,
  useSplitFormSchema,
} from './data';

// 查询表单配置
const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  schema: querySchema,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

// 表格配置
const gridOptions: VxeTableGridOptions<CidSegmentResult> = {
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
        const result = await getCidSegmentListApi({
          ...formValues,
          page: page.currentPage,
          size: page.pageSize,
        });
        // 后端返回分页格式
        return {
          items: result.items,
          total: result.total,
        };
      },
    },
  },
};
const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

// 操作按钮点击处理
function onActionClick({ code, row }: OnActionClickParams<CidSegmentResult>) {
  switch (code) {
    case 'delete': {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除号段 ${row.start_cid} - ${row.end_cid} 吗？`,
        onOk: async () => {
          await deleteCidSegmentApi(row.id);
          message.success('删除成功');
          onRefresh();
        },
      });
      break;
    }
    case 'edit': {
      editModalApi.setData(row).open();
      break;
    }
    case 'split': {
      splitModalApi.setData(row).open();
      break;
    }
  }
}

// ============ 新增/编辑表单 ============
const [EditForm, editFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: useFormSchema(),
  // 自适应网格布局
  wrapperClass: 'grid grid-cols-1 md:grid-cols-2 gap-x-4',
});

interface EditFormData extends CreateCidSegmentParams {
  id?: string;
}

const editFormData = ref<EditFormData>();
const isEdit = computed(() => !!editFormData.value?.id);
const editModalTitle = computed(() => (isEdit.value ? '编辑号段' : '新增号段'));

const [EditModal, editModalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await editFormApi.validate();
    if (valid) {
      editModalApi.lock();
      const data = await editFormApi.getValues<CreateCidSegmentParams>();
      try {
        await (isEdit.value && editFormData.value?.id
          ? updateCidSegmentApi(
              editFormData.value.id,
              data as UpdateCidSegmentParams,
            )
          : createCidSegmentApi(data));
        message.success('操作成功');
        await editModalApi.close();
        onRefresh();
      } finally {
        editModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = editModalApi.getData<EditFormData>();
      editFormApi.resetForm();
      if (data) {
        editFormData.value = data;
        editFormApi.setValues(data);
      } else {
        editFormData.value = undefined;
      }
    }
  },
});

// ============ 拆分表单 ============
const [SplitForm, splitFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: useSplitFormSchema(),
  // 自适应网格布局
  wrapperClass: 'grid grid-cols-1 md:grid-cols-2 gap-x-4',
});

interface SplitFormData {
  id: string;
  start_cid: number;
  end_cid: number;
}

const splitFormData = ref<SplitFormData>();

const [SplitModal, splitModalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await splitFormApi.validate();
    if (valid) {
      splitModalApi.lock();
      const data = await splitFormApi.getValues<SplitCidSegmentParams>();
      try {
        if (splitFormData.value?.id) {
          await splitCidSegmentApi(splitFormData.value.id, data);
          message.success('拆分成功');
          await splitModalApi.close();
          onRefresh();
        }
      } catch (error) {
        const responseError =
          typeof error === 'object' && error && 'response' in error
            ? (error as { response?: { data?: { msg?: string } } }).response
                ?.data?.msg
            : undefined;
        message.error(responseError || '只能拆分尾部连续未使用空白区间');
      } finally {
        splitModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = splitModalApi.getData<SplitFormData>();
      splitFormApi.resetForm();
      if (data) {
        splitFormData.value = data;
        // 显示当前号段范围
        message.info(`当前号段: ${data.start_cid} - ${data.end_cid}`);
        message.info('仅允许拆分尾部连续未使用空白区间');
      }
    }
  },
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="() => editModalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          新增号段
        </VbenButton>
      </template>
    </Grid>

    <!-- 新增/编辑弹窗 -->
    <EditModal :title="editModalTitle">
      <EditForm />
    </EditModal>

    <!-- 拆分弹窗 -->
    <SplitModal title="拆分号段">
      <SplitForm />
    </SplitModal>
  </Page>
</template>
