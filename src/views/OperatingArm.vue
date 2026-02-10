<template>
  <div class="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans antialiased selection:bg-blue-100">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-black/[0.05] px-8 h-14 flex items-center justify-between">
      <div class="flex items-center space-x-6">
        <h1 class="text-lg font-semibold tracking-tight">Robot Panel</h1>
        <nav class="flex items-center space-x-1">
          <router-link to="/teaching" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-black/5 text-[#86868B]">示教臂</router-link>
          <router-link to="/operating" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-black/5">操作臂</router-link>
        </nav>
      </div>
      <div class="flex items-center space-x-3">
        <div v-if="agora.connected && syncLatencyMs > 0" class="hidden lg:flex items-center px-3 py-1 rounded-full bg-white/70 border border-black/[0.08] text-[10px] font-mono text-[#424245]">
          Sync {{ syncLatencyMs }}ms
        </div>
        <div v-if="agora.connected" class="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
          <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span class="text-xs font-medium text-blue-700">Remote Sync Active</span>
        </div>
        <div v-if="isConnected" class="flex items-center space-x-2 px-3 py-1 rounded-full bg-green-50 border border-green-100">
          <span class="w-2 h-2 bg-green-500 rounded-full"></span>
          <span class="text-xs font-medium text-green-700">操作臂就绪</span>
        </div>
      </div>
    </header>

    <main class="max-w-[1400px] mx-auto p-8 lg:p-12">
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        <!-- 左侧配置区域 -->
        <aside class="w-full lg:w-80 flex-shrink-0 space-y-8">
          <section class="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/[0.03]">
            <h2 class="text-sm font-semibold text-[#86868B] uppercase tracking-widest mb-6">Operating Config</h2>
            
            <div class="space-y-6">
              <!-- 模式选择 -->
              <div>
                <label class="block text-xs font-semibold mb-2 ml-1 text-[#424245]">操作模式</label>
                <div class="flex bg-[#F5F5F7] p-1 rounded-xl border border-black/[0.03]">
                  <button 
                    @click="config.mode = 'single'"
                    :class="config.mode === 'single' ? 'bg-white shadow-sm text-[#0071E3]' : 'text-[#86868B]'"
                    class="flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200"
                  >
                    单臂
                  </button>
                  <button 
                    @click="config.mode = 'dual'"
                    :class="config.mode === 'dual' ? 'bg-white shadow-sm text-[#0071E3]' : 'text-[#86868B]'"
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
                    {{ config.mode === 'dual' ? (index === 1 ? '左操作臂' : '右操作臂') : '本地串口设备' }}
                  </label>
                  <div class="relative">
                    <select 
                      v-model="config.devices[index-1]"
                      class="appearance-none block w-full bg-[#F5F5F7] border border-transparent rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-[#0071E3] outline-none transition-all"
                    >
                      <option value="">请选择串口</option>
                      <option v-for="dev in availableDevices" :key="dev.device_id" :value="dev.device_id">{{ dev.device_id.split('/').pop() }}</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- 远程接收设置 -->
              <div class="pt-2 border-t border-black/[0.03]">
                <div class="flex items-center justify-between px-1">
                  <div>
                    <span class="text-xs font-semibold text-[#424245]">接收远程指令</span>
                    <p class="text-[10px] text-[#86868B]">通过声网同步位置</p>
                  </div>
                  <button 
                    @click="toggleAgora"
                    :class="agora.connected ? 'bg-[#34C759]' : 'bg-gray-300'"
                    class="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200"
                  >
                    <span :class="agora.connected ? 'translate-x-5' : 'translate-x-0'" class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200"></span>
                  </button>
                </div>
                <div v-if="agora.connected" class="mt-3 space-y-3">
                  <div>
                    <label class="block text-[10px] font-bold text-[#86868B] uppercase mb-1">同步频道</label>
                    <input v-model="agora.channel" class="w-full bg-[#F5F5F7] rounded-lg px-3 py-2 text-xs font-mono outline-none focus:bg-white" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-[#86868B] uppercase mb-1">执行速度 (Speed)</label>
                    <input type="range" v-model.number="config.speed" min="50" max="400" class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0071E3]" />
                    <div class="text-[10px] text-right text-[#86868B] font-mono mt-1">{{ config.speed }}</div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-[#86868B] uppercase mb-1">视频清晰度</label>
                    <select v-model="agora.resolution" @change="updateResolution" class="w-full bg-[#F5F5F7] rounded-lg px-3 py-2 text-xs font-mono outline-none focus:bg-white">
                      <option v-for="opt in resolutionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                  </div>
                </div>
                <div v-if="!agora.connected" class="mt-2 space-y-2">
                  <div>
                    <label class="block text-[10px] font-bold text-[#86868B] uppercase mb-1">App ID 选项</label>
                    <select v-model="agora.appId" class="w-full bg-[#F5F5F7] rounded-lg px-3 py-2 text-xs font-mono outline-none focus:bg-white">
                      <option value="9a96087f25ad4929ad917710aa6c83fc">选项一（默认）</option>
                      <option value="fb538ff53f934d3282b0941db7aadc66">选项二（备用）</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-[#86868B] uppercase mb-1 text-orange-600">频道 Token (可选)</label>
                    <input v-model="agora.token" class="w-full bg-[#F5F5F7] rounded-lg px-3 py-2 text-xs font-mono outline-none focus:bg-white" placeholder="无需 Token 请留空" />
                  </div>
                </div>
              </div>

              <!-- 摄像头选择 (新增) -->
              <div v-if="!agora.connected" class="pt-2 border-t border-black/[0.03]">
                <div class="flex items-center justify-between px-1 mb-2">
                  <span class="text-xs font-semibold text-[#424245]">选择摄像头</span>
                  <button @click="refreshCameras" class="text-[10px] text-blue-600 font-bold hover:underline">刷新列表</button>
                </div>
                <div class="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  <div v-for="(cam, idx) in agora.availableCameras" :key="cam.deviceId" class="flex items-center space-x-2 bg-[#F5F5F7] p-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors" @click="toggleCameraSelection(cam.deviceId)">
                    <input type="checkbox" :checked="agora.selectedCameras.includes(cam.deviceId)" class="rounded border-gray-300 text-[#0071E3] focus:ring-blue-500" @click.stop="toggleCameraSelection(cam.deviceId)" />
                    <div class="flex-1 min-w-0">
                      <div class="text-[10px] text-[#424245] truncate">{{ `摄像头 ${idx + 1}` }} · {{ cam.label || 'Unknown Camera' }}</div>
                      <div class="text-[9px] text-[#86868B] font-mono truncate" :title="cam.deviceId">ID: {{ formatDeviceId(cam.deviceId) }}</div>
                    </div>
                  </div>
                  <div v-if="agora.availableCameras.length === 0" class="text-[10px] text-gray-400 text-center py-2 italic">未发现摄像头</div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="pt-4 space-y-3">
                <button 
                  @click="toggleConnect"
                  :disabled="isConnecting || !isFormValid"
                  :class="[
                    isConnected ? 'bg-[#FF3B30]' : 'bg-[#0071E3]',
                    'w-full py-3.5 px-4 rounded-2xl font-semibold text-white text-sm shadow-lg disabled:opacity-30'
                  ]"
                >
                  {{ isConnecting ? 'Connecting...' : (isConnected ? 'Disconnect Arm' : 'Connect Device') }}
                </button>
                <button @click="refreshDevices" class="w-full py-3 px-4 rounded-2xl font-semibold text-sm text-[#0071E3] hover:bg-blue-50 transition-all">
                  Refresh Ports
                </button>
              </div>
            </div>
          </section>

          <!-- 视频预览 (多路) -->
          <section v-if="agora.connected" class="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/[0.03]">
            <h2 class="text-sm font-semibold text-[#86868B] uppercase tracking-widest mb-4">Video Streams</h2>
            <div class="space-y-4">
              <div v-for="(deviceId, idx) in activeCameraIds" :key="deviceId" class="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
                <video :ref="el => setLocalVideoRef(deviceId, el)" autoplay muted playsinline class="w-full h-full object-cover"></video>
                <div class="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-[9px] font-bold rounded shadow-sm uppercase tracking-tighter">Live</div>
                <div class="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-[9px] font-mono rounded">CAM {{ Number(idx) + 1 }}</div>
              </div>
              <div v-if="activeCameraIds.length === 0" class="flex flex-col items-center justify-center py-8 text-gray-400">
                <div class="w-10 h-10 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                <p class="text-[10px]">启动摄像头中...</p>
                <p v-if="cameraError" class="text-[10px] text-red-500 mt-2">{{ cameraError }}</p>
              </div>
            </div>
          </section>
        </aside>

        <!-- 右侧内容区域 -->
        <div class="flex-1 min-w-0">
          <div v-if="!isConnected" class="h-full flex flex-col items-center justify-center min-h-[500px] bg-white rounded-[3rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-black/[0.03]">
            <div class="w-20 h-20 bg-[#F5F5F7] rounded-3xl flex items-center justify-center mb-6 text-[#86868B]">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <p class="text-xl font-semibold tracking-tight">操作臂遥控中心</p>
            <p class="text-[#86868B] mt-2 px-6 text-center text-sm">请连接本地操作臂，并开启同步以接收远程示教指令。</p>
          </div>

          <div v-else class="grid grid-cols-1 gap-8">
            <template v-for="(state, idx) in incomingStates" :key="idx">
              <div v-if="state" class="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-black/[0.03]">
                <!-- 卡片头部 -->
                <div class="px-8 py-6 border-b border-black/[0.03] flex items-center justify-between bg-[#FAFAFC]">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-[#0071E3] rounded-xl shadow-sm flex items-center justify-center text-lg font-bold text-white">
                      {{ idx === 0 ? 'L' : 'R' }}
                    </div>
                    <div>
                      <h3 class="font-bold text-lg leading-tight">{{ config.mode === 'dual' ? (idx === 0 ? '左操作臂 (Left)' : '右操作臂 (Right)') : '远程遥操指令' }}</h3>
                      <p class="text-xs text-[#86868B] font-mono mt-0.5">执行设备: {{ config.devices[idx] }}</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span class="text-xs font-medium text-green-600">正在同步</span>
                  </div>
                </div>

                <!-- 数据面板 -->
                <div class="p-8 lg:p-10">
                  <div class="grid grid-cols-1 xl:grid-cols-2 gap-12">
                    <!-- 关节状态可视化 -->
                    <div class="space-y-6">
                      <div class="flex items-center justify-between">
                        <h4 class="text-xs font-bold text-[#86868B] uppercase tracking-[0.15em]">目标关节角度 (Target Deg)</h4>
                        <span class="text-[10px] px-2 py-0.5 bg-blue-50 text-[#0071E3] rounded-full font-bold">Remote</span>
                      </div>
                      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div v-for="(deg, j) in state.data.joints_deg" :key="j" class="bg-[#F5F5F7] p-5 rounded-3xl border border-transparent hover:border-blue-200 transition-all group">
                          <div class="text-[10px] text-[#86868B] font-bold uppercase mb-1">Joint {{ Number(j) + 1 }}</div>
                          <div class="text-2xl font-mono font-semibold tracking-tighter">{{ deg.toFixed(2) }}<span class="text-sm ml-0.5 text-[#86868B]">°</span></div>
                        </div>
                      </div>
                    </div>

                    <!-- 传感器状态 -->
                    <div class="space-y-8">
                      <!-- 夹爪 -->
                      <div class="bg-[#0071E3] rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-lg shadow-blue-500/20">
                        <div class="relative z-10 flex items-center justify-between">
                          <div>
                            <h4 class="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Target Gripper</h4>
                            <p class="text-4xl font-mono font-bold tracking-tighter">{{ state.data.gripper.toFixed(0) }}</p>
                          </div>
                          <div class="w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center text-2xl font-bold">
                            G
                          </div>
                        </div>
                        <div class="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                      </div>

                      <!-- 按钮状态显示 (同步远端示教臂按钮) -->
                      <div class="grid grid-cols-2 gap-6">
                        <div :class="state.data.buttons && state.data.buttons[0] ? 'bg-green-50 text-green-700' : 'bg-[#F5F5F7] text-[#86868B]'" class="p-6 rounded-[2rem] flex flex-col items-center justify-center space-y-3 transition-all">
                          <div :class="state.data.buttons && state.data.buttons[0] ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-gray-300'" class="w-3 h-3 rounded-full"></div>
                          <span class="text-xs font-bold uppercase tracking-widest">Remote B1</span>
                          <span class="text-lg font-bold">{{ state.data.buttons && state.data.buttons[0] ? 'Active' : 'Idle' }}</span>
                        </div>
                        <div :class="state.data.buttons && state.data.buttons[1] ? 'bg-orange-50 text-orange-700' : 'bg-[#F5F5F7] text-[#86868B]'" class="p-6 rounded-[2rem] flex flex-col items-center justify-center space-y-3 transition-all">
                          <div :class="state.data.buttons && state.data.buttons[1] ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-gray-300'" class="w-3 h-3 rounded-full"></div>
                          <span class="text-xs font-bold uppercase tracking-widest">Remote B2</span>
                          <span class="text-lg font-bold">{{ state.data.buttons && state.data.buttons[1] ? 'Active' : 'Idle' }}</span>
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
import type { IAgoraRTCClient, ILocalVideoTrack } from 'agora-rtc-sdk-ng';

const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
const wsBaseUrl = import.meta.env.VITE_BACKEND_WS_URL || backendBaseUrl.replace(/^http/, 'ws');

// --- 状态 ---
const config = reactive({
  mode: 'single' as 'single' | 'dual',
  devices: ['', ''] as string[],
  speed: 50
});

const agora = reactive({
  connected: false,
  channel: 'synria-teleop1',
  token: '',
  appId: '9a96087f25ad4929ad917710aa6c83fc',
  clients: [] as IAgoraRTCClient[], // 改为多个 Client
  availableCameras: [] as any[],
  selectedCameras: [] as string[],
  resolution: '480p' as '480p' | '720p' | '1080p'
});

const resolutionOptions = [
  { label: '流畅 (480p)', value: '480p', config: '480p_1' },
  { label: '标清 (720p)', value: '720p', config: '720p_1' },
  { label: '高清 (1080p)', value: '1080p', config: '1080p_1' }
];

const updateResolution = async () => {
  const option = resolutionOptions.find(o => o.value === agora.resolution);
  if (!option) return;
  
  for (const track of Object.values(localVideoTracks)) {
    try {
      await track.setEncoderConfiguration(option.config as any);
    } catch (e) {
      console.error('Failed to set resolution', e);
    }
  }
};

const availableDevices = ref<any[]>([]);
const isConnecting = ref(false);
const isConnected = ref(false);
const processedCount = ref(0);
const cameraError = ref('');

// 获取摄像头列表
const refreshCameras = async () => {
  try {
    // 先请求一次权限，避免设备列表重复/无标签
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream.getTracks().forEach(track => track.stop());
  } catch (e) {}

  try {
    const cameras = await AgoraRTC.getCameras();
    agora.availableCameras = cameras;
    if (agora.selectedCameras.length === 0 && cameras.length > 0) {
      const firstId = cameras[0]?.deviceId;
      if (firstId) {
        agora.selectedCameras = [firstId];
      }
    }
  } catch (e) {}
};

const toggleCameraSelection = (deviceId: string) => {
  const index = agora.selectedCameras.indexOf(deviceId);
  if (index === -1) {
    agora.selectedCameras.push(deviceId);
  } else {
    agora.selectedCameras.splice(index, 1);
  }
};

const incomingStates = reactive<(any | null)[]>([null, null]);
const websockets = ref<(WebSocket | null)[]>([null, null]);
const localVideoTracks: Record<string, ILocalVideoTrack> = {};
const activeCameraIds = ref<string[]>([]);
const syncLatencyMs = ref(0);
// 多路预览（不要用响应式，避免渲染时触发递归更新）
const localVideoRefs: Record<string, HTMLVideoElement | null> = {};
const setLocalVideoRef = (deviceId: string, el: any) => {
  if (el) {
    localVideoRefs[deviceId] = el;
    const track = localVideoTracks[deviceId];
    if (track) track.play(el);
  }
};

const formatDeviceId = (deviceId: string) => {
  if (!deviceId) return '';
  if (deviceId.length <= 12) return deviceId;
  return `${deviceId.slice(0, 6)}...${deviceId.slice(-4)}`;
};

const makeCameraUid = (deviceId: string, index: number) => {
  const seed = `${deviceId}-${index}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + 1;
};

const createCameraTrackFromDevice = async (deviceId: string) => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: { exact: deviceId } },
    audio: false
  });
  const mediaTrack = stream.getVideoTracks()[0];
  if (!mediaTrack) {
    throw new Error('No video track available');
  }
  return AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: mediaTrack });
};

const isFormValid = computed(() => {
  if (config.mode === 'single') return config.devices[0] !== '';
  return config.devices[0] !== '' && config.devices[1] !== '' && config.devices[0] !== config.devices[1];
});

// --- 声网接收逻辑 + 视频发布 ---
const toggleAgora = async () => {
  if (agora.connected) {
    // 停止并释放所有视频轨道
    Object.values(localVideoTracks).forEach(track => { track.stop(); track.close(); });
    activeCameraIds.value = [];
    // 所有 Client 离开频道
    await Promise.all(agora.clients.map(c => c.leave()));
    agora.clients = [];
    agora.connected = false;
    return;
  }

  if (agora.selectedCameras.length === 0) {
    alert("请至少选择一个摄像头");
    return;
  }

  try {
    cameraError.value = '';
    // 1. 创建主 Client (负责指令接收 + 第一路视频)
    const mainClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    agora.clients.push(mainClient);

    // 监听数据流消息 (仅在主 Client 监听)
    mainClient.on("stream-message", (_uid: any, data: any) => {
      if (!data) return;
      try {
        const decodedString = new TextDecoder().decode(data);
        const json = JSON.parse(decodedString);
        if (json.t === 'sync') {
          const nowMs = Date.now();
          const latencies: number[] = [];
          json.arms.forEach((armData: any) => {
            const armIdx = armData.i;
            const recvMs = Number(armData.recv_ms ?? 0);
            if (recvMs > 0) {
              const latency = Math.round(nowMs - recvMs);
              if (Number.isFinite(latency) && latency >= 0) {
                latencies.push(latency);
              }
            }
            if ((config.mode === 'single' && armIdx === 0) || config.mode === 'dual') {
              incomingStates[armIdx] = {
                data: { joints_deg: armData.j, gripper: armData.g, buttons: armData.b },
                timestamp: json.ts
              };
              processedCount.value++;
              executeCommand(armIdx, incomingStates[armIdx].data);
            }
          });
          if (latencies.length > 0) {
            const avg = latencies.reduce((sum, v) => sum + v, 0) / latencies.length;
            syncLatencyMs.value = Math.round(avg);
          }
        }
      } catch (e) {}
    });

    // 2. 启动所有摄像头 (每个摄像头一个 Client)
    for (let i = 0; i < agora.selectedCameras.length; i++) {
      const deviceId = agora.selectedCameras[i];
      if (!deviceId) continue;
      // 关键：给驱动程序切换时间
      await new Promise(r => setTimeout(r, 150));

      let client = (i === 0) ? mainClient : AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      if (i > 0) agora.clients.push(client);

      const uid = makeCameraUid(deviceId, i);
      await client.join(agora.appId, agora.channel, agora.token || null, uid);

      try {
        const track = await createCameraTrackFromDevice(deviceId);
        localVideoTracks[deviceId] = track;
        if (!activeCameraIds.value.includes(deviceId)) {
          activeCameraIds.value = [...activeCameraIds.value, deviceId];
        }

        await nextTick();
        const el = localVideoRefs[deviceId];
        if (el) {
          await track.play(el);
        } else {
          setTimeout(() => {
            const retryEl = localVideoRefs[deviceId];
            if (retryEl) track.play(retryEl);
          }, 300);
        }

        await client.publish(track);

        const option = resolutionOptions.find(o => o.value === agora.resolution);
        if (option) {
          try {
            await track.setEncoderConfiguration(option.config as any);
          } catch(e) { console.warn('Set resolution failed', e); }
        }
      } catch (e: any) {
        const msg = e?.message || '无法访问摄像头'
        cameraError.value = `启动摄像头失败：${msg}`
        console.error('[camera] start failed', e)
      }
    }

    agora.connected = true;
  } catch (e: any) {
    alert(`声网启动失败: ${e.message}`);
    // 清理
    agora.clients.forEach(c => c.leave());
    agora.clients = [];
  }
};

// 转发至 WebSocket 驱动硬件
const executeCommand = (armIndex: number, data: any) => {
  if (isConnected.value) {
    const ws = websockets.value[armIndex];
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'cmd.movej',
        joints_deg: data.joints_deg,
        gripper: data.gripper,
        speed: config.speed
      }));
    }
  }
};

// --- 硬件连接逻辑 ---
const refreshDevices = async () => {
  try {
    const res = await axios.get(`${backendBaseUrl}/robots/infos`);
    availableDevices.value = res.data.devices.devices || [];
  } catch (e) {}
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
    }
    isConnected.value = true;
  } catch (e: any) {
    alert('硬件连接失败');
    disconnectAll();
  } finally { isConnecting.value = false; }
};

const disconnectAll = () => {
  websockets.value.forEach(ws => ws?.close());
  websockets.value = [null, null];
  isConnected.value = false;
  processedCount.value = 0;
  syncLatencyMs.value = 0;
  incomingStates[0] = null; incomingStates[1] = null;
};

onMounted(() => { 
  refreshDevices(); 
  refreshCameras();
});
onUnmounted(() => { 
  disconnectAll(); 
  Object.values(localVideoTracks).forEach(track => { track.stop(); track.close(); });
  agora.clients.forEach(c => c.leave());
});
</script>

<style scoped>
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.1); }

::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
</style>
