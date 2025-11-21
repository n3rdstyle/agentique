/**
 * Role List Component
 * Displays a list of role cards with add functionality
 */

function createRoleList(options = {}) {
  const {
    roles = [],
    onRoleClick = null,
    onRoleEdit = null,
    onRoleDelete = null,
    onAddRole = null
  } = options;

  // Create container
  const container = document.createElement('div');
  container.className = 'role-list';

  // Create header
  const header = document.createElement('div');
  header.className = 'role-list__header';

  const title = document.createElement('h2');
  title.className = 'role-list__title';
  title.textContent = 'My Roles';
  header.appendChild(title);

  // Add button
  const addButton = document.createElement('button');
  addButton.className = 'role-list__add-button';
  addButton.setAttribute('aria-label', 'Add new role');
  addButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
    <span>Add Role</span>
  `;
  addButton.addEventListener('click', () => {
    if (onAddRole) onAddRole();
  });
  header.appendChild(addButton);

  container.appendChild(header);

  // Create cards container
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'role-list__cards';
  container.appendChild(cardsContainer);

  // Track card instances
  const cardInstances = new Map();

  /**
   * Render all roles
   */
  function renderRoles(rolesToRender) {
    cardsContainer.innerHTML = '';
    cardInstances.clear();

    if (rolesToRender.length === 0) {
      // Show empty state
      const emptyState = document.createElement('div');
      emptyState.className = 'role-list__empty';
      emptyState.innerHTML = `
        <p class="role-list__empty-text">No roles yet</p>
        <p class="role-list__empty-hint">Create your first role to get started</p>
      `;
      cardsContainer.appendChild(emptyState);
      return;
    }

    // Group roles by area
    const rolesByArea = {};
    const rolesWithoutArea = [];

    rolesToRender.forEach(role => {
      if (role.area) {
        if (!rolesByArea[role.area]) {
          rolesByArea[role.area] = [];
        }
        rolesByArea[role.area].push(role);
      } else {
        rolesWithoutArea.push(role);
      }
    });

    // Render roles without area first
    rolesWithoutArea.forEach(role => {
      const card = createRoleCard({
        id: role.id,
        name: role.name,
        area: role.area,
        description: role.description,
        onClick: onRoleClick,
        onEdit: onRoleEdit,
        onDelete: onRoleDelete
      });
      cardInstances.set(role.id, card);
      cardsContainer.appendChild(card.element);
    });

    // Render grouped roles by area
    const sortedAreas = Object.keys(rolesByArea).sort();
    sortedAreas.forEach(area => {
      // Area header
      const areaHeader = document.createElement('div');
      areaHeader.className = 'role-list__area-header';
      areaHeader.textContent = area;
      cardsContainer.appendChild(areaHeader);

      // Roles in this area
      rolesByArea[area].forEach(role => {
        const card = createRoleCard({
          id: role.id,
          name: role.name,
          area: '', // Don't show area badge when grouped
          description: role.description,
          onClick: onRoleClick,
          onEdit: onRoleEdit,
          onDelete: onRoleDelete
        });
        cardInstances.set(role.id, card);
        cardsContainer.appendChild(card.element);
      });
    });
  }

  // Initial render
  renderRoles(roles);

  // Public API
  return {
    element: container,
    setRoles: (newRoles) => {
      renderRoles(newRoles);
    },
    addRole: (role) => {
      const allRoles = [...cardInstances.keys()].map(id => {
        const card = cardInstances.get(id);
        return { id, name: card.getName(), area: card.getArea() };
      });
      allRoles.push(role);
      renderRoles(allRoles);
    },
    removeRole: (roleId) => {
      const card = cardInstances.get(roleId);
      if (card) {
        card.element.remove();
        cardInstances.delete(roleId);
      }
      // Check if empty
      if (cardInstances.size === 0) {
        renderRoles([]);
      }
    },
    updateRole: (roleId, updates) => {
      const card = cardInstances.get(roleId);
      if (card) {
        if (updates.name !== undefined) card.setName(updates.name);
        if (updates.area !== undefined) card.setArea(updates.area);
        if (updates.description !== undefined) card.setDescription(updates.description);
      }
    },
    getCardCount: () => cardInstances.size
  };
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createRoleList };
}
