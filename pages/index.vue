<script setup lang="ts">
import { request } from '#shared/utils/request';
import type { LoginAccount, ScanLoginResult, StartLoginResult } from '~/types/types';

const qrcodeSrc = ref('');
const loading = ref(false);
const msg = ref('');
const authKey = ref('');
const timer = ref<number | null>(null);
const sessions = ref<{ authKey: string; nickname: string }[]>([]);
const showLogin = ref(false);
onMounted(async () => {
  loading.value = true;
  try {
    const resp = await request<{ sessions: { authKey: string; nickname: string }[] }>('/api/public/v1/sessions');
    sessions.value = resp.sessions ?? [];
    if (sessions.value.length === 0) {
      showLogin.value = true;
      await getQrcode();
    }
  } finally {
    loading.value = false;
  }
});
onUnmounted(() => { if (timer.value) clearTimeout(timer.value); });

async function getQrcode() {
  try {
    loading.value = true;
    msg.value = '获取登录二维码...';
    authKey.value = '';
    const sid = Date.now().toString() + Math.floor(Math.random() * 100);
    const resp = await request<StartLoginResult>(`/api/web/login/session/${sid}`, { method: 'POST' });
    if (!resp?.base_resp || resp.base_resp.ret !== 0) throw new Error(resp?.base_resp?.err_msg || '获取登录会话失败');
    qrcodeSrc.value = `/api/web/login/getqrcode?rnd=${Math.random()}`;
    msg.value = '请使用微信扫描二维码';
    scheduleCheck();
  } catch (e: any) {
    msg.value = e.message;
  } finally {
    loading.value = false;
  }
}

function scheduleCheck() {
  if (timer.value) clearTimeout(timer.value);
  timer.value = window.setTimeout(checkStatus, 2000);
}

async function checkStatus() {
  const resp = await request<ScanLoginResult>('/api/web/login/scan');
  if (!resp?.base_resp || resp.base_resp.ret !== 0) return scheduleCheck();
  switch (resp.status) {
    case 0: return scheduleCheck();
    case 1:
      msg.value = '已确认，正在登录...';
      return bizLogin();
    case 4:
    case 6:
      if (resp.acct_size >= 1) { msg.value = '扫码成功，请在手机上确认'; qrcodeSrc.value = ''; }
      else msg.value = '没有可登录账号';
      return scheduleCheck();
    case 5:
      msg.value = '该账号尚未绑定邮箱';
      return scheduleCheck();
    default:
      qrcodeSrc.value = `/api/web/login/getqrcode?rnd=${Math.random()}`;
      return scheduleCheck();
  }
}

async function bizLogin() {
  try {
    loading.value = true;
    const resp = await request<LoginAccount>('/api/web/login/bizlogin', { method: 'POST' });
    if (resp.err) throw new Error(resp.err);
    authKey.value = useCookie('auth-key').value || '';
    msg.value = `登录成功：${resp.nickname}`;
    qrcodeSrc.value = '';
    if (timer.value) clearTimeout(timer.value);
    showLogin.value = false;
    sessions.value = [{ authKey: authKey.value, nickname: resp.nickname }, ...sessions.value];
  } catch (e: any) {
    msg.value = e.message;
  } finally {
    loading.value = false;
  }
}

function startNewLogin() {
  showLogin.value = true;
  authKey.value = '';
  msg.value = '';
  getQrcode();
}


</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
    <h1 class="text-2xl font-bold">微信公众号登录</h1>

    <UIcon v-if="loading && sessions.length === 0" name="i-lucide:loader" :size="28" class="animate-spin text-slate-500" />

    <!-- 已有 session 列表 -->
    <template v-if="!showLogin && sessions.length > 0">
      <div class="w-full max-w-sm flex flex-col gap-3">
        <p class="text-slate-600 text-sm">已登录的公众号：</p>
        <div v-for="s in sessions" :key="s.authKey" class="px-3 py-2 rounded border border-slate-200 bg-slate-50">
          <div class="text-sm font-medium text-slate-700">{{ s.nickname || s.authKey }}</div>
        </div>
        <UButton variant="outline" class="mt-2" @click="startNewLogin">新增登录</UButton>
      </div>
    </template>

    <!-- 扫码登录 -->
    <template v-if="showLogin">
      <div class="flex flex-col items-center gap-3 w-80">
        <UIcon v-if="loading" name="i-lucide:loader" :size="28" class="animate-spin text-slate-500" />
        <p v-if="msg" :class="authKey ? 'text-green-600' : 'text-slate-600'">{{ msg }}</p>
        <img v-if="qrcodeSrc" :src="qrcodeSrc" alt="登录二维码" class="w-64 rounded-md border" />

        <template v-if="authKey">
          <UButton variant="outline" @click="getQrcode">重新登录</UButton>
        </template>

        <UButton v-else-if="!loading && msg && !qrcodeSrc" variant="outline" @click="getQrcode">
          重新获取二维码
        </UButton>

        <UButton v-if="sessions.length > 0" variant="ghost" size="sm" @click="showLogin = false">
          返回
        </UButton>
      </div>
    </template>
  </div>
</template>
