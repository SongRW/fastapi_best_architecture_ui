<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { WorkOrderActionCode } from './data';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  CreateWorkOrderParams,
  UpdateWorkOrderParams,
  WorkOrderResult,
} from '#/api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message, Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createWorkOrderApi,
  deleteWorkOrderApi,
  getWorkOrderDetailApi,
  getWorkOrderListApi,
  updateWorkOrderApi,
} from '#/api';

import CreateWorkOrderWizard from './components/CreateWorkOrderWizard.vue';
import {
  mapWorkOrderReasonCode,
  querySchema,
  useColumns,
  useFormSchema,
} from './data';

// 查询表单配置
const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  schema: querySchema,
};

// 表格配置
const gridOptions: VxeTableGridOptions<WorkOrderResult> = {
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
        return await getWorkOrderListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

// 操作按钮点击处理
async function refreshEditFormSchema(row?: WorkOrderResult) {
  editFormApi.setState((prev) => ({
    ...prev,
    schema: useFormSchema(row),
  }));
}

async function openEditModal(row: WorkOrderResult) {
  await refreshEditFormSchema(row);
  editModalApi.setData(row).open();
}

async function handleStatusUpdate(
  row: WorkOrderResult,
  status: number,
  successMessage: string,
) {
  try {
    await updateWorkOrderApi(row.id, { status });
    message.success(successMessage);
    onRefresh();
  } catch (error) {
    const errorCode =
      typeof error === 'object' && error && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data
            ?.error
        : undefined;
    message.error(mapWorkOrderReasonCode(errorCode));
  }
}

function onActionClick({ code, row }: OnActionClickParams<WorkOrderResult>) {
  const actionCode = code as WorkOrderActionCode;

  switch (code) {
    case 'cancel': {
      Modal.confirm({
        title: '确认取消',
        content: `确定要取消工单 ${row.order_no} 吗？`,
        onOk: async () => {
          await handleStatusUpdate(row, 3, '工单已取消');
        },
      });
      break;
    }
    case 'complete': {
      handleStatusUpdate(row, 2, '工单已完成');
      break;
    }
    case 'delete': {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除工单 ${row.order_no} 吗？`,
        onOk: async () => {
          await deleteWorkOrderApi(row.id);
          message.success('删除成功');
          onRefresh();
        },
      });
      break;
    }
    case 'edit': {
      openEditModal(row);
      break;
    }
    case 'start': {
      handleStatusUpdate(row, 1, '工单已开始生产');
      break;
    }
    case 'view': {
      Modal.info({
        title: `工单详情：${row.order_no}`,
        content: `工厂：${row.dept_name ?? '-'}\n产品标签：${row.product_tag}\n状态：${row.status_text}\n是否开工：${row.is_started ? '已开工' : '未开工'}`,
      });
      break;
    }
    default: {
      if (actionCode === 'resume') {
        // reserved for future resume logic
      }
      break;
    }
  }
}

// ============ 新增工单向导 ============
const wizardRef = ref<InstanceType<typeof CreateWorkOrderWizard> | null>(null);

const [CreateModal, createModalApi] = useVbenModal({
  destroyOnClose: true,
  title: '新增工单',
  async onConfirm() {
    // 由向导组件内部处理提交
    return false;
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      wizardRef.value?.resetWizard();
    }
  },
});

// 向导提交处理
async function handleWizardSubmit(data: {
  cid_segment_id: null | string;
  dept_id: null | string;
  dept_name: string;
  priority: number;
  product_tag: string;
  quantity: number;
  remark: string;
}) {
  createModalApi.lock();
  try {
    const params: CreateWorkOrderParams = {
      dept_id: Number(data.dept_id),
      cid_segment_id: Number(data.cid_segment_id),
      product_tag: data.product_tag,
      quantity: data.quantity,
      priority: data.priority,
      remark: data.remark,
    };
    await createWorkOrderApi(params);
    message.success('工单创建成功');
    await createModalApi.close();
    onRefresh();
  } finally {
    createModalApi.unlock();
  }
}

function handleWizardCancel() {
  createModalApi.close();
}

// ============ 编辑表单 ============
const [EditForm, editFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: useFormSchema(),
});

interface EditFormData extends CreateWorkOrderParams {
  id?: number;
  status?: number;
}

const editFormData = ref<EditFormData>();
const isEdit = computed(() => !!editFormData.value?.id);
const editModalTitle = computed(() => (isEdit.value ? '编辑工单' : '新增工单'));

const [EditModal, editModalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await editFormApi.validate();
    if (valid) {
      editModalApi.lock();
      const data = await editFormApi.getValues<CreateWorkOrderParams>();
      try {
        if (isEdit.value && editFormData.value?.id) {
          await updateWorkOrderApi(
            editFormData.value.id,
            data as UpdateWorkOrderParams,
          );
        }
        message.success('操作成功');
        await editModalApi.close();
        onRefresh();
      } finally {
        editModalApi.unlock();
      }
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = editModalApi.getData<EditFormData>();
      editFormApi.resetForm();
      if (data) {
        editFormData.value = data;
        await refreshEditFormSchema(data as WorkOrderResult);
        const detail = await getWorkOrderDetailApi(data.id!);
        editFormData.value = {
          ...data,
          ...detail,
          remark: detail.remark ?? undefined,
        };
        editFormApi.setValues(editFormData.value);
      } else {
        await refreshEditFormSchema();
        editFormData.value = undefined;
      }
    }
  },
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="() => createModalApi.open()">
          <MaterialSymbolsAdd class="size-5" />
          新增工单
        </VbenButton>
      </template>
    </Grid>

    <!-- 新增工单向导弹窗 -->
    <CreateModal :footer="false" :width="900">
      <CreateWorkOrderWizard
        ref="wizardRef"
        @submit="handleWizardSubmit"
        @cancel="handleWizardCancel"
      />
    </CreateModal>

    <!-- 编辑弹窗 -->
    <EditModal :title="editModalTitle">
      <EditForm />
    </EditModal>
  </Page>
</template>
