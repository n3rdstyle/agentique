/**
 * Home Screen
 * Displays role list with add/edit/delete functionality
 * Requires: header.js, role-list.js, role-card.js, role-editor-modal.js, overlay.js
 */

function createHome(options = {}) {
  const {
    roles = [],
    onRoleSave = null,
    onRoleDelete = null,
    onSettingsClick = null
  } = options;

  // Create home container
  const screenElement = document.createElement('div');
  screenElement.className = 'home';

  // Track current roles
  let currentRoles = [...roles];

  // Get existing areas for suggestions
  const getExistingAreas = () => {
    return [...new Set(currentRoles.map(r => r.area).filter(Boolean))].sort();
  };

  // Open role editor modal
  const openRoleEditor = (role = null) => {
    const modal = createRoleEditorModal({
      role: role,
      existingAreas: getExistingAreas(),
      onSave: async (roleData) => {
        if (onRoleSave) {
          const savedRole = await onRoleSave(roleData);
          if (savedRole) {
            // Update local state
            const existingIndex = currentRoles.findIndex(r => r.id === savedRole.id);
            if (existingIndex >= 0) {
              currentRoles[existingIndex] = savedRole;
            } else {
              currentRoles.push(savedRole);
            }
            // Re-render list
            roleList.setRoles(currentRoles);
          }
        }
      },
      onDelete: async (roleId) => {
        if (onRoleDelete) {
          const success = await onRoleDelete(roleId);
          if (success) {
            // Update local state
            currentRoles = currentRoles.filter(r => r.id !== roleId);
            // Re-render list
            roleList.setRoles(currentRoles);
          }
        }
      },
      onClose: () => {}
    });
    modal.show();
  };

  // Create header
  const headerWrapper = document.createElement('div');
  headerWrapper.className = 'home__header';

  const header = document.createElement('div');
  header.className = 'home__header-content';

  const logo = document.createElement('div');
  logo.className = 'home__logo';
  logo.innerHTML = `
    <span class="home__logo-text">Agentique</span>
  `;
  header.appendChild(logo);

  const settingsButton = document.createElement('button');
  settingsButton.className = 'home__settings-button';
  settingsButton.setAttribute('aria-label', 'Settings');
  settingsButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  `;
  settingsButton.addEventListener('click', () => {
    if (onSettingsClick) onSettingsClick();
  });
  header.appendChild(settingsButton);

  headerWrapper.appendChild(header);
  screenElement.appendChild(headerWrapper);

  // Create content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'home__content';

  // Create role list
  const roleList = createRoleList({
    roles: currentRoles,
    onRoleClick: (roleId) => {
      const role = currentRoles.find(r => r.id === roleId);
      if (role) {
        openRoleEditor(role);
      }
    },
    onRoleEdit: (roleId) => {
      const role = currentRoles.find(r => r.id === roleId);
      if (role) {
        openRoleEditor(role);
      }
    },
    onRoleDelete: async (roleId) => {
      if (confirm('Are you sure you want to delete this role?')) {
        if (onRoleDelete) {
          const success = await onRoleDelete(roleId);
          if (success) {
            currentRoles = currentRoles.filter(r => r.id !== roleId);
            roleList.setRoles(currentRoles);
          }
        }
      }
    },
    onAddRole: () => {
      openRoleEditor(null);
    }
  });

  contentWrapper.appendChild(roleList.element);
  screenElement.appendChild(contentWrapper);

  // Public API
  return {
    element: screenElement,

    getRoleList() {
      return roleList;
    },

    setRoles(newRoles) {
      currentRoles = [...newRoles];
      roleList.setRoles(currentRoles);
    },

    addRole(role) {
      currentRoles.push(role);
      roleList.setRoles(currentRoles);
    },

    updateRole(roleId, updates) {
      const index = currentRoles.findIndex(r => r.id === roleId);
      if (index >= 0) {
        currentRoles[index] = { ...currentRoles[index], ...updates };
        roleList.setRoles(currentRoles);
      }
    },

    removeRole(roleId) {
      currentRoles = currentRoles.filter(r => r.id !== roleId);
      roleList.setRoles(currentRoles);
    },

    openRoleEditor(role = null) {
      openRoleEditor(role);
    }
  };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createHome };
}
