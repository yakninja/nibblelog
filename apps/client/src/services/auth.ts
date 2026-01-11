import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'nibble_auth_token';
const USER_ID_KEY = 'nibble_user_id';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user_id: string;
}

// Storage abstraction: use AsyncStorage on web, SecureStore on native
async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

async function deleteSecureItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  const data: AuthResponse = await response.json();

  // Store token and user_id
  await setSecureItem(TOKEN_KEY, data.token);
  await AsyncStorage.setItem(USER_ID_KEY, data.user_id);

  return data;
}

export async function logout(): Promise<void> {
  await deleteSecureItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_ID_KEY);
}

export async function getToken(): Promise<string | null> {
  return await getSecureItem(TOKEN_KEY);
}

export async function getUserId(): Promise<string | null> {
  return await AsyncStorage.getItem(USER_ID_KEY);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}
