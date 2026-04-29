<script lang="ts" setup>
import type { TransferItem as AntTransferItem } from 'ant-design-vue/es/transfer';

import type {
  ConditionItem,
  ConfigItemResult,
  ProductBaselineResult,
} from '#/api';

import { computed, h, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  InputNumber,
  message,
  Select,
  Spin,
  Switch,
  Tag,
  Transfer,
} from 'ant-design-vue';

import { getAllConfigItemsApi } from '#/api/config-item';
import {
  getProductBaselineByIdApi,
  updateProductBaselineApi,
} from '#/api/product-baseline';

const RULE_EXPRESSION_OPTIONS = [
  { label: '等于 (==)', value: 0 },
  { label: '不等于 (!=)', value: 1 },
  { label: '大于 (>)', value: 2 },
  { label: '大于等于 (>=)', value: 3 },
  { label: '小于 (<)', value: 4 },
  { label: '小于等于 (<=)', value: 5 },
  { label: '包含 (in)', value: 6 },
  { label: '不包含 (not_in)', value: 7 },
] as const;

interface RangeValue {
  max: null | number;
  min: null | number;
}

type PresetValueType = 'boolean' | 'number' | 'number-range' | 'string';
type EditableValue = boolean | null | number | RangeValue | string;

interface ModalData {
  baselineId: string;
  onSuccess?: () => void;
  productName?: string;
  productTag?: string;
}

interface PresetConfigItem {
  condition_id: string;
  condition_name: string;
  config_key: string;
  group_name: string;
  is_required: boolean;
  placeholders?: [string, string?];
  rule_expression: null | number;
  rule_value: null | string;
  sort_order: number;
  status: number;
}

interface ConfigItem {
  condition_id: string;
  condition_name: string;
  config_key: string;
  group_name: string;
  is_required: boolean;
  rule_expression: null | number | string;
  sort_order: number;
  value: EditableValue;
  value_type: PresetValueType;
}

interface TransferItem {
  description?: string;
  disabled?: boolean;
  key: string;
  title: string;
}

const baselineData = ref<null | ProductBaselineResult>(null);
const configList = ref<ConfigItem[]>([]);
const presetConfigItems = ref<PresetConfigItem[]>([]);
const pageLoading = ref(false);
const saving = ref(false);
const targetKeys = ref<string[]>([]);
const currentBaselineId = ref<string>('');
const currentProductName = ref<string>('');
const currentProductTag = ref<string>('');
const onSuccessCallback = ref<(() => void) | undefined>(undefined);

const modalTitle = computed(
  () =>
    `工况配置 - ${baselineData.value?.product_name || currentProductName.value || '加载中...'}`,
);
const modalDescription = computed(
  () => '维护产品的原子化工况条件，仅调整顺序以及添加/移除配置项。',
);

function resetState() {
  baselineData.value = null;
  configList.value = [];
  presetConfigItems.value = [];
  pageLoading.value = false;
  saving.value = false;
  targetKeys.value = [];
  currentBaselineId.value = '';
  currentProductName.value = '';
  currentProductTag.value = '';
  onSuccessCallback.value = undefined;
}

