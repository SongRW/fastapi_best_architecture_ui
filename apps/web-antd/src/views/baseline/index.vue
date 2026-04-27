<script lang="ts" setup>
import type { TreeSelectProps } from 'ant-design-vue';

import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  CreateProductBaselineParams,
  ProductBaselineResult,
  SysDeptTreeResult,
} from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Divider,
  Input,
  message,
  Radio,
  Textarea,
  TreeSelect,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createProductBaselineApi,
  deleteProductBaselineApi,
  getProductBaselineListApi,
  getSysDeptTreeApi,
  updateProductBaselineApi,
} from '#/api';

import ConfigModal from './config-modal.vue';
import { querySchema, useColumns } from './data';

type DeptTreeOption = NonNullable<TreeSelectProps['treeData']>[number];

interface FormParams {
  id?: string;
  dept_ids: string[];
  product_name: string;
  product_tag: string;
  remark: string;
  status: number;
}

const deptTreeData = ref<SysDeptTreeResult[]>([]);
const deptLoading = ref(false);
const formData = ref<FormParams>({
  dept_ids: [],
  product_name: '',
  product_tag: '',
  remark: '',
  status: 1,
});

const deptTreeOptions = computed<DeptTreeOption[]>(() =>
  transformDeptTree(deptTreeData.value),
);
const modalTitle = computed(() =>
  formData.value.id
    ? $t('ui.actionTitle.edit', ['产品基础信息'])
    : $t('ui.actionTitle.create', ['产品基础信息']),
);

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<ProductBaselineResult> = {
  checkboxConfig: { highlight: true },
  columns: useColumns(onActionClick),
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getProductBaselineListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
  rowConfig: { keyField: 'id' },
  toolbarConfig: {
    custom: true,
    export: true,
    print: true,
    refresh: true,
    refreshOptions: { code: 'query' },
    zoom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function transformDeptTree(nodes: SysDeptTreeResult[]): DeptTreeOption[] {
  return nodes.map((node) => ({
    children: node.children ? transformDeptTree(node.children) : undefined,
    key: node.id,
    title: node.name,
    value: node.id,
  }));
}

async function loadDeptTree() {
  deptLoading.value = true;
  try {
    deptTreeData.value = await getSysDeptTreeApi({});
  } catch {
    message.error('加载部门树失败');
  } finally {
    deptLoading.value = false;
  }
}

function resetFormData() {
  formData.value = {
    dept_ids: [],
    product_name: '',
    product_tag: '',
    remark: '',
    status: 1,
  };
}

async function onRefresh() {
  await gridApi.query();
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<ProductBaselineResult>) {
  switch (code) {
    case 'config': {
      configModalApi
        .setData({
          baselineId: row.id,
          onSuccess: onRefresh,
          productName: row.product_name,
          productTag: row.product_tag,
        })
        .open();
      break;
    }
    case 'delete': {
      if ((row.conditions?.length ?? 0) > 0) {
        message.warning(
          `产品 ${row.product_name} 仍有关联工况配置，请先在工况配置中清理后再删除基线`,
        );
        break;
      }
      deleteProductBaselineApi(row.id).then(async () => {
        message.success(
          $t('ui.actionMessage.deleteSuccess', [row.product_name]),
        );
        await onRefresh();
      });
      break;
    }
    case 'edit': {
      formData.value = {
        dept_ids: row.dept_ids || [],
        id: row.id,
        product_name: row.product_name,
        product_tag: row.product_tag,
        remark: row.remark ?? '',
        status: row.status,
      };
      modalApi.open();
      break;
    }
  }
}

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    if (
      !formData.value.product_tag.trim() ||
      !formData.value.product_name.trim()
    ) {
      message.error('请填写产品标签和产品名称');
      return;
    }

    modalApi.lock();
    const params: CreateProductBaselineParams = {
      conditions: [],
      dept_ids:
        formData.value.dept_ids.length > 0 ? formData.value.dept_ids : null,
      product_name: formData.value.product_name.trim(),
      product_tag: formData.value.product_tag.trim(),
      remark: formData.value.remark.trim() || null,
      status: formData.value.status,
    };

    try {
      await (formData.value.id
        ? updateProductBaselineApi(formData.value.id, params)
        : createProductBaselineApi(params));
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      onRefresh();
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      resetFormData();
    }
  },
});

const [ConfigModalComp, configModalApi] = useVbenModal({
  class: 'w-[900px]',
  connectedComponent: ConfigModal,
  destroyOnClose: true,
});

onMounted(() => {
  loadDeptTree();
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="modalApi.open()">
          <MaterialSymbolsAdd class="size-5" />
          新增产品
        </VbenButton>
      </template>
    </Grid>

    <Modal :title="modalTitle">
      <div class="p-4">
        <p class="mb-4 text-sm text-gray-500">
          第一步：填写产品基础信息。保存后可进入第二步配置工况参数。
        </p>

        <div class="mb-4">
          <label class="mb-1 block text-sm font-medium">
            <span class="text-red-500">*</span>
            产品标签
          </label>
          <Input
            v-model:value="formData.product_tag"
            placeholder="请输入产品标签，如: TQZD通用终端"
          />
        </div>

        <div class="mb-4">
          <label class="mb-1 block text-sm font-medium">
            <span class="text-red-500">*</span>
            产品名称
          </label>
          <Input
            v-model:value="formData.product_name"
            placeholder="请输入产品名称"
          />
        </div>

        <Divider>部门权限</Divider>

        <div class="mb-4">
          <label class="mb-1 block text-sm font-medium">可访问部门</label>
          <TreeSelect
            v-model:value="formData.dept_ids"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
            :loading="deptLoading"
            :tree-data="deptTreeOptions"
            allow-clear
            placeholder="选择可访问此产品的部门"
            show-search
            style="width: 100%"
            tree-checkable
            tree-default-expand-all
            tree-node-filter-prop="title"
          />
          <p class="mt-1 text-xs text-gray-400">留空表示所有部门可访问</p>
        </div>

        <Divider>状态</Divider>

        <div class="mb-4">
          <label class="mb-1 block text-sm font-medium">
            <span class="text-red-500">*</span>
            状态
          </label>
          <Radio.Group v-model:value="formData.status" button-style="solid">
            <Radio :value="1">正常</Radio>
            <Radio :value="0">停用</Radio>
          </Radio.Group>
        </div>

        <div class="mb-4">
          <label class="mb-1 block text-sm font-medium">备注</label>
          <Textarea
            v-model:value="formData.remark"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </div>
      </div>
    </Modal>

    <ConfigModalComp />
  </Page>
</template>
