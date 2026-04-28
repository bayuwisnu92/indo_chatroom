
import { port } from "./port.js"
export async function verifyToken(token) {
    const response = await fetch(`${port}/api/verify-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Authentication failed');
    }
  
    return response.json();
  }
  
  export function decodeToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (err) {
      console.error('Gagal decode token:', err);
      return null;
    }
  }
  
  export async function logoutOnline(token) {
    try {
      const response = await fetch(`${port}/api/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      return response.ok;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }