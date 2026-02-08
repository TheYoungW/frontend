<template>
  <div class="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans antialiased selection:bg-blue-100">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-black/[0.05] px-8 h-14 flex items-center justify-between">
      <div class="flex items-center space-x-6">
        <h1 class="text-lg font-semibold tracking-tight">Robot Panel</h1>
        <nav class="flex items-center space-x-1">
          <router-link to="/teaching" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-black/5">示教臂</router-link>
          <router-link to="/operating" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-black/5 text-[#86868B]">操作臂</router-link>
        </nav>
      </div>
      <div class="flex items-center space-x-3">
        <!-- 声网状态指示 -->
        <div v-if="agora.connected" class="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
          <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span class="text-xs font-medium text-blue-700">RTC DataStream Active</span>
        </div>
        <!-- 硬件连接状态 -->
        <div v-if="isConnected" class="flex items-center space-x-2 px-3 py-1 rounded-full bg-green-50 border border-green-100">
          <span class="w-2 h-2 bg-green-500 rounded-full"></span>
          <span class="text-xs font-medium text-green-700">硬件已连接</span>
        </div>
      </div>
    </header>

    <main class="max-w-[1400px] mx-auto p-8 lg:p-12">
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        <!-- 左侧配置区域 -->
        <aside class="w-full lg:w-80 flex-shrink-0 space-y-8">
          <section class="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/[0.03]">
            <h2 class="text-sm font-semibold text-[#86868B] uppercase tracking-widest mb-6">Device Configuration</h2>
            
            <div class="space-y-6">
              <!-- 模式选择 -->
              <div>
                <label class="block text-xs font-semibold mb-2 ml-1 text-[#424245]">控制模式</label>
                <div class="flex bg-[#F5F5F7] p-1 rounded-xl border border-black/[0.03]">
                  <button 
                    @click="config.mode = 'single'"
                    :class="config.mode === 'single' ? 'bg-white shadow-sm text-[#0071E3]' : 'text-[#86868B] hover:text-[#1D1D1F]'"
                    class="flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200"
                  >
                    单臂
                  </button>
                  <button 
                    @click="config.mode = 'dual'"
                    :class="config.mode === 'dual' ? 'bg-white shadow-sm text-[#0071E3]' : 'text-[#86868B] hover:text-[#1D1D1F]'"
                    class="flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200"
                  >
                    双臂
                  </button>
                </div>
              </div>

              <!-- 串口选择 -->
              <div class="space-y-4">
                <div v-for="index in (config.mode === 'dual' ? 2 : 1)" :key="index">
                  <label class="block text-xs font-semibold mb-2 ml-1 text-[#424245]">
                    {{ config.mode === 'dual' ? (index === 1 ? '左臂' : '右臂') : '串口设备' }}
                  </label>
                  <div class="relative">
                    <select 
                      v-model="config.devices[index-1]"
                      class="appearance-none block w-full bg-[#F5F5F7] border border-transparent rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-[#0071E3] transition-all outline-none"
                    >
                      <option value="">请选择串口</option>
                      <option v-for="dev in availableDevices" :key="dev.device_id" :value="dev.device_id">{{ dev.device_id.split('/').pop() }}</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- 远程同步设置 (Mac 风格 Toggle) -->
              <div class="pt-2 border-t border-black/[0.03]">
                <div class="flex items-center justify-between px-1">
                  <div>
                    <span class="text-xs font-semibold text-[#424245]">开启远程同步</span>
                    <p class="text-[10px] text-[#86868B]">通过声网转发数据</p>
                  </div>
                  <button 
                    @click="toggleAgora"
                    :class="agora.connected ? 'bg-[#34C759]' : 'bg-gray-300'"
                    class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                  >
                    <span :class="agora.connected ? 'translate-x-5' : 'translate-x-0'" class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200"></span>
                  </button>
                </div>
                <div v-if="agora.connected" class="mt-3">
                  <label class="block text-[10px] font-bold text-[#86868B] uppercase mb-1">频道 ID</label>
                  <input v-model="agora.channel" class="w-full bg-[#F5F5F7] rounded-lg px-3 py-2 text-xs font-mono outline-none focus:bg-white border border-transparent focus:border-blue-300" placeholder="Enter channel name" />
                </div>
                <!-- 临时 Token 输入 (可选) -->
                <div v-if="!agora.connected" class="mt-2">
                  <label class="block text-[10px] font-bold text-[#86868B] uppercase mb-1 text-orange-600">频道 Token (可选)</label>
                  <input v-model="agora.token" class="w-full bg-[#F5F5F7] rounded-lg px-3 py-2 text-xs font-mono outline-none focus:bg-white border border-transparent focus:border-orange-300" placeholder="无需 Token 请留空" />
                  <p class="text-[9px] text-gray-400 mt-1">若声网报错 4096，请在此填入临时 Token 或在声网后台关闭证书校验</p>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="pt-4 space-y-3">
                <button 
                  @click="toggleConnect"
                  :disabled="isConnecting || !isFormValid"
                  :class="[
                    isConnected ? 'bg-[#FF3B30]' : 'bg-[#0071E3]',
                    'w-full py-3.5 px-4 rounded-2xl font-semibold text-white text-sm transition-all shadow-lg disabled:opacity-30'
                  ]"
                >
                  {{ isConnecting ? 'Connecting...' : (isConnected ? 'Disconnect' : 'Connect Device') }}
                </button>
                
                <button @click="refreshDevices" class="w-full py-3 px-4 rounded-2xl font-semibold text-sm text-[#0071E3] hover:bg-blue-50 transition-all">
                  Refresh Ports
                </button>
              </div>
            </div>
          </section>
        </aside>

        <!-- 右侧内容区域 (保持原有的示教臂显示逻辑) -->
        <div class="flex-1 min-w-0">
          <div v-if="!isConnected" class="h-full flex flex-col items-center justify-center min-h-[500px] bg-white rounded-[3rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-black/[0.03]">
            <div class="w-20 h-20 bg-[#F5F5F7] rounded-3xl flex items-center justify-center mb-6 text-[#86868B]">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
            </div>
            <p class="text-xl font-semibold tracking-tight">示教臂已准备就绪</p>
            <p class="text-[#86868B] mt-2">连接硬件后，采集的数据可实时通过声网传输至操作臂。</p>
          </div>

          <div v-else class="grid grid-cols-1 gap-8">
            <!-- 远程视频流显示 (多路宫格) -->
            <div v-if="agora.connected" class="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-black/[0.03]">
              <div class="px-8 py-6 border-b border-black/[0.03] flex flex-col gap-4 bg-[#FAFAFC] lg:flex-row lg:items-center lg:justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-[#0071E3] rounded-xl shadow-sm flex items-center justify-center text-white text-lg font-bold">📹</div>
                  <div>
                    <h3 class="font-bold text-lg leading-tight">远程监控视图</h3>
                    <p class="text-xs text-[#86868B] font-mono mt-0.5">多视角实时同步</p>
                  </div>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                  <div class="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-600 text-[10px] font-bold">
                    {{ Object.keys(remoteVideoTracks).length }}路视频已连接
                  </div>
                  <div class="flex items-center gap-2 text-[10px] text-[#86868B] font-bold uppercase tracking-widest">
                    Zoom
                    <input
                      v-model.number="videoZoom"
                      type="range"
                      min="1"
                      max="2.5"
                      step="0.1"
                      class="h-1.5 w-28 accent-blue-500"
                    />
                    <span class="min-w-[32px] text-right">{{ videoZoom.toFixed(1) }}x</span>
                    <button
                      class="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#0071E3] shadow-sm border border-blue-100"
                      @click="resetVideoZoom"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
              <div class="p-6 relative">
                <!-- 宫格布局 -->
                <div
                  ref="videoGridEl"
                  :class="[
                  'grid gap-6',
                  videoCount <= 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
                ]"
                >
                  <div
                    v-for="(_track, uid) in remoteVideoTracks"
                    :key="uid"
                    :class="[
                      'relative bg-black rounded-2xl overflow-hidden shadow-inner group',
                      videoCount <= 1 ? 'aspect-video min-h-[600px]' : 'aspect-video min-h-[460px] xl:min-h-[520px]'
                    ]"
                  >
                    <video
                      :ref="el => setRemoteVideoRef(uid.toString(), el)"
                      autoplay
                      playsinline
                      class="w-full h-full object-contain bg-black transition-transform duration-200"
                      :style="{ transform: `scale(${videoZoom})` }"
                    ></video>
                    <div class="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-[9px] font-bold rounded shadow-sm">UID: {{ uid }}</div>
                    <button
                      class="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white shadow-sm transition hover:bg-black/80"
                      @click="requestVideoFullscreen(uid.toString())"
                    >
                      Fullscreen
                    </button>
                  </div>
                  <!-- 等待占位 -->
                  <div v-if="Object.keys(remoteVideoTracks).length === 0" class="aspect-video bg-[#F5F5F7] rounded-2xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                    <div class="w-12 h-12 border-4 border-white/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p class="text-sm font-medium">等待操作端发布视频流...</p>
                  </div>
                </div>
                <button
                  class="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-2 text-[11px] font-bold text-white shadow-lg transition hover:bg-black/90"
                  @click="requestGridFullscreen"
                >
                  Fullscreen All
                </button>
              </div>
            </div>

            <template v-for="(state, idx) in displayStates" :key="idx">
              <div v-if="state" class="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-black/[0.03]">
                <div class="px-8 py-6 border-b border-black/[0.03] flex items-center justify-between bg-[#FAFAFC]">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-white rounded-xl shadow-sm border border-black/[0.05] flex items-center justify-center text-lg font-bold">
                      {{ idx === 0 ? 'L' : 'R' }}
                    </div>
                    <div>
                      <h3 class="font-bold text-lg leading-tight">{{ config.mode === 'dual' ? (idx === 0 ? '左臂数据' : '右臂数据') : '实时示教数据' }}</h3>
                      <p class="text-xs text-[#86868B] font-mono mt-0.5">{{ config.devices[idx] }}</p>
                    </div>
                  </div>
                </div>

                <div class="p-8 lg:p-10">
                  <div class="grid grid-cols-1 xl:grid-cols-2 gap-12">
                    <div class="space-y-6">
                      <h4 class="text-xs font-bold text-[#86868B] uppercase tracking-[0.15em]">关节角度 (Deg)</h4>
                      <div class="grid grid-cols-3 gap-4">
                        <div v-for="(deg, j) in state.joints_deg" :key="j" class="bg-[#F5F5F7] p-5 rounded-3xl group">
                          <div class="text-[10px] text-[#86868B] font-bold uppercase mb-1">J{{ j + 1 }}</div>
                          <div class="text-2xl font-mono font-semibold tracking-tighter">{{ deg.toFixed(2) }}°</div>
                        </div>
                      </div>
                    </div>
                    <div class="space-y-8">
                      <div class="bg-[#0071E3] rounded-[2rem] p-8 text-white shadow-lg shadow-blue-500/20">
                        <h4 class="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Gripper Position</h4>
                        <p class="text-4xl font-mono font-bold tracking-tighter">{{ state.gripper.toFixed(0) }}</p>
                      </div>
                      <div class="grid grid-cols-2 gap-6">
                        <div :class="state.button1 ? 'bg-green-50 text-green-700' : 'bg-[#F5F5F7] text-[#86868B]'" class="p-6 rounded-[2rem] flex flex-col items-center justify-center space-y-2">
                          <span class="text-xs font-bold uppercase tracking-widest">Button 1</span>
                          <span class="text-lg font-bold">{{ state.button1 ? 'ON' : 'OFF' }}</span>
                        </div>
                        <div :class="state.button2 ? 'bg-orange-50 text-orange-700' : 'bg-[#F5F5F7] text-[#86868B]'" class="p-6 rounded-[2rem] flex flex-col items-center justify-center space-y-2">
                          <span class="text-xs font-bold uppercase tracking-widest">Button 2</span>
                          <span class="text-lg font-bold">{{ state.button2 ? 'ON' : 'OFF' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
import axios from 'axios';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type { IAgoraRTCClient, IRemoteVideoTrack } from 'agora-rtc-sdk-ng';

const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
const wsBaseUrl = import.meta.env.VITE_BACKEND_WS_URL || backendBaseUrl.replace(/^http/, 'ws');

// --- 类型定义 ---
interface RobotState {
  joints_deg: number[];
  gripper: number;
  button1: boolean;
  button2: boolean;
  ts: number;
}

// --- 状态 ---
const config = reactive({
  mode: 'single' as 'single' | 'dual',
  devices: ['', ''] as string[]
});

const agora = reactive({
  connected: false,
  channel: 'synria-teleop1',
  token: '', // 新增 token 字段
  appId: '9a96087f25ad4929ad917710aa6c83fc',
  client: null as IAgoraRTCClient | null,
  dataStreamId: null as any | null
});

const availableDevices = ref<Array<{device_id: string, driver_type: string}>>([]);
const isConnecting = ref(false);
const isConnected = ref(false);
const messageCount = ref(0);

const latestStates = reactive<(RobotState | null)[]>([null, null]);
const displayStates = reactive<(RobotState | null)[]>([null, null]);

const websockets = ref<(WebSocket | null)[]>([null, null]);
const pollingIntervals = ref<any[]>([]);
const uiUpdateInterval = ref<any>(null);
const agoraSyncInterval = ref<any>(null); // 新增：声网同步主计时器
// 支持多路视频
const remoteVideoTracks = ref<Record<string, IRemoteVideoTrack>>({});
const remoteVideoEls: Record<string, HTMLVideoElement | null> = {};
const videoZoom = ref(1);
const videoCount = computed(() => Object.keys(remoteVideoTracks.value).length);
const videoGridEl = ref<HTMLDivElement | null>(null);

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const setRemoteVideoRef = (uid: string, el: any) => {
  if (el) {
    remoteVideoEls[uid] = el as HTMLVideoElement;
  }
};

const resetVideoZoom = () => {
  videoZoom.value = 1;
};

const requestVideoFullscreen = (uid: string) => {
  const el = remoteVideoEls[uid];
  if (!el) return;
  const anyEl = el as any;
  if (el.requestFullscreen) el.requestFullscreen();
  else if (anyEl.webkitEnterFullscreen) anyEl.webkitEnterFullscreen();
};

const requestGridFullscreen = () => {
  const el = videoGridEl.value;
  if (!el) return;
  const anyEl = el as any;
  if (el.requestFullscreen) el.requestFullscreen();
  else if (anyEl.webkitRequestFullscreen) anyEl.webkitRequestFullscreen();
};

const isFormValid = computed(() => {
  if (config.mode === 'single') return config.devices[0] !== '';
  return config.devices[0] !== '' && config.devices[1] !== '' && config.devices[0] !== config.devices[1];
});

// 核心：每 20ms 将两只手的数据打包一次性发出
const startAgoraSync = () => {
  stopAgoraSync();
  agoraSyncInterval.value = setInterval(() => {
    if (!agora.connected || !agora.client) return;

    try {
      const activeArms = [];
      const numArms = config.mode === 'dual' ? 2 : 1;
      
      for (let i = 0; i < numArms; i++) {
        if (latestStates[i]) {
          activeArms.push({
            index: i,
            joints_deg: latestStates[i]!.joints_deg,
            gripper: latestStates[i]!.gripper,
            buttons: [latestStates[i]!.button1, latestStates[i]!.button2]
          });
        }
      }

      if (activeArms.length === 0) return;

      const payload = JSON.stringify({
        t: 'sync', // robot_teleop_sync
        ts: Date.now() / 1000,
        m: config.mode === 'dual' ? 'd' : 's',
        arms: activeArms.map(a => ({
          i: a.index,
          j: a.joints_deg,
          g: a.gripper,
          b: a.buttons
        }))
      });

      const client = agora.client as any;
      const sendFn = client.sendStreamMessage || client.sendCustomReportMessage;
      if (typeof sendFn === 'function') {
        const encoded = new TextEncoder().encode(payload);
        if (agora.dataStreamId !== null) {
          sendFn.call(client, agora.dataStreamId, encoded);
        } else {
          sendFn.call(client, encoded);
        }
      }
    } catch (e) {
      // 静默处理发送错误
    }
  }, 20); // 50Hz 强制同步
};

const stopAgoraSync = () => {
  if (agoraSyncInterval.value) {
    clearInterval(agoraSyncInterval.value);
    agoraSyncInterval.value = null;
  }
};

// --- 声网方法 ---
const toggleAgora = async () => {
  if (agora.connected) {
    stopAgoraSync();
    // 停止所有远程视频
    Object.values(remoteVideoTracks.value).forEach(track => track.stop());
    remoteVideoTracks.value = {};
    await agora.client?.leave();
    agora.connected = false;
    agora.dataStreamId = null;
    return;
  }

  try {
    agora.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    
    // 监听远程用户发布视频流
    agora.client.on("user-published", async (user, mediaType) => {
      if (mediaType === "video") {
        setTimeout(async () => {
          if (!agora.connected || !agora.client) return;
          try {
            const remoteUser = agora.client.remoteUsers.find(u => u.uid === user.uid) as any;
            if (!remoteUser || !remoteUser.hasVideo) return;
            
            await agora.client.subscribe(remoteUser as any, "video");
            const videoTrack = remoteUser.videoTrack as IRemoteVideoTrack;
            if (videoTrack) {
              // 使用浅拷贝更新，避免触发 Vue 内部的复杂深度观测导致的递归
              remoteVideoTracks.value = {
                ...remoteVideoTracks.value,
                [user.uid.toString()]: videoTrack
              };
              await nextTick();
              const el = remoteVideoEls[user.uid.toString()];
              if (el) videoTrack.play(el);
            }
          } catch (err) {}
        }, 1000);
      }
    });
    
    // 监听用户取消发布
    agora.client.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "video") {
        const uidStr = user.uid.toString();
        const newTracks = { ...remoteVideoTracks.value };
        if (newTracks[uidStr]) {
          newTracks[uidStr].stop();
          delete newTracks[uidStr];
          remoteVideoTracks.value = newTracks;
        }
        delete remoteVideoEls[uidStr];
      }
    });

    // 监听用户离开（防止断线重连导致列表不断增长）
    agora.client.on("user-left", (user) => {
      const uidStr = user.uid.toString();
      const newTracks = { ...remoteVideoTracks.value };
      if (newTracks[uidStr]) {
        newTracks[uidStr].stop();
        delete newTracks[uidStr];
        remoteVideoTracks.value = newTracks;
      }
      delete remoteVideoEls[uidStr];
    });
    
    await agora.client.join(agora.appId, agora.channel, agora.token || null, null);
    
    // 检查现有用户
    for (const user of agora.client.remoteUsers) {
      if (user.hasVideo) {
        await agora.client.subscribe(user as any, "video");
        const videoTrack = user.videoTrack as IRemoteVideoTrack;
        if (videoTrack) {
          remoteVideoTracks.value = {
            ...remoteVideoTracks.value,
            [user.uid.toString()]: videoTrack
          };
          await nextTick();
          const el = remoteVideoEls[user.uid.toString()];
          if (el) videoTrack.play(el);
        }
      }
    }
    
    const client = agora.client as any;
    const createFn = client.createDataStream || client.createDataStreamWithConfig || client._p2pClient?.createDataStream;
    
    if (typeof createFn === 'function') {
      agora.dataStreamId = createFn.call(client, { reliable: false, ordered: false });
      if (typeof agora.dataStreamId !== 'number') agora.dataStreamId = createFn.call(client, false, false);
    }
    
    agora.connected = true;
    
    // 开启打包同步
    startAgoraSync();
  } catch (e: any) {
    alert(`声网启动失败: ${e.message}`);
  }
};

