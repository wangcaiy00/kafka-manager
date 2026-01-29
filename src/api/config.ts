/**
 * API 配置
 * 
 * 通过修改 USE_MOCK 来切换 Mock 模式和真实 API 模式
 */

// 是否使用 Mock 数据（开发时设为 true，对接后端时设为 false）
export const USE_MOCK = true;

// 后端 API 地址
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// WebSocket 地址
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002';

// 请求超时时间
export const REQUEST_TIMEOUT = 30000;

// API 版本
export const API_VERSION = 'v1';
