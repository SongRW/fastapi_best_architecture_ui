<script lang="ts" setup>
import type { TableProps, TreeProps } from 'ant-design-vue';

import type {
  CidSegmentResult,
  ProductBaselineResult,
  SysDeptTreeResult,
} from '#/api';

import { computed, ref, watch } from 'vue';

import { VbenButton } from '@vben/common-ui';

import {
  Card,
  Input,
  InputNumber,
  message,
  Select,
  Steps,
  Table,
  TreeSelect,
} from 'ant-design-vue';

import {
  getAllProductBaselineApi,
  getCidSegmentListApi,
  getSysDeptTreeApi,
} from '#/api';

import { priorityOptions } from '../data';

// 向导数据结构
interface WizardData {
  dept_id: null | string;
  dept_name: string;
  cid_segment_id: null | string;
  cid_segment_info: string;
  product_tag: string;
  quantity: number;
  priority: number;
  remark: string;
}

const emit = defineEmits<{
  (e: 'submit', data: WizardData): void;
  (e: 'cancel'): void;
}>();

// 当前步骤
const currentStep = ref(0);

// 向导数据
const wizardData = ref<WizardData>({
  dept_id: null,
  dept_name: '',
  cid_segment_id: null,
  cid_segment_info: '',
  product_tag: '',
  quantity: 1,
  priority: 0,
  remark: '',
});

// 部门树数据
const deptTreeData = ref<SysDeptTreeResult[]>([]);
const deptTreeLoading = ref(false);

// 号段列表
const cidSegmentList = ref<CidSegmentResult[]>([]);
const cidSegmentLoading = ref(false);
const selectedCidSegment = ref<CidSegmentResult | null>(null);

// CID 搜索
const cidSearchValue = ref('');

// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

// 产品列表
const productList = ref<ProductBaselineResult[]>([]);
const productLoading = ref(false);
const productOptions = computed(() =>
  productList.value.map((item: ProductBaselineResult) => ({
    label: `${item.product_tag} - ${item.product_name}`,
    value: item.product_tag,
  })),
);

// 步骤 1: 加载部门树
async function loadDeptTree() {
  deptTreeLoading.value = true;
  try {
    const result = await getSysDeptTreeApi({});
    deptTreeData.value = result;
  } catch {
    message.error('加载部门树失败');
  } finally {
    deptTreeLoading.value = false;
  }
}

// 转换部门树数据为 TreeSelect 组件格式
const treeData = computed<TreeProps['treeData']>(() => {
  function transform(nodes: SysDeptTreeResult[]): TreeProps['treeData'] {
    return nodes.map((node) => ({
      key: node.id,
      title: node.name,
      value: node.id,
      children: node.children ? transform(node.children) : undefined,
    }));
  }
  return transform(deptTreeData.value);
});

// TreeSelect 搜索过滤
function filterDeptNode(
  inputValue: string,
  treeNode: { title?: string },
): boolean {
  const title = treeNode.title;
  if (typeof title === 'string') {
    return title.toLowerCase().includes(inputValue.toLowerCase());
  }
  return false;
}