// --- 常规方法 ---
const refreshDevices = async () => {
  try {
    const res = await axios.get(`${backendBaseUrl}/robots/infos`);
    availableDevices.value = res.data.devices.devices || [];
    const deviceIds = availableDevices.value.map((d: any) => d.device_id);
    if (config.devices[0] && !deviceIds.includes(config.devices[0])) config.devices[0] = '';
    if (config.devices[1] && !deviceIds.includes(config.devices[1])) config.devices[1] = '';
  } catch (e) { /* 静默处理 */ }
};

const toggleConnect = async () => {
  if (isConnected.value) { disconnectAll(); return; }
  isConnecting.value = true;
  try {
    const numArms = config.mode === 'dual' ? 2 : 1;
    for (let i = 0; i < numArms; i++) {
      const deviceId = config.devices[i];
      const deviceInfo = availableDevices.value.find(d => d.device_id === deviceId);
      if (!deviceInfo) throw new Error("Device not found");
      
      await axios.post(`${backendBaseUrl}/robots/connect`, { arm_type: deviceInfo.driver_type, device_id: deviceId });

      const wsUrl = `${wsBaseUrl}/robots/ws/${deviceId}`;
      const ws = new WebSocket(wsUrl);
      websockets.value[i] = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'state') {
          const joints = Array.isArray(data.joints_deg) ? data.joints_deg : [];
          const state = {
            joints_deg: joints.map((deg: unknown) => toNumber(deg)),
            gripper: toNumber(data.gripper),
            button1: Boolean(data.button1),
            button2: Boolean(data.button2),
            ts: toNumber(data.ts)
          };
          latestStates[i] = state;
          messageCount.value++;
        }
      };

      ws.onopen = () => {
        const interval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'get.state' }));
        }, 20); // 50Hz
        pollingIntervals.value[i] = interval;
      };
    }
    isConnected.value = true;
    uiUpdateInterval.value = setInterval(() => {
      for (let i = 0; i < 2; i++) { if (latestStates[i]) displayStates[i] = { ...latestStates[i]! }; }
    }, 100); // 10Hz
  } catch (e: any) {
    alert('连接失败');
    disconnectAll();
  } finally { isConnecting.value = false; }
};

const disconnectAll = () => {
  websockets.value.forEach(ws => ws?.close());
  websockets.value = [null, null];
  pollingIntervals.value.forEach(interval => clearInterval(interval));
  pollingIntervals.value = [];
  if (uiUpdateInterval.value) { clearInterval(uiUpdateInterval.value); uiUpdateInterval.value = null; }
  isConnected.value = false;
  messageCount.value = 0;
  latestStates[0] = null; latestStates[1] = null;
  displayStates[0] = null; displayStates[1] = null;
};

onMounted(() => { refreshDevices(); });
onUnmounted(() => { 
  disconnectAll(); 
  Object.values(remoteVideoTracks.value).forEach(track => track.stop());
  agora.client?.leave(); 
});
</script>
<style scoped>
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
</style>

