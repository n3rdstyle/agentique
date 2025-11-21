/**
 * Role Card Component
 * Displays a role with name, area, and description preview
 */

function createRoleCard(options = {}) {
  const {
    id = null,
    name = 'Untitled Role',
    area = '',
    description = '',
    onClick = null,
    onEdit = null,
    onDelete = null
  } = options;

  // Create card element
  const card = document.createElement('div');
  card.className = 'role-card';
  if (id) {
    card.setAttribute('data-role-id', id);
  }

  // Create content container
  const content = document.createElement('div');
  content.className = 'role-card__content';

  // Create text container
  const textContainer = document.createElement('div');
  textContainer.className = 'role-card__text-container';

  // Create header (name + area)
  const header = document.createElement('div');
  header.className = 'role-card__header';

  // Name
  const nameElement = document.createElement('h3');
  nameElement.className = 'role-card__name';
  nameElement.textContent = name;
  header.appendChild(nameElement);

  // Area badge (if present)
  if (area) {
    const areaBadge = document.createElement('span');
    areaBadge.className = 'role-card__area';
    areaBadge.textContent = area;
    header.appendChild(areaBadge);
  }

  textContainer.appendChild(header);

  // Description preview
  if (description) {
    const descElement = document.createElement('p');
    descElement.className = 'role-card__description';
    // Truncate description for preview
    const maxLength = 100;
    descElement.textContent = description.length > maxLength
      ? description.substring(0, maxLength) + '...'
      : description;
    textContainer.appendChild(descElement);
  }

  content.appendChild(textContainer);

  // Create actions container
  const actions = document.createElement('div');
  actions.className = 'role-card__actions';

  // Edit button
  const editButton = document.createElement('button');
  editButton.className = 'role-card__icon-button';
  editButton.setAttribute('aria-label', 'Edit role');
  editButton.innerHTML = typeof getIcon === 'function' ? getIcon('edit') : `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  `;
  editButton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(id);
  });
  actions.appendChild(editButton);

  // Delete button
  const deleteButton = document.createElement('button');
  deleteButton.className = 'role-card__icon-button role-card__icon-button--delete';
  deleteButton.setAttribute('aria-label', 'Delete role');
  deleteButton.innerHTML = typeof getIcon === 'function' ? getIcon('trash') : `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  `;
  deleteButton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(id);
  });
  actions.appendChild(deleteButton);

  content.appendChild(actions);
  card.appendChild(content);

  // Card click handler
  card.addEventListener('click', () => {
    if (onClick) onClick(id);
  });

  // Public API
  return {
    element: card,
    getId: () => id,
    getName: () => name,
    getArea: () => area,
    setName: (newName) => {
      nameElement.textContent = newName;
    },
    setArea: (newArea) => {
      const existingBadge = header.querySelector('.role-card__area');
      if (newArea) {
        if (existingBadge) {
          existingBadge.textContent = newArea;
        } else {
          const areaBadge = document.createElement('span');
          areaBadge.className = 'role-card__area';
          areaBadge.textContent = newArea;
          header.appendChild(areaBadge);
        }
      } else if (existingBadge) {
        existingBadge.remove();
      }
    },
    setDescription: (newDesc) => {
      let descElement = textContainer.querySelector('.role-card__description');
      if (newDesc) {
        const maxLength = 100;
        const truncated = newDesc.length > maxLength
          ? newDesc.substring(0, maxLength) + '...'
          : newDesc;
        if (descElement) {
          descElement.textContent = truncated;
        } else {
          descElement = document.createElement('p');
          descElement.className = 'role-card__description';
          descElement.textContent = truncated;
          textContainer.appendChild(descElement);
        }
      } else if (descElement) {
        descElement.remove();
      }
    }
  };
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createRoleCard };
}