// TreeSelect 选择处理
function handleDeptSelect(value: string | undefined) {
  if (value) {
    wizardData.value.dept_id = value;
    // 查找部门名称
    const findDeptName = (
      nodes: SysDeptTreeResult[],
      targetId: string,
    ): null | string => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return node.name;
        }
        if (node.children) {
          const found = findDeptName(node.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    wizardData.value.dept_name = findDeptName(deptTreeData.value, value) || '';
  } else {
    wizardData.value.dept_id = null;
    wizardData.value.dept_name = '';
  }
}

// 步骤 1 是否可以继续
const canProceedStep1 = computed(() => !!wizardData.value.dept_id);

// 步骤 2: 加载号段列表
async function loadCidSegments() {
  if (!wizardData.value.dept_id) return;

  cidSegmentLoading.value = true;
  try {
    const result = await getCidSegmentListApi({
      page: pagination.value.current,
      size: pagination.value.pageSize,
      dept_id: Number(wizardData.value.dept_id),
      cid: cidSearchValue.value ? Number(cidSearchValue.value) : undefined,
    });
    cidSegmentList.value = result.items;
    pagination.value.total = result.total;
  } catch {
    message.error('加载号段列表失败');
  } finally {
    cidSegmentLoading.value = false;
  }
}

// 号段表格列定义
const cidColumns: TableProps['columns'] = [
  {
    title: 'CID 范围',
    dataIndex: 'cid_range',
    key: 'cid_range',
    width: 200,
    customRender: ({ record }) => `${record.start_cid} - ${record.end_cid}`,
  },
  {
    title: '频段',
    dataIndex: 'frequency_band',
    key: 'frequency_band',
    width: 120,
  },
  {
    title: '总量',
    dataIndex: 'total_count',
    key: 'total_count',
    width: 80,
    align: 'center',
  },
  {
    title: '已用',
    dataIndex: 'used_count',
    key: 'used_count',
    width: 80,
    align: 'center',
  },
  {
    title: '使用率',
    dataIndex: 'usage_rate',
    key: 'usage_rate',
    width: 100,
    align: 'center',
    customRender: ({ record }) => `${(record.usage_rate * 100).toFixed(1)}%`,
  },
  {
    title: '开工绑定',
    dataIndex: 'dept_id',
    key: 'dept_id',
    width: 120,
    customRender: ({ record }) =>
      record.dept_id ? `部门 ${record.dept_id}` : '未绑定',
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    align: 'center',
  },
];

// 表格数据源（直接使用接口返回的数据）
const tableDataSource = computed(() => cidSegmentList.value);

// 搜索处理
function handleCidSearch() {
  pagination.value.current = 1; // 搜索时重置页码
  loadCidSegments(); // 重新加载数据
}

// 表格分页变化处理
function handleTableChange(pag: { current?: number; pageSize?: number }) {
  if (pag.current) {
    pagination.value.current = pag.current;
  }
  if (pag.pageSize) {
    pagination.value.pageSize = pag.pageSize;
  }
  loadCidSegments(); // 重新加载数据
}

// 选择号段
function handleCidSegmentSelect(segment: CidSegmentResult) {
  selectedCidSegment.value = segment;
  wizardData.value.cid_segment_id = segment.id;
  wizardData.value.cid_segment_info = `CID: ${segment.start_cid} - ${segment.end_cid} (${segment.frequency_band})`;
}

function isCidSegmentRecord(record: unknown): record is CidSegmentResult {
  return (
    !!record &&
    typeof record === 'object' &&
    'id' in record &&
    'start_cid' in record &&
    'end_cid' in record &&
    'frequency_band' in record
  );
}

function handleCidSegmentSelectFromTable(record: unknown) {
  if (isCidSegmentRecord(record)) {
    handleCidSegmentSelect(record);
  }
}

// 步骤 2 是否可以继续
const canProceedStep2 = computed(() => !!wizardData.value.cid_segment_id);

// 步骤 3: 加载产品列表
async function loadProducts() {
  productLoading.value = true;
  try {
    const result = await getAllProductBaselineApi();
    productList.value = result;
  } catch {
    message.error('加载产品列表失败');
  } finally {
    productLoading.value = false;
  }
}

// 步骤 3 是否可以提交
const canSubmit = computed(
  () => !!wizardData.value.product_tag && wizardData.value.quantity > 0,
);

// 初始化
loadDeptTree();
loadProducts();

// 监听步骤变化，加载号段数据
watch(currentStep, (newStep) => {
  if (newStep === 1 && wizardData.value.dept_id) {
    loadCidSegments();
  }
});

// 监听部门选择变化，重置号段数据
watch(
  () => wizardData.value.dept_id,
  () => {
    cidSearchValue.value = '';
    selectedCidSegment.value = null;
    wizardData.value.cid_segment_id = null;
    wizardData.value.cid_segment_info = '';
    pagination.value.current = 1;
  },
);

// 步骤操作
function handlePrev() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

function handleNext() {
  if (currentStep.value === 0 && canProceedStep1.value) {
    currentStep.value = 1;
  } else if (currentStep.value === 1 && canProceedStep2.value) {
    currentStep.value = 2;
  }
}

function handleSubmit() {
  if (canSubmit.value) {
    emit('submit', wizardData.value);
  }
}

function handleCancel() {
  emit('cancel');
}

// 重置向导
function resetWizard() {
  currentStep.value = 0;
  wizardData.value = {
    dept_id: null,
    dept_name: '',
    cid_segment_id: null,
    cid_segment_info: '',
    product_tag: '',
    quantity: 1,
    priority: 0,
    remark: '',
  };
  selectedCidSegment.value = null;
  cidSearchValue.value = '';
  pagination.value.current = 1;
}

// 暴露重置方法
defineExpose({ resetWizard });
</script>

<template>
  <div class="wizard-container">
    <!-- 步骤指示器 -->
    <Steps :current="currentStep" class="mb-6">
      <Steps.Step title="选择工厂" description="选择目标工厂" />
      <Steps.Step title="选择号段" description="选择可用号段" />
      <Steps.Step title="确认信息" description="填写工单信息" />
    </Steps>

    <!-- 步骤内容 -->
    <div class="wizard-content">
      <!-- Step 1: 工厂选择 -->
      <div v-show="currentStep === 0" class="step-panel">
        <Card title="选择目标工厂" :bordered="false">
          <div class="dept-select-wrapper">
            <TreeSelect
              v-model:value="wizardData.dept_id"
              :tree-data="treeData"
              :field-names="{
                label: 'title',
                value: 'key',
                children: 'children',
              }"
              show-search
              :filter-tree-node="filterDeptNode"
              placeholder="请选择工厂"
              tree-default-expand-all
              allow-clear
              :loading="deptTreeLoading"
              style="width: 100%"
              @change="handleDeptSelect"
            />
          </div>
          <div v-if="wizardData.dept_name" class="selected-info mt-4">
            <span class="label">已选择工厂：</span>
            <span class="value">{{ wizardData.dept_name }}</span>
          </div>
        </Card>
      </div>

      <!-- Step 2: 号段选择 -->
      <div v-show="currentStep === 1" class="step-panel">
        <Card title="选择号段" :bordered="false">
          <div class="cid-search-wrapper">
            <Input.Search
              v-model:value="cidSearchValue"
              placeholder="输入 CID 数字搜索号段"
              enter-button="搜索"
              style="width: 100%; max-width: 400px"
              @search="handleCidSearch"
            />
          </div>
          <div class="cid-table-wrapper">
            <Table
              :columns="cidColumns"
              :data-source="tableDataSource"
              :loading="cidSegmentLoading"
              :pagination="{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total: number) => `共 ${total} 条`,
              }"
              :row-key="(record: CidSegmentResult) => record.id"
              :row-class-name="
                (record: CidSegmentResult) =>
                  selectedCidSegment?.id === record.id ? 'selected-row' : ''
              "
              size="middle"
              @change="handleTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-button
                    type="link"
                    size="small"
                    :class="
                      selectedCidSegment?.id === record.id ? 'selected-btn' : ''
                    "
                    @click="handleCidSegmentSelectFromTable(record)"
                  >
                    {{
                      selectedCidSegment?.id === record.id ? '已选择' : '选择'
                    }}
                  </a-button>
                </template>
              </template>
            </Table>
          </div>
          <div v-if="wizardData.cid_segment_info" class="selected-info mt-4">
            <span class="label">已选择号段：</span>
            <span class="value">{{ wizardData.cid_segment_info }}</span>
          </div>
          <div class="empty-hint">
            工单创建后，本地自动/手动取号都会按“工厂 + 产品标签 +
            号段”规则过滤可用 CID。
          </div>
        </Card>
      </div>
      <!-- Step 3: 信息确认 -->
      <div v-show="currentStep === 2" class="step-panel">
        <Card title="确认工单信息" :bordered="false">
          <div class="confirm-info-grid">
            <div class="info-row">
              <span class="label">目标工厂：</span>
              <span class="value">{{ wizardData.dept_name }}</span>
            </div>
            <div class="info-row">
              <span class="label">号段信息：</span>
              <span class="value">{{ wizardData.cid_segment_info }}</span>
            </div>
          </div>

          <div class="form-section">
            <div class="form-item">
              <label class="form-label required">产品标签</label>
              <Select
                v-model:value="wizardData.product_tag"
                :options="productOptions"
                :loading="productLoading"
                placeholder="请选择产品标签"
                style="width: 100%"
              />
            </div>

            <div class="form-item">
              <label class="form-label required">数量</label>
              <InputNumber
                v-model:value="wizardData.quantity"
                :min="1"
                :max="100000"
                placeholder="请输入数量"
                style="width: 100%"
              />
            </div>

            <div class="form-item">
              <label class="form-label">优先级</label>
              <Select
                v-model:value="wizardData.priority"
                :options="priorityOptions"
                placeholder="请选择优先级"
                style="width: 100%"
              />
            </div>

            <div class="form-item">
              <label class="form-label">备注</label>
              <Input.TextArea
                v-model:value="wizardData.remark"
                :maxlength="200"
                :show-count="true"
                :rows="3"
                placeholder="请输入备注（200字以内）"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="wizard-footer">
      <VbenButton variant="default" @click="handleCancel"> 取消 </VbenButton>
      <VbenButton v-if="currentStep > 0" variant="default" @click="handlePrev">
        上一步
      </VbenButton>
      <VbenButton
        v-if="currentStep < 2"
        :disabled="currentStep === 0 ? !canProceedStep1 : !canProceedStep2"
        variant="heavy"
        @click="handleNext"
      >
        下一步
      </VbenButton>
      <VbenButton
        v-if="currentStep === 2"
        :disabled="!canSubmit"
        variant="heavy"
        @click="handleSubmit"
      >
        提交
      </VbenButton>
    </div>
  </div>
