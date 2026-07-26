const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (!envUrl || envUrl.includes('127.0.0.1:8000') || envUrl.includes('localhost:8000')) {
    return 'http://127.0.0.1:8000';
  }
  return envUrl.replace(/\/$/, '');
};

const API_BASE_URL = getApiBaseUrl();

function getAuthHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('ca_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let errorMsg = 'Login failed.';
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const token = data.access_token || data.token;
  
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('ca_token', token);
    
    try {
      const profile = await fetchUserProfile(token);
      localStorage.setItem('user', JSON.stringify(profile));
      localStorage.setItem('ca_user', JSON.stringify(profile));
      return { token, user: profile };
    } catch (e) {
      const userObj = { email, name: email.split('@')[0], fullName: email.split('@')[0] };
      localStorage.setItem('user', JSON.stringify(userObj));
      localStorage.setItem('ca_user', JSON.stringify(userObj));
      return { token, user: userObj };
    }
  }
  return data;
}

export async function signupUser(userData) {
  const payload = {
    name: userData.name || userData.fullName || 'User',
    email: userData.email,
    password: userData.password,
    company: userData.company || userData.organizationName || 'Enterprise',
  };

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = 'Registration failed.';
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  return await loginUser(userData.email, userData.password);
}

export async function fetchUserProfile(token) {
  const authToken = token || localStorage.getItem('token') || localStorage.getItem('ca_token');
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user profile.');
  }
  const data = await response.json();
  // Sync to localStorage for use across pages
  localStorage.setItem('user', JSON.stringify(data));
  localStorage.setItem('ca_user', JSON.stringify(data));
  return data;
}

export async function updateUserProfile(profileData) {
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(profileData),
  });
  if (!response.ok) {
    let errorMsg = 'Profile update failed.';
    try {
      const err = await response.json();
      errorMsg = err.detail || err.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  const data = await response.json();
  // Sync updated profile to localStorage
  const existing = JSON.parse(localStorage.getItem('user') || '{}');
  const merged = { ...existing, ...data };
  localStorage.setItem('user', JSON.stringify(merged));
  localStorage.setItem('ca_user', JSON.stringify(merged));
  return data;
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/auth/avatar`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: formData,
  });
  if (!response.ok) {
    let errorMsg = 'Avatar upload failed.';
    try {
      const err = await response.json();
      errorMsg = err.detail || err.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  const data = await response.json();
  const existing = JSON.parse(localStorage.getItem('user') || '{}');
  const merged = { ...existing, ...data };
  localStorage.setItem('user', JSON.stringify(merged));
  localStorage.setItem('ca_user', JSON.stringify(merged));
  return data;
}

export async function googleAuthUser(credentialToken) {
  const mockUser = {
    email: 'alex.sterling@enterprise.com',
    name: 'Alex Sterling',
    fullName: 'Alex Sterling',
    role: 'Risk Officer',
    company: 'Global Security Division',
  };
  localStorage.setItem('token', 'mock_google_jwt_token_12345');
  localStorage.setItem('ca_token', 'mock_google_jwt_token_12345');
  localStorage.setItem('user', JSON.stringify(mockUser));
  localStorage.setItem('ca_user', JSON.stringify(mockUser));
  return { token: 'mock_google_jwt_token_12345', user: mockUser };
}

export async function runAudit(file) {
  const formData = new FormData();
  formData.append('file', file);

  const headers = getAuthHeaders();

  try {
    const response = await fetch(`${API_BASE_URL}/audit`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = 'Audit execution failed.';
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }
    return await response.json();
  } catch (err) {
    if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
      // Direct retry with fallback
      try {
        const fallbackRes = await fetch(`http://localhost:8000/audit`, {
          method: 'POST',
          headers,
          body: formData,
        });
        if (fallbackRes.ok) return await fallbackRes.json();
      } catch (e2) {}
      throw new Error('Backend server unreachable. Ensure Uvicorn is running on http://127.0.0.1:8000.');
    }
    throw err;
  }
}

export async function fetchAudits() {
  try {
    const response = await fetch(`${API_BASE_URL}/audits`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return { audits: [] };
    const data = await response.json();
    return { audits: Array.isArray(data) ? data : [] };
  } catch (err) {
    console.warn('Backend API unreachable.', err);
    return { audits: [] };
  }
}

export async function fetchUserDocuments() {
  try {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Failed to fetch user documents:', err);
    return [];
  }
}


export async function fetchAuditDetails(auditId) {
  const response = await fetch(`${API_BASE_URL}/audits/${auditId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch audit details.');
  }
  return await response.json();
}

export async function fetchAnalytics() {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    return null;
  }
}

export async function deleteAudit(auditId) {
  const response = await fetch(`${API_BASE_URL}/audits/${auditId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return await response.json();
}

export async function fetchSettings() {
  try {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    return null;
  }
}

export async function updateSettings(settingsData) {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(settingsData),
  });
  return await response.json();
}