function normalizeConditionId(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function buildPlaceholders(conditionName: string): [string, string?] {
  return [`请输入${conditionName}`];
}

function mapConfigItemToPreset(item: ConfigItemResult): PresetConfigItem {
  return {
    condition_id: String(item.id),
    condition_name: item.config_name,
    config_key: item.config_key,
    group_name: item.product_tag || '默认分组',
    is_required: item.is_required ?? true,
    placeholders: buildPlaceholders(item.config_name),
    rule_expression: item.rule_expression,
    rule_value: item.rule_value ?? item.default_value,
    sort_order: item.sort_order,
    status: item.status,
  };
}

const presetMapById = computed(
  () =>
    new Map(presetConfigItems.value.map((item) => [item.condition_id, item])),
);

const presetMapByGroupAndKey = computed(() => {
  return new Map(
    presetConfigItems.value.map((item) => [
      `${item.group_name}::${item.config_key}`,
      item,
    ]),
  );
});

const presetMapByKey = computed(() => {
  const map = new Map<string, PresetConfigItem[]>();
  presetConfigItems.value.forEach((item) => {
    const group = map.get(item.config_key) ?? [];
    group.push(item);
    map.set(item.config_key, group);
  });
  return map;
});

const transferDataSource = computed<TransferItem[]>(() => {
  return presetConfigItems.value.map((item) => ({
    description: `${item.config_key} - ${item.group_name}`,
    disabled: item.status !== 1,
    key: item.condition_id,
    title: item.condition_name,
  }));
});

const selectedConfigList = computed(() => {
  const itemMap = new Map(
    configList.value.map((item) => [item.condition_id, item]),
  );
  return targetKeys.value
    .map((conditionId) => itemMap.get(conditionId))
    .filter((item): item is ConfigItem => item !== null && item !== undefined);
});

function coerceNumber(value: unknown): null | number {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function inferValueType(value: unknown): PresetValueType {
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'string') {
    return 'string';
  }
  return 'number-range';
}

function normalizeRangeValue(
  value: unknown,
  fallback?: Record<string, number>,
): RangeValue {
  if (value && typeof value === 'object') {
    const maybeRange = value as { max?: null | number; min?: null | number };
    return {
      max:
        typeof maybeRange.max === 'number'
          ? maybeRange.max
          : (fallback?.max ?? null),
      min:
        typeof maybeRange.min === 'number'
          ? maybeRange.min
          : (fallback?.min ?? null),
    };
  }
  return {
    max: fallback?.max ?? null,
    min: fallback?.min ?? null,
  };
}

function getPreset(conditionId: string): PresetConfigItem | undefined {
  return presetMapById.value.get(conditionId);
}

function resolvePreset(condition: ConditionItem): PresetConfigItem | undefined {
  const rawConditionId = normalizeConditionId(condition.condition_id);
  if (presetMapById.value.has(rawConditionId)) {
    return presetMapById.value.get(rawConditionId);
  }

  const candidateKeys = [condition.config_key, rawConditionId]
    .map((item) => item?.trim())
    .filter(Boolean);
  const candidateGroup = condition.group_name || '';

  if (candidateGroup) {
    for (const key of candidateKeys) {
      const preset = presetMapByGroupAndKey.value.get(
        `${candidateGroup}::${key}`,
      );
      if (preset) {
        return preset;
      }
    }
  }

  for (const key of candidateKeys) {
    const presets = presetMapByKey.value.get(key) ?? [];
    if (presets.length === 1) {
      return presets[0];
    }
    if (candidateGroup) {
      const matched = presets.find(
        (item) => item.group_name === candidateGroup,
      );
      if (matched) {
        return matched;
      }
    }
  }

  return undefined;
}

function parseRuleValue(ruleValue: null | string): {
  type: PresetValueType;
  value: EditableValue;
} {
  if (!ruleValue) {
    return { type: 'string', value: null };
  }
  // Try parsing as JSON for range values
  try {
    const parsed = JSON.parse(ruleValue);
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      ('min' in parsed || 'max' in parsed)
    ) {
      return {
        type: 'number-range',
        value: { min: parsed.min ?? null, max: parsed.max ?? null },
      };
    }
    if (typeof parsed === 'boolean') {
      return { type: 'boolean', value: parsed };
    }
    if (typeof parsed === 'number') {
      return { type: 'number', value: parsed };
    }
  } catch {
    // Not JSON, treat as string
  }
  // Check for boolean strings
  if (ruleValue === 'true') {
    return { type: 'boolean', value: true };
  }
  if (ruleValue === 'false') {
    return { type: 'boolean', value: false };
  }
  // Check for number
  const num = Number(ruleValue);
  if (!Number.isNaN(num)) {
    return { type: 'number', value: num };
  }
  return { type: 'string', value: ruleValue };
}

function getDefaultValue(preset?: PresetConfigItem): {
  type: PresetValueType;
  value: EditableValue;
} {
  if (!preset) {
    return { value: null, type: 'string' };
  }
  return parseRuleValue(preset.rule_value);
}

function createConfigItemFromPreset(preset: PresetConfigItem): ConfigItem {
  const { value, type } = getDefaultValue(preset);
  return {
    condition_id: preset.condition_id,
    condition_name: preset.condition_name,
    config_key: preset.config_key,
    group_name: preset.group_name,
    is_required: preset.is_required,
    rule_expression:
      preset.rule_expression === null || preset.rule_expression === undefined
        ? ''
        : String(preset.rule_expression),
    sort_order: preset.sort_order,
    value,
    value_type: type,
  };
}

function resolveRuleExpression(
  conditionRule: null | number | string | undefined,
  presetRule: null | number | undefined,
): null | number {
  if (conditionRule !== null && conditionRule !== undefined) {
    const num = Number(conditionRule);
    return Number.isNaN(num) ? null : num;
  }
  if (presetRule !== null && presetRule !== undefined) {
    return presetRule;
  }
  return null;
}

