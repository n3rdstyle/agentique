/**
 * Agentique Chrome Extension
 * Main application logic for role-based context injection
 */

console.log('[Agentique] App loaded');

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the application
 */
async function initializeApp() {
  console.log('[Agentique] Initializing...');

  try {
    // Load roles from storage
    const roles = await RoleStorage.getAllRoles();
    console.log('[Agentique] Loaded', roles.length, 'roles');

    // Render the home screen
    renderHomeScreen(roles);

    // Subscribe to storage changes
    RoleStorage.onRolesChanged((newRoles) => {
      console.log('[Agentique] Roles changed, updating UI');
      if (currentHomeScreen) {
        currentHomeScreen.setRoles(newRoles);
      }
    });

  } catch (error) {
    console.error('[Agentique] Failed to initialize:', error);
    renderErrorScreen('Failed to load roles. Please try again.');
  }
}

// ============================================================================
// SCREEN RENDERING
// ============================================================================

let currentHomeScreen = null;

/**
 * Render the home screen with role list
 * @param {Array} roles - Array of role objects
 */
function renderHomeScreen(roles) {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('[Agentique] App container not found');
    return;
  }

  // Clear container
  appContainer.innerHTML = '';

  // Create home screen
  currentHomeScreen = createHome({
    roles: roles,
    onRoleSave: handleRoleSave,
    onRoleDelete: handleRoleDelete,
    onSettingsClick: handleSettingsClick
  });

  appContainer.appendChild(currentHomeScreen.element);
}

/**
 * Render error screen
 * @param {string} message - Error message
 */
function renderErrorScreen(message) {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  appContainer.innerHTML = `
    <div class="error-screen">
      <p class="error-screen__message">${message}</p>
      <button class="error-screen__retry" onclick="location.reload()">Retry</button>
    </div>
  `;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle role save (create or update)
 * @param {Object} roleData - Role data to save
 * @returns {Promise<Object>} Saved role
 */
async function handleRoleSave(roleData) {
  try {
    const savedRole = await RoleStorage.saveRole(roleData);
    console.log('[Agentique] Role saved:', savedRole.name);
    return savedRole;
  } catch (error) {
    console.error('[Agentique] Failed to save role:', error);
    alert('Failed to save role. Please try again.');
    return null;
  }
}

/**
 * Handle role delete
 * @param {string} roleId - Role ID to delete
 * @returns {Promise<boolean>} Success
 */
async function handleRoleDelete(roleId) {
  try {
    const success = await RoleStorage.deleteRole(roleId);
    if (success) {
      console.log('[Agentique] Role deleted:', roleId);
    }
    return success;
  } catch (error) {
    console.error('[Agentique] Failed to delete role:', error);
    alert('Failed to delete role. Please try again.');
    return false;
  }
}

/**
 * Handle settings click
 */
function handleSettingsClick() {
  // TODO: Implement settings screen
  console.log('[Agentique] Settings clicked - not yet implemented');
}

// ============================================================================
// STARTUP
// ============================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
