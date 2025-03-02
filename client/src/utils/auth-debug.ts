// Debug utilities for tracking auth token issues

export function debugAuthToken() {
  const token = localStorage.getItem('auth_token');
  console.log('Current auth token:', token ? `${token.substring(0, 10)}...` : 'No token found');
  
  // Check token validity by making a validation request
  fetch('/auth/validate', {
    headers: {
      'Authorization': token ? `Bearer ${token}` : ''
    }
  })
  .then(response => {
    console.log('Token validation status:', response.status, response.statusText);
    return response.json().catch(e => ({ error: 'Failed to parse response' }));
  })
  .then(data => {
    console.log('Token validation response:', data);
  })
  .catch(error => {
    console.error('Token validation error:', error);
  });
  
  return { token };
}

// Add this to your app to monitor localStorage changes
export function setupAuthStorageMonitor() {
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;
  
  localStorage.setItem = function(key, value) {
    if (key === 'auth_token') {
      console.log('Setting auth_token in localStorage:', value ? `${value.substring(0, 10)}...` : value);
      console.trace('Token set at:');
    }
    originalSetItem.call(localStorage, key, value);
  };
  
  localStorage.removeItem = function(key) {
    if (key === 'auth_token') {
      console.log('Removing auth_token from localStorage');
      console.trace('Token removed at:');
    }
    originalRemoveItem.call(localStorage, key);
  };
  
  console.log('Auth storage monitor activated');
} 