function resolveConditionValue(
  condition: ConditionItem,
  valueType: PresetValueType,
  fallbackValue: ConfigItem['value'],
): ConfigItem['value'] {
  if (valueType === 'number-range') {
    return normalizeRangeValue(condition.value);
  }
  if (valueType === 'number') {
    return coerceNumber(condition.value) ?? fallbackValue;
  }
  return (
    (condition.value as boolean | null | string | undefined) ?? fallbackValue
  );
}

function buildConfigItem(condition: ConditionItem, index: number): ConfigItem {
  const preset = resolvePreset(condition);
  const rawConditionId = normalizeConditionId(condition.condition_id);
  const presetDefault = getDefaultValue(preset);
  const valueType = presetDefault.type ?? inferValueType(condition.value);
  const configKey =
    condition.config_key ?? preset?.config_key ?? rawConditionId;
  const groupName = condition.group_name ?? preset?.group_name ?? '其他';

  return {
    condition_id: preset?.condition_id ?? rawConditionId,
    condition_name:
      condition.condition_name || preset?.condition_name || configKey,
    config_key: configKey,
    group_name: groupName,
    is_required: condition.is_required ?? preset?.is_required ?? true,
    rule_expression: resolveRuleExpression(
      condition.rule_expression,
      preset?.rule_expression,
    ),
    sort_order: condition.sort_order ?? index,
    value: resolveConditionValue(condition, valueType, presetDefault.value),
    value_type: valueType,
  };
}

function conditionsToList(conditions: ConditionItem[] | null): ConfigItem[] {
  if (!conditions) {
    return [];
  }
  return conditions.map((condition, index) =>
    buildConfigItem(condition, index + 1),
  );
}

function sanitizeValue(item: ConfigItem): ConditionItem['value'] {
  if (item.value_type === 'number-range') {
    const rangeValue = item.value as RangeValue;
    const normalizedValue = {
      ...(rangeValue.min === null || rangeValue.min === undefined
        ? {}
        : { min: rangeValue.min }),
      ...(rangeValue.max === null || rangeValue.max === undefined
        ? {}
        : { max: rangeValue.max }),
    };
    return Object.keys(normalizedValue).length > 0 ? normalizedValue : null;
  }
  if (item.value_type === 'number') {
    if (typeof item.value === 'number') {
      return item.value;
    }
    const num = Number(item.value);
    return Number.isNaN(num) ? null : num;
  }
  if (item.value_type === 'boolean') {
    return typeof item.value === 'boolean' ? item.value : false;
  }
  return typeof item.value === 'string' && item.value !== ''
    ? item.value
    : null;
}

function buildPayload(list: ConfigItem[]) {
  return {
    conditions:
      list.length === 0
        ? null
        : list.map((item, index) => ({
            condition_id: item.condition_id,
            condition_name: item.condition_name,
            config_key: item.config_key,
            group_name: item.group_name,
            is_required: item.is_required,
            rule_expression:
              typeof item.rule_expression === 'number'
                ? item.rule_expression
                : null,
            sort_order: index + 1,
            value: sanitizeValue(item),
          })),
  };
}

async function loadPresetConfigItems() {
  const result = await getAllConfigItemsApi();
  presetConfigItems.value = result.map((item) => mapConfigItemToPreset(item));
}

async function loadPage() {
  if (!currentBaselineId.value) {
    return;
  }

  pageLoading.value = true;
  try {
    const result = await getProductBaselineByIdApi(
      currentBaselineId.value,
      currentProductTag.value,
    );
    baselineData.value = result;
    await loadPresetConfigItems();
    configList.value = conditionsToList(result.conditions);
    targetKeys.value = configList.value.map((item) => item.condition_id);
  } catch (error: unknown) {
    const err = error as Error;
    message.error(err.message || '加载配置失败');
  } finally {
    pageLoading.value = false;
  }
}

function filterOption(inputValue: string, item: AntTransferItem) {
  const title = String(item.title ?? '');
  const description = String(item.description ?? '');
  return title.includes(inputValue) || description.includes(inputValue);
}

function renderItem(item: AntTransferItem) {
  const title = String(item.title ?? '');
  const description = String(item.description ?? '');

  return {
    label: h('div', { class: 'leading-5' }, [
      h('div', { class: 'font-medium text-gray-800' }, title),
      h('div', { class: 'text-xs text-gray-400' }, description),
    ]),
    value: `${title} ${description}`,
  };
}

