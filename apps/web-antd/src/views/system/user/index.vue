<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  SysAddUserParams,
  SysDeptTreeResult,
  SysResetPasswordParams,
  SysRoleResult,
  SysUpdateUserParams,
  SysUserResult,
} from '#/api';

import { computed, onMounted, ref } from 'vue';

import { ColPage, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createSysUserApi,
  deleteSysUserApi,
  getAssignableRolesApi,
  getDeptAdminStatusApi,
  getSysDeptTreeApi,
  getSysUserListApi,
  resetSysUserPasswordApi,
  updateSysUserApi,
} from '#/api';
import {
  querySchema,
  resetPwdSchema,
  useAddSchema,
  useColumns,
  useEditSchema,
} from '#/views/system/user/data';

/**
 * 部门管理员状态
 */
interface DeptAdminState {
  isDeptAdmin: boolean;
  deptId?: string; // Snowflake ID
  maxRoleLevel?: number;
}

/**
 * 部门管理员状态（从API获取）
 */
const deptAdminState = ref<DeptAdminState>({
  isDeptAdmin: false,
});

/**
 * 是否显示添加用户按钮
 * - 超级管理员：始终显示
 * - 部门管理员：显示
 * - 普通用户：隐藏
 */
const showAddUserBtn = computed(() => {
  // TODO: 可根据 userStore.userRoles 判断是否为超级管理员
  // 目前先返回 true，后续可结合后端返回的状态判断
  return true;
});

/**
 * 是否为部门管理员
 */
const isDeptAdmin = computed(() => deptAdminState.value.isDeptAdmin);

/**
 * 部门管理员所属部门ID
 */
const deptAdminDeptId = computed(() => deptAdminState.value.deptId);

/**
 * 左侧
 */
const treeData = ref<SysDeptTreeResult[]>([]);

const fetchDeptTree = async (name: string | undefined) => {
  try {
    treeData.value = await getSysDeptTreeApi({ name });
  } catch (error) {
    console.error(error);
  }
};

const searchDeptValue = ref<string>();
const searchDept = async (searchValue: string | undefined) => {
  await fetchDeptTree(searchValue);
};

/**
 * 右侧
 */
const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<SysUserResult> = {
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
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
        return await getSysUserListApi({
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

function onActionClick({ code, row }: OnActionClickParams<SysUserResult>) {
  switch (code) {
    case 'delete': {
      deleteSysUserApi(row.id).then(() => {
        message.success({
          content: $t('ui.actionMessage.deleteSuccess', [row.username]),
          key: 'action_process_msg',
        });
        onRefresh();
      });
      break;
    }
    case 'edit': {
      editUser.value = row.id;
      editModalApi.setData(row).open();
      break;
    }
    case 'more': {
      editUser.value = row.id;
      resetPwdModalApi.setData(null).open();
      break;
    }
  }
}

const fetchSysUserListByDept = (selectedKeys: string[]) => {
  try {
    gridApi.query({ dept: selectedKeys[0] });
  } catch (error) {
    console.error(error);
  }
};

const roleSelectOptions = ref<SysRoleResult[]>([]);

/**
 * 获取可分配角色列表
 * 部门管理员只能分配权限等级不高于自己的角色
 */
const fetchAssignableRoles = async () => {
  try {
    roleSelectOptions.value = await getAssignableRolesApi();
  } catch (error) {
    console.error(error);
  }
};

/**
 * 获取部门管理员状态
 */
const fetchDeptAdminStatus = async () => {
  try {
    const result = await getDeptAdminStatusApi();
    deptAdminState.value = {
      isDeptAdmin: result.is_dept_admin,
      deptId: result.dept_id,
      maxRoleLevel: result.max_role_level,
    };
  } catch (error) {
    console.error(error);
  }
};

const [EditForm, formApi] = useVbenForm({
  showDefaultActions: false,
  schema: useEditSchema(roleSelectOptions, isDeptAdmin, treeData),
});
const editUser = ref<string>('');

const [editModal, editModalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      editModalApi.lock();
      const data = await formApi.getValues<SysUpdateUserParams>();
      try {
        await updateSysUserApi(editUser.value, data);
        await editModalApi.close();
        onRefresh();
      } finally {
        editModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = editModalApi.getData<any>();
      formApi.resetForm();
      if (data) {
        formApi.setValues({
          ...data,
          roles: data.roles?.map((item: SysRoleResult) => item.id) || [],
        });
      }
      // 部门管理员时确保部门ID正确设置
      if (isDeptAdmin.value && deptAdminDeptId.value) {
        formApi.setValues({ dept_id: deptAdminDeptId.value });
      }
    }
  },
});

const [AddForm, addFormApi] = useVbenForm({
  showDefaultActions: false,
  schema: useAddSchema(roleSelectOptions, isDeptAdmin, treeData),
});
const [addModal, addModalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await addFormApi.validate();
    if (valid) {
      addModalApi.lock();
      const data = await addFormApi.getValues<SysAddUserParams>();
      try {
        await createSysUserApi(data);
        await addModalApi.close();
        onRefresh();
      } finally {
        addModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = addModalApi.getData();
      addFormApi.resetForm();
      // 部门管理员时预设部门ID
      if (isDeptAdmin.value && deptAdminDeptId.value) {
        addFormApi.setValues({ dept_id: deptAdminDeptId.value });
      }
      if (data) {
        addFormApi.setValues(data);
      }
    }
  },
});

