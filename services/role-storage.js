/**
 * Role Storage Service
 * Manages roles using Chrome storage sync with local fallback
 */

/**
 * Role Schema:
 * {
 *   id: string,
 *   name: string,
 *   area: string,
 *   description: string,
 *   skills: string[],
 *   tools: string[],
 *   constraints: string[],
 *   behavior: string,
 *   moreInfo: string,
 *   createdAt: number,
 *   updatedAt: number
 * }
 */

const STORAGE_KEY = 'agentique_roles';
const SYNC_QUOTA_BYTES = 102400; // 100KB sync quota

/**
 * Generate unique ID for a role
 * @returns {string}
 */
function generateId() {
  return `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new role object with defaults
 * @param {Partial<Role>} data
 * @returns {Role}
 */
function createRole(data = {}) {
  const now = Date.now();
  return {
    id: data.id || generateId(),
    name: data.name || '',
    area: data.area || '',
    description: data.description || '',
    skills: data.skills || [],
    tools: data.tools || [],
    constraints: data.constraints || [],
    behavior: data.behavior || '',
    moreInfo: data.moreInfo || '',
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
}

/**
 * Check if data fits in sync storage
 * @param {Object} data
 * @returns {boolean}
 */
function fitsInSync(data) {
  const size = new Blob([JSON.stringify(data)]).size;
  return size < SYNC_QUOTA_BYTES;
}

/**
 * Get storage area (sync or local)
 * @returns {chrome.storage.StorageArea}
 */
async function getStorageArea() {
  // Try sync first, fall back to local if quota exceeded
  try {
    const syncData = await chrome.storage.sync.get(STORAGE_KEY);
    if (syncData[STORAGE_KEY] !== undefined || fitsInSync(syncData)) {
      return chrome.storage.sync;
    }
  } catch (error) {
    console.warn('[RoleStorage] Sync unavailable, using local:', error);
  }
  return chrome.storage.local;
}

/**
 * Get all roles
 * @returns {Promise<Role[]>}
 */
async function getAllRoles() {
  try {
    const storage = await getStorageArea();
    const result = await storage.get(STORAGE_KEY);
    return result[STORAGE_KEY] || [];
  } catch (error) {
    console.error('[RoleStorage] Failed to get roles:', error);
    return [];
  }
}

/**
 * Get a single role by ID
 * @param {string} id
 * @returns {Promise<Role|null>}
 */
async function getRole(id) {
  const roles = await getAllRoles();
  return roles.find(role => role.id === id) || null;
}

/**
 * Save a role (create or update)
 * @param {Partial<Role>} roleData
 * @returns {Promise<Role>}
 */
async function saveRole(roleData) {
  const roles = await getAllRoles();
  const existingIndex = roles.findIndex(r => r.id === roleData.id);

  let role;
  if (existingIndex >= 0) {
    // Update existing
    role = {
      ...roles[existingIndex],
      ...roleData,
      updatedAt: Date.now()
    };
    roles[existingIndex] = role;
  } else {
    // Create new
    role = createRole(roleData);
    roles.push(role);
  }

  // Try sync first, fall back to local
  const data = { [STORAGE_KEY]: roles };

  if (fitsInSync(data)) {
    try {
      await chrome.storage.sync.set(data);
      console.log('[RoleStorage] Saved to sync:', role.name);
    } catch (error) {
      console.warn('[RoleStorage] Sync failed, using local:', error);
      await chrome.storage.local.set(data);
    }
  } else {
    console.log('[RoleStorage] Data too large for sync, using local');
    await chrome.storage.local.set(data);
  }

  return role;
}

/**
 * Delete a role by ID
 * @param {string} id
 * @returns {Promise<boolean>}
 */
async function deleteRole(id) {
  const roles = await getAllRoles();
  const filteredRoles = roles.filter(r => r.id !== id);

  if (filteredRoles.length === roles.length) {
    return false; // Role not found
  }

  const data = { [STORAGE_KEY]: filteredRoles };

  // Save to both to ensure deletion is synced
  try {
    await chrome.storage.sync.set(data);
  } catch (error) {
    // Ignore sync errors
  }
  await chrome.storage.local.set(data);

  console.log('[RoleStorage] Deleted role:', id);
  return true;
}

/**
 * Get all unique areas from existing roles
 * @returns {Promise<string[]>}
 */
async function getAllAreas() {
  const roles = await getAllRoles();
  const areas = [...new Set(roles.map(r => r.area).filter(Boolean))];
  return areas.sort();
}

/**
 * Get roles filtered by area
 * @param {string} area
 * @returns {Promise<Role[]>}
 */
async function getRolesByArea(area) {
  const roles = await getAllRoles();
  return roles.filter(r => r.area === area);
}

/**
 * Format role for injection into AI chat
 * @param {Role} role
 * @returns {string}
 */
function formatRoleForInjection(role) {
  const sections = [];

  // 1. Role name
  sections.push(`Role: ${role.name}`);
  sections.push('');
  sections.push('');

  // 2. Task placeholder
  sections.push('Task: [Describe your task here]');
  sections.push('');
  sections.push('');

  // 3. Role Context (details from extension)
  const contextParts = [];

  if (role.area) {
    contextParts.push(`Area: ${role.area}`);
  }

  if (role.description) {
    contextParts.push(`Description: ${role.description}`);
  }

  if (role.skills && role.skills.length > 0) {
    contextParts.push('Skills:\n' + role.skills.map(s => `- ${s}`).join('\n'));
  }

  if (role.tools && role.tools.length > 0) {
    contextParts.push('Tools:\n' + role.tools.map(t => `- ${t}`).join('\n'));
  }

  if (role.constraints && role.constraints.length > 0) {
    contextParts.push('Constraints:\n' + role.constraints.map(c => `- ${c}`).join('\n'));
  }

  if (role.behavior) {
    contextParts.push(`Behavior & Tonality: ${role.behavior}`);
  }

  if (role.moreInfo) {
    contextParts.push(`Additional Information: ${role.moreInfo}`);
  }

  sections.push('Role Context:');
  sections.push(contextParts.join('\n\n'));
  sections.push('');
  sections.push('');

  // 4. More Context placeholder
  sections.push('More Context: [Add any additional context, data, or background information here]');

  return sections.join('\n');
}

/**
 * Subscribe to storage changes
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
function onRolesChanged(callback) {
  const listener = (changes, areaName) => {
    if (changes[STORAGE_KEY]) {
      callback(changes[STORAGE_KEY].newValue || []);
    }
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

// Expose globally (loaded as regular script in popup.html)
const RoleStorage = {
  createRole,
  getAllRoles,
  getRole,
  saveRole,
  deleteRole,
  getAllAreas,
  getRolesByArea,
  formatRoleForInjection,
  onRolesChanged
};
