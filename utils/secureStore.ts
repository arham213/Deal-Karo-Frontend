import * as SecureStore from 'expo-secure-store';

export async function saveToken(token: string) {
  try {
    await SecureStore.setItemAsync('userToken', token);
  } catch (error: any) {
    throw new Error('Failed to save token: ' + error.message);
  }
}

export async function getToken() {
  try {
    return await SecureStore.getItemAsync('userToken');
  } catch (error: any) {
    throw new Error('Failed to get token: ' + error.message);
  }
}

export async function deleteToken() {
  try {
    await SecureStore.deleteItemAsync('userToken');
  } catch (error: any) {
    throw new Error('Failed to delete token: ' + error.message);
  }
}

export async function saveUser(user: any) {
  try {
    await SecureStore.setItemAsync('user', JSON.stringify(user));
  } catch (error: any) {
    throw new Error('Failed to save user: ' + error.message);
  }
}

export async function getUser() {
  try {
    const user = await SecureStore.getItemAsync('user');
    return user ? JSON.parse(user) : null;
  } catch (error: any) {
    throw new Error('Failed to get user: ' + error.message);
  }
}

export async function deleteUser() {
  try {
    await SecureStore.deleteItemAsync('user');
  } catch (error: any) {
    throw new Error('Failed to delete user: ' + error.message);
  }
}