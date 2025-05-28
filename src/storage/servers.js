/* @flow strict-local */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Server } from '../types';

const STORAGE_KEY = 'zulip_servers';

// Chuẩn hóa URL để so sánh
const normalizeUrl = (url: string | URL): string => {
  // Chuyển URL object thành string nếu cần
  const urlStr = url instanceof URL ? url.toString() : url;

  // Loại bỏ protocol (http://, https://)
  let normalized = urlStr.replace(/^https?:\/\//, '');
  // Loại bỏ dấu / ở cuối
  normalized = normalized.replace(/\/$/, '');
  // Chuyển về chữ thường
  normalized = normalized.toLowerCase();
  return normalized;
};

// Kiểm tra URL có trùng với server nào trong danh sách không
const isUrlExists = (url: string | URL, servers: Server[]): boolean => {
  const normalizedUrl = normalizeUrl(url);
  return servers.some(server => normalizeUrl(server.url) === normalizedUrl);
};

export const saveServer = async (server: Server): Promise<void> => {
  try {
    // Lấy danh sách server hiện tại
    const serversJson = await AsyncStorage.getItem(STORAGE_KEY);
    const servers: Server[] = serversJson ? JSON.parse(serversJson) : [];

    // Kiểm tra xem server đã tồn tại chưa
    if (isUrlExists(server.url, servers)) {
      console.log('Server already exists:', server.url);
      return;
    }

    // Thêm server mới
    servers.push(server);

    // Lưu lại danh sách
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
  } catch (error) {
    console.error('Error saving server:', error);
  }
};

export const getServers = async (): Promise<Server[]> => {
  try {
    const serversJson = await AsyncStorage.getItem(STORAGE_KEY);
    return serversJson ? JSON.parse(serversJson) : [];
  } catch (error) {
    console.error('Error getting servers:', error);
    return [];
  }
};

export const deleteServer = async (serverId: string): Promise<void> => {
  try {
    const serversJson = await AsyncStorage.getItem(STORAGE_KEY);
    if (!serversJson)
{ return; }

    const servers: Server[] = JSON.parse(serversJson);
    const filteredServers = servers.filter(s => s.id !== serverId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredServers));
  } catch (error) {
    console.error('Error deleting server:', error);
  }
};
