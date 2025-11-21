/**
 * Home Screen
 * Displays role list with add/edit/delete functionality
 * Requires: header.js, role-list.js, role-card.js, role-editor-modal.js, overlay.js
 */

function createHome(options = {}) {
  const {
    roles = [],
    onRoleSave = null,
    onRoleDelete = null
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