</template>

<style scoped>
.wizard-container {
  display: flex;
  flex-direction: column;
  min-height: 450px;
}

.wizard-content {
  flex: 1;
  padding-right: 4px;
  overflow-y: auto;
}

.step-panel {
  animation: fade-in 0.3s ease-in-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dept-select-wrapper {
  padding: 16px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.cid-search-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.cid-table-wrapper {
  margin-top: 0;
}

.selected-info {
  padding: 12px 16px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%);
  border-left: 3px solid #1890ff;
  border-radius: 6px;
}

.selected-info .label {
  margin-right: 8px;
  color: #666;
}

.selected-info .value {
  font-weight: 600;
  color: #1890ff;
}

.selected-row {
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%) !important;
}

.selected-btn {
  font-weight: 600;
  color: #1890ff !important;
}

.empty-hint {
  padding: 40px;
  font-size: 14px;
  color: #999;
  text-align: center;
}

.confirm-info-grid {
  padding: 16px;
  margin-bottom: 24px;
  background: #fafafa;
  border-radius: 8px;
}

.info-row {
  display: flex;
  padding: 8px 0;
}

.info-row .label {
  width: 80px;
  color: #666;
}

.info-row .value {
  flex: 1;
  font-weight: 500;
}

.form-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item:last-child {
  grid-column: 1 / -1;
}

.form-label {
  font-weight: 500;
  color: #333;
}

.form-label.required::after {
  color: #ff4d4f;
  content: ' *';
}

.wizard-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid #f0f0f0;
}
</style>
