
export function getUserPermissions() {
  try {
    const user = localStorage.getItem('user');
    if (!user) return [];

    const data = JSON.parse(user);

    return data?.permission || [];
  } catch (err) {
    console.error("Failed to parse user from localStorage", err);
    return [];
  }
}


export function getpricingspecialist() {
  try {
    const user = localStorage.getItem('user');
    if (!user) return [];

    const data = JSON.parse(user);

    return data?.is_pricing_specialist;
  } catch (err) {
    console.error("Failed to parse user from localStorage", err);
    return [];
  }
}

export function getUser() {
  try {
    const user = localStorage.getItem('user');
    if (!user) return null;

    const data = JSON.parse(user);
    return data || null;
  } catch (err) {
    console.error("Failed to parse user from localStorage", err);
    return null;
  }
}

export function getUserRole() {
  try {
    const user = localStorage.getItem('user');
    if (!user) return null;

    const data = JSON.parse(user);
    return data?.role || null;
  } catch (err) {
    console.error("Failed to parse user from localStorage", err);
    return null;
  }
}

export function getIsHead() {
  try {
    const user = localStorage.getItem('user');
    if (!user) return false;

    const data = JSON.parse(user);
    return data?.is_head || false;
  } catch (err) {
    console.error("Failed to parse user from localStorage", err);
    return false;
  }
}

export function getOnlyProfile() {
  try {
    const user = localStorage.getItem('user');
    if (!user) return false;

    const data = JSON.parse(user);
    return data?.only_profile === true;
  } catch (err) {
    console.error("Failed to parse user from localStorage", err);
    return false;
  }
}

export function getDepartmentName() {
  try {
    const user = localStorage.getItem('user');
    if (!user) return null;

    const data = JSON.parse(user);
    return data?.department_name || null;
  } catch (err) {
    console.error("Failed to parse user from localStorage", err);
    return null;
  }
}

export function getDepartmentId() {
  try {
    const user = localStorage.getItem('user');
    if (!user) return null;

    const data = JSON.parse(user);
    return data?.department_id || null;
  } catch (err) {
    console.error("Failed to parse user from localStorage", err);
    return null;
  }
}