function handleTransferChange(nextTargetKeys: string[]) {
  const configMap = new Map(
    configList.value.map((item) => [item.condition_id, item]),
  );

  configList.value = nextTargetKeys
    .map((conditionId) => {
      const existing = configMap.get(conditionId);
      if (existing) {
        return existing;
      }

      const preset = getPreset(conditionId);
      if (!preset) {
        return null;
      }
      return createConfigItemFromPreset(preset);
    })
    .filter((item): item is ConfigItem => item !== null && item !== undefined);

  configList.value.forEach((item, index) => {
    item.sort_order = index + 1;
  });

  targetKeys.value = nextTargetKeys;
}

function moveConfigItem(conditionId: string, direction: -1 | 1) {
  const currentIndex = configList.value.findIndex(
    (item) => item.condition_id === conditionId,
  );
  const nextIndex = currentIndex + direction;
  if (
    currentIndex < 0 ||
    nextIndex < 0 ||
    nextIndex >= configList.value.length
  ) {
    return;
  }

  const nextList = [...configList.value];
  const [targetItem] = nextList.splice(currentIndex, 1);
  if (!targetItem) {
    return;
  }
  nextList.splice(nextIndex, 0, targetItem);
  nextList.forEach((item, index) => {
    item.sort_order = index + 1;
  });

  configList.value = nextList;
  targetKeys.value = nextList.map((item) => item.condition_id);
}

function updateRuleExpression(conditionId: string, value: number | undefined) {
  const target = configList.value.find(
    (item) => item.condition_id === conditionId,
  );
  if (target) {
    target.rule_expression = value ?? null;
  }
}

function updateNumberValue(conditionId: string, value: null | number) {
  const target = configList.value.find(
    (item) => item.condition_id === conditionId,
  );
  if (target) {
    target.value = value;
  }
}

function updateRangeValue(
  conditionId: string,
  field: keyof RangeValue,
  value: null | number,
) {
  const target = configList.value.find(
    (item) => item.condition_id === conditionId,
  );
  if (target && target.value_type === 'number-range') {
    const currentValue = target.value as RangeValue;
    target.value = {
      ...currentValue,
      [field]: value,
    };
  }
}

function updateStringValue(conditionId: string, value: string) {
  const target = configList.value.find(
    (item) => item.condition_id === conditionId,
  );
  if (target) {
    target.value = value;
  }
}

function updateBooleanValue(conditionId: string, checked: boolean) {
  const target = configList.value.find(
    (item) => item.condition_id === conditionId,
  );
  if (target) {
    target.value = checked;
  }
}

function updateRequired(conditionId: string, checked: boolean) {
  const target = configList.value.find(
    (item) => item.condition_id === conditionId,
  );
  if (target) {
    target.is_required = checked;
  }
}

