<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  ConfigItemCreate,
  ConfigItemResult,
  ConfigItemUpdate,
  ProductBaselineResult,
} from '#/api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createConfigItemApi,
  deleteConfigItemApi,
  getAllProductBaselineApi,
  getConfigItemListApi,
  updateConfigItemApi,
} from '#/api';

import { querySchema, schema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<ConfigItemResult> = {
  rowConfig: {
    keyField: 'id',
  },
  height: 'auto',
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
        return await getConfigItemListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const activeBaselineTags = ref<string[]>([]);

type ProductTagOption = {
  label: string;
  value: string;
};

async function loadProductTagOptions(currentProductTag?: string) {
  const baselines = await getAllProductBaselineApi();
  activeBaselineTags.value = baselines.map(
    (item: ProductBaselineResult) => item.product_tag,
  );

  const options: ProductTagOption[] = baselines.map(
    (item: ProductBaselineResult) => ({
      label: `${item.product_name} (${item.product_tag})`,
      value: item.product_tag,
    }),
  );

  if (
    currentProductTag &&
    !activeBaselineTags.value.includes(currentProductTag)
  ) {
    options.unshift({
      label: `${currentProductTag}（基线已删除）`,
      value: currentProductTag,
    });
  }

  formApi.updateSchema([
    {
      componentProps: {
        allowClear: false,
        options,
        placeholder:
          options.length > 0
            ? '请选择产品标签'
            : '暂无可用产品基线，请先创建基线',
        showSearch: true,
        style: { width: '100%' },
      },
      fieldName: 'product_tag',
    },
  ]);
}

async function onRefresh() {
  await gridApi.query();
}

interface FormData extends ConfigItemCreate {
  id?: string;
  is_required?: boolean;
}

const formData = ref<FormData>();

const editingOrphanConfig = computed(() => {
  const currentProductTag = formData.value?.product_tag?.trim();
  return Boolean(
    formData.value?.id &&
      currentProductTag &&
      !activeBaselineTags.value.includes(currentProductTag),
  );
});

function buildUpdatePayload(data: FormData): ConfigItemUpdate {
  return {
    config_key: data.config_key.trim(),
    config_name: data.config_name.trim(),
    default_value: data.default_value?.trim() || null,
    is_required: data.is_required ?? true,
    product_tag: data.product_tag.trim(),
    rule_expression: data.rule_expression ?? null,
    rule_value: data.rule_value?.trim() || null,
    sort_order: data.sort_order ?? 0,
    status: data.status ?? 1,
    remark: data.remark?.trim() || null,
    value_type: data.value_type || 'string',
  };
}

async function handleDelete(row: ConfigItemResult) {
  await deleteConfigItemApi(row.id);
  message.success($t('ui.actionMessage.deleteSuccess', [row.config_name]));
  await onRefresh();
}

async function handleToggleStatus(row: ConfigItemResult) {
  const targetStatus = row.status === 1 ? 0 : 1;
  await updateConfigItemApi(row.id, { status: targetStatus });
  message.success(targetStatus === 1 ? '启用成功' : '停用成功');
  await onRefresh();
}

function onActionClick({ code, row }: OnActionClickParams<ConfigItemResult>) {
  switch (code) {
    case 'delete': {
      handleDelete(row);
      break;
    }
    case 'edit': {
      modalApi.setData(row).open();
      break;
    }
    case 'toggle-status': {
      handleToggleStatus(row);
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

const modalTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['工况配置项'])
    : $t('ui.actionTitle.create', ['工况配置项']);
});

const [ModalComponent, modalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    try {
      const data = await formApi.getValues<FormData>();
      await (formData.value?.id
        ? updateConfigItemApi(formData.value.id, buildUpdatePayload(data))
        : createConfigItemApi({
            config_key: data.config_key.trim(),
            config_name: data.config_name.trim(),
            default_value: data.default_value?.trim() || null,
            is_required: data.is_required ?? true,
            product_tag: data.product_tag.trim(),
            rule_expression: data.rule_expression ?? null,
            rule_value: data.rule_value?.trim() || null,
            sort_order: data.sort_order ?? 0,
            status: data.status ?? 1,
            remark: data.remark?.trim() || null,
            value_type: data.value_type || 'string',
          }));
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      await onRefresh();
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData<FormData>();
    void loadProductTagOptions(data?.product_tag);
    formApi.resetForm();
    formData.value = data;
    formApi.setValues({
      config_key: data?.config_key ?? '',
      config_name: data?.config_name ?? '',
      default_value: data?.default_value ?? '',
      is_required: data?.is_required ?? true,
      product_tag: data?.product_tag ?? '',
      rule_expression: data?.rule_expression ?? null,
      rule_value: data?.rule_value ?? '',
      sort_order: data?.sort_order ?? 0,
      status: data?.status ?? 1,
      remark: data?.remark ?? '',
      value_type: data?.value_type ?? 'string',
    });
  },
});

async function openCreateModal() {
  await loadProductTagOptions();
  if (activeBaselineTags.value.length === 0) {
    message.warning('请先在项目基线管理中创建产品基线，再新增工况配置项');
    return;
  }
  modalApi.setData(null).open();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="openCreateModal">
          <MaterialSymbolsAdd class="size-5" />
          新增配置项
        </VbenButton>
      </template>
    </Grid>
    <ModalComponent :title="modalTitle">
      <div v-if="editingOrphanConfig" class="px-1 pb-3 text-xs text-amber-600">
        当前配置项绑定的产品基线已删除。建议先将产品标签切换到有效基线，或直接删除这条配置项。
      </div>
      <div v-if="formData?.id" class="px-1 pb-3 text-xs text-gray-500">
        配置项 Key 修改后会同步更新当前产品基线中的对应条件标识，请谨慎操作。
      </div>
      <Form />
    </ModalComponent>
  </Page>
</template>