const [ResetPwdForm, resetPwdFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: resetPwdSchema,
});

const [resetPwdModal, resetPwdModalApi] = useVbenModal({
  destroyOnClose: true,
  centered: true,
  async onConfirm() {
    const { valid } = await resetPwdFormApi.validate();
    if (valid) {
      resetPwdModalApi.lock();
      const data = await resetPwdFormApi.getValues<SysResetPasswordParams>();
      try {
        await resetSysUserPasswordApi(editUser.value, data);
        message.success($t('ui.actionMessage.operationSuccess'));
        await resetPwdModalApi.close();
      } finally {
        resetPwdModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = resetPwdModalApi.getData();
      resetPwdFormApi.resetForm();
      if (data) {
        resetPwdFormApi.setValues(data);
      }
    }
  },
});

onMounted(() => {
  fetchDeptTree(undefined);
  fetchAssignableRoles();
  fetchDeptAdminStatus();
});
</script>

<template>
  <ColPage
    auto-content-height
    :resizable="false"
    :left-width="20"
    :right-width="80"
  >
    <template #left>
      <div class="bg-card mr-2 h-full overflow-y-auto rounded-[var(--radius)]">
        <div class="mt-1 p-2">
          <a-input-search
            v-model:value="searchDeptValue"
            :placeholder="$t('common.search')"
            size="small"
            enter-button
            @search="searchDept"
          />
        </div>
        <div class="-mt-3 p-3">
          <div class="mb-1">Xxx集团</div>
          <a-tree
            v-if="treeData.length > 0"
            :show-line="{ showLeafIcon: false }"
            :tree-data="treeData"
            :field-names="{ title: 'name', key: 'id' }"
            default-expand-all
            @select="fetchSysUserListByDept"
          >
            <template #title="{ name }">
              <span v-if="name.includes(searchDeptValue)">
                {{ name.substring(0, name.indexOf(searchDeptValue)) }}
                <span style="color: #f50">{{ searchDeptValue }}</span>
                {{
                  name.substring(
                    name.indexOf(searchDeptValue) + searchDeptValue?.length,
                  )
                }}
              </span>
              <span v-else>{{ name }}</span>
            </template>
          </a-tree>
        </div>
      </div>
    </template>
    <Grid>
      <template #toolbar-actions>
        <VbenButton
          v-if="showAddUserBtn"
          @click="() => addModalApi.setData(null).open()"
        >
          <MaterialSymbolsAdd class="size-5" />
          添加用户
        </VbenButton>
      </template>
      <template #avatar="{ row }">
        <a-avatar :src="row.avatar || preferences.app.defaultAvatar" />
      </template>
      <template #dept="{ row }">
        <span v-if="row.dept">
          <a-tag :key="row.dept.name" color="green">
            {{ row.dept.name }}
          </a-tag>
        </span>
        <span v-else>未绑定</span>
      </template>
      <template #roles="{ row }">
        <span v-if="row.roles.length === 1">
          <a-tag color="purple">
            {{ row.roles[0]?.name }}
          </a-tag>
        </span>
        <span v-else-if="row.roles.length > 1">
          <a-popover placement="topLeft" :overlay-style="{ maxWidth: '20%' }">
            <template #content>
              <a-tag v-for="role in row.roles" :key="role.name" color="purple">
                {{ role.name }}
              </a-tag>
            </template>
            <a-tag v-for="role in row.roles" :key="role.name" color="purple">
              {{ role.name }}
            </a-tag>
          </a-popover>
        </span>
        <span v-else>未绑定</span>
      </template>
    </Grid>
    <editModal title="修改用户">
      <EditForm />
    </editModal>
    <addModal title="添加用户">
      <AddForm />
    </addModal>
    <resetPwdModal title="重置密码">
      <ResetPwdForm />
    </resetPwdModal>
  </ColPage>
</template>