function getRangeValue(value: EditableValue): RangeValue {
  return normalizeRangeValue(value);
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!currentBaselineId.value || !baselineData.value) {
      return;
    }

    saving.value = true;
    modalApi.lock();
    try {
      const payload = buildPayload(configList.value);
      await updateProductBaselineApi(currentBaselineId.value, {
        product_tag: baselineData.value.product_tag,
        product_name: baselineData.value.product_name,
        dept_ids: baselineData.value.dept_ids,
        conditions: payload.conditions,
        status: baselineData.value.status,
        remark: baselineData.value.remark,
      });
      message.success('保存成功');
      onSuccessCallback.value?.();
      await modalApi.close();
    } catch (error: unknown) {
      const err = error as Error;
      message.error(err.message || '保存失败');
    } finally {
      saving.value = false;
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      // 从 modalApi.getData 获取数据并设置到 ref
      const data = modalApi.getData<ModalData>();
      if (data?.baselineId) {
        currentBaselineId.value = data.baselineId;
        currentProductName.value = data.productName || '';
        currentProductTag.value = data.productTag || '';
        onSuccessCallback.value = data.onSuccess;
        loadPage();
      }
      return;
    }
    resetState();
  },
});
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline -->
  <Modal :title="modalTitle">
    <div class="space-y-4 p-4">
      <div
        class="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500"
      >
        {{ modalDescription }}
      </div>

      <Spin :spinning="pageLoading || saving">
        <div class="space-y-4">
          <Card>
            <div class="flex justify-center overflow-x-auto py-2">
              <Transfer
                v-model:target-keys="targetKeys"
                :data-source="transferDataSource"
                :filter-option="filterOption"
                :list-style="{ width: '350px', height: '420px' }"
                :operations="['添加 >', '< 移除']"
                :render="renderItem"
                :titles="['可选配置项', '已选配置项']"
                show-search
                @change="handleTransferChange"
              />
            </div>
          </Card>

          <Card title="已选工况详情">
            <div class="space-y-3">
              <div
                v-for="config in selectedConfigList"
                :key="`${config.condition_id}-${config.group_name}`"
                class="rounded bg-gray-50 p-3 hover:bg-gray-100"
              >
                <div class="mb-3 flex items-center gap-3">
                  <Tag class="min-w-24" color="blue">
                    {{ config.group_name }}
                  </Tag>
                  <span class="min-w-32 text-sm font-medium">{{
                    config.condition_name
                  }}</span>
                  <span class="text-xs text-gray-400">{{
                    config.config_key
                  }}</span>
                  <span class="text-xs text-gray-400"
                    >ID: {{ config.condition_id }}</span
                  >
                  <span class="text-xs text-gray-400"
                    >顺序: {{ config.sort_order }}</span
                  >
                  <div class="ml-auto flex items-center gap-2">
                    <span class="text-xs text-gray-500">必检</span>
                    <Switch
                      :checked="config.is_required"
                      size="small"
                      @change="
                        (checked: boolean | number | string) =>
                          updateRequired(config.condition_id, checked === true)
                      "
                    />
                    <Button
                      :disabled="config.sort_order === 1"
                      size="small"
                      @click="moveConfigItem(config.condition_id, -1)"
                    >
                      上移
                    </Button>
                    <Button
                      :disabled="
                        config.sort_order === selectedConfigList.length
                      "
                      size="small"
                      @click="moveConfigItem(config.condition_id, 1)"
                    >
                      下移
                    </Button>
                  </div>
                </div>

                <div class="grid grid-cols-[220px_1fr] gap-3">
                  <Select
                    :value="
                      typeof config.rule_expression === 'number'
                        ? config.rule_expression
                        : undefined
                    "
                    :options="RULE_EXPRESSION_OPTIONS"
                    allow-clear
                    placeholder="请选择规则表达式"
                    size="small"
                    style="width: 100%"
                    @change="
                      (value: number | undefined) =>
                        updateRuleExpression(config.condition_id, value)
                    "
                  />

                  <div
                    v-if="config.value_type === 'number-range'"
                    class="grid grid-cols-2 gap-3"
                  >
                    <InputNumber
                      :value="getRangeValue(config.value).min ?? undefined"
                      :placeholder="
                        getPreset(config.condition_id)?.placeholders?.[0] ??
                        '最小值'
                      "
                      class="w-full"
                      size="small"
                      @change="
                        (value) =>
                          updateRangeValue(
                            config.condition_id,
                            'min',
                            typeof value === 'number' ? value : null,
                          )
                      "
                    />
                    <InputNumber
                      :value="getRangeValue(config.value).max ?? undefined"
                      :placeholder="
                        getPreset(config.condition_id)?.placeholders?.[1] ??
                        '最大值'
                      "
                      class="w-full"
                      size="small"
                      @change="
                        (value) =>
                          updateRangeValue(
                            config.condition_id,
                            'max',
                            typeof value === 'number' ? value : null,
                          )
                      "
                    />
                  </div>

                  <InputNumber
                    v-else-if="config.value_type === 'number'"
                    :value="
                      typeof config.value === 'number'
                        ? config.value
                        : config.value != null
                          ? Number(config.value) || undefined
                          : undefined
                    "
                    :placeholder="
                      getPreset(config.condition_id)?.placeholders?.[0] ??
                      '请输入数值'
                    "
                    class="w-full"
                    size="small"
                    @change="
                      (value) =>
                        updateNumberValue(
                          config.condition_id,
                          typeof value === 'number' ? value : null,
                        )
                    "
                  />

                  <div
                    v-else-if="config.value_type === 'boolean'"
                    class="flex items-center gap-2"
                  >
                    <Switch
                      :checked="Boolean(config.value)"
                      size="small"
                      @change="
                        (checked: boolean | number | string) =>
                          updateBooleanValue(
                            config.condition_id,
                            checked === true,
                          )
                      "
                    />
                    <span class="text-xs text-gray-500">{{
                      Boolean(config.value) ? '是' : '否'
                    }}</span>
                  </div>

                  <Input
                    v-else
                    :value="
                      typeof config.value === 'string' ? config.value : ''
                    "
                    :placeholder="
                      getPreset(config.condition_id)?.placeholders?.[0] ??
                      '请输入内容'
                    "
                    size="small"
                    @change="
                      (e: Event) =>
                        updateStringValue(
                          config.condition_id,
                          (e.target as HTMLInputElement).value,
                        )
                    "
                  />
                </div>
              </div>

              <div
                v-if="selectedConfigList.length === 0"
                class="py-8 text-center text-gray-400"
              >
                暂无已选工况项，请通过上方穿梭框添加
              </div>
            </div>
          </Card>
        </div>
      </Spin>
    </div>
  </Modal>
</template>
