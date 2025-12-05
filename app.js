/**
 * Agentique Chrome Extension
 * Main application logic for role-based context injection
 */

console.log('[Agentique] App loaded');

// ============================================================================
// SPLASH SCREEN
// ============================================================================

const MIN_SPLASH_DURATION = 800; // ms - minimum time to show splash
const MAX_SPLASH_DURATION = 3000; // ms - maximum time to show splash
const SPLASH_STORAGE_KEY = 'agentique_splash_last_shown';
const SPLASH_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Show splash screen if not shown today
 * Returns a function to hide the splash screen
 * @returns {Function} Function to hide splash (always returns a function)
 */
function initSplashScreen() {
  const splashScreen = document.getElementById('splash-screen');
  if (!splashScreen) {
    return () => Promise.resolve(); // No splash element, return no-op
  }

  // Check if already shown within the last 24 hours
  const lastShown = localStorage.getItem(SPLASH_STORAGE_KEY);
  let shouldShow = true;

  if (lastShown) {
    const elapsed = Date.now() - parseInt(lastShown, 10);
    if (elapsed < SPLASH_COOLDOWN_MS) {
      shouldShow = false; // Don't show splash
    }
  }

  if (!shouldShow) {
    // Hide immediately without animation
    console.log('[Agentique] Splash screen already shown today, hiding immediately');
    splashScreen.style.display = 'none';
    return () => Promise.resolve(); // Return no-op hide function
  }

  // Show splash screen
  console.log('[Agentique] Showing splash screen');
  splashScreen.style.display = 'flex';
  const startTime = Date.now();

  // Mark as shown with current timestamp
  localStorage.setItem(SPLASH_STORAGE_KEY, Date.now().toString());

  // Return function to hide splash
  return () => {
    return new Promise((resolve) => {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_SPLASH_DURATION - elapsed);

      // Wait for minimum duration before hiding
      setTimeout(() => {
        splashScreen.classList.add('splash-screen--hidden');
        // Remove from DOM after transition
        setTimeout(() => {
          splashScreen.style.display = 'none';
          resolve();
        }, 400);
      }, remainingTime);
    });
  };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the application
 */
async function initializeApp() {
  console.log('[Agentique] Initializing...');

  // Initialize splash screen (always returns hide function)
  const hideSplash = initSplashScreen();

  try {
    // Load roles from storage with timeout
    console.log('[Agentique] Loading roles from storage...');
    const loadPromise = RoleStorage.getAllRoles();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Loading timeout')), MAX_SPLASH_DURATION)
    );

    const roles = await Promise.race([loadPromise, timeoutPromise]);
    console.log('[Agentique] Loaded', roles.length, 'roles');

    // Hide splash screen
    console.log('[Agentique] Hiding splash screen...');
    await hideSplash();
    console.log('[Agentique] Splash screen hidden');

    // Render the home screen
    console.log('[Agentique] Rendering home screen...');
    renderHomeScreen(roles);
    console.log('[Agentique] Home screen rendered');

    // Subscribe to storage changes
    RoleStorage.onRolesChanged((newRoles) => {
      console.log('[Agentique] Roles changed, updating UI');
      if (currentHomeScreen) {
        currentHomeScreen.setRoles(newRoles);
      }
    });

  } catch (error) {
    console.error('[Agentique] Failed to initialize:', error);

    // Hide splash screen
    await hideSplash();

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
    onRoleDelete: handleRoleDelete
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

// ============================================================================
// STARTUP
// ============================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
