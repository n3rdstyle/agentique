/**
 * Role Editor Modal Component
 * Modal for creating and editing roles
 * Fields: name, area, description, skills, tools, constraints, behavior, moreInfo
 */

function createRoleEditorModal(options = {}) {
  const {
    role = null, // Existing role to edit, or null for new
    existingAreas = [], // Suggestions for area field
    onSave = null,
    onDelete = null,
    onClose = null
  } = options;

  const isEditMode = role !== null;

  // Create modal overlay
  const overlay = createOverlay({
    blur: false,
    opacity: 'default',
    visible: false,
    onClick: () => {
      if (onClose) onClose();
      api.hide();
    }
  });

  // Create modal container
  const modalElement = document.createElement('div');
  modalElement.className = 'role-editor-modal';

  // Create header
  const header = document.createElement('div');
  header.className = 'role-editor-modal__header';

  const title = document.createElement('h2');
  title.className = 'role-editor-modal__title';
  title.textContent = isEditMode ? 'Edit Role' : 'New Role';
  header.appendChild(title);

  const closeButton = document.createElement('button');
  closeButton.className = 'role-editor-modal__close';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  `;
  closeButton.addEventListener('click', () => {
    if (onClose) onClose();
    api.hide();
  });
  header.appendChild(closeButton);

  modalElement.appendChild(header);

  // Create scrollable content
  const content = document.createElement('div');
  content.className = 'role-editor-modal__content';

  // Helper to create form field
  function createField(label, type, value, placeholder, options = {}) {
    const field = document.createElement('div');
    field.className = 'role-editor-modal__field';

    const labelElement = document.createElement('label');
    labelElement.className = 'role-editor-modal__label';
    labelElement.textContent = label;
    if (options.required) {
      const required = document.createElement('span');
      required.className = 'role-editor-modal__required';
      required.textContent = '*';
      labelElement.appendChild(required);
    }
    field.appendChild(labelElement);

    let input;
    if (type === 'textarea') {
      input = document.createElement('textarea');
      input.className = 'role-editor-modal__textarea';
      input.rows = options.rows || 3;
    } else if (type === 'list') {
      input = document.createElement('textarea');
      input.className = 'role-editor-modal__textarea role-editor-modal__textarea--list';
      input.rows = options.rows || 3;
      input.placeholder = placeholder + '\n(one per line)';
      // Convert array to newline-separated string
      if (Array.isArray(value)) {
        value = value.join('\n');
      }
    } else {
      input = document.createElement('input');
      input.className = 'role-editor-modal__input';
      input.type = 'text';
    }

    input.value = value || '';
    input.placeholder = placeholder || '';
    field.appendChild(input);

    // Auto-resize textarea on input
    if (type === 'textarea' || type === 'list') {
      const autoResize = () => {
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
      };
      input.addEventListener('input', autoResize);
      // Initial resize if there's pre-filled content
      if (value) {
        setTimeout(autoResize, 0);
      }
    }

    // Add datalist for suggestions if provided
    if (options.suggestions && options.suggestions.length > 0) {
      const datalistId = `datalist-${label.toLowerCase().replace(/\s/g, '-')}`;
      input.setAttribute('list', datalistId);

      const datalist = document.createElement('datalist');
      datalist.id = datalistId;
      options.suggestions.forEach(suggestion => {
        const option = document.createElement('option');
        option.value = suggestion;
        datalist.appendChild(option);
      });
      field.appendChild(datalist);
    }

    return { field, input };
  }

  // Helper to create dynamic list field (individual inputs with add/remove)
  function createDynamicListField(label, values, placeholder) {
    const field = document.createElement('div');
    field.className = 'role-editor-modal__field';

    const labelElement = document.createElement('label');
    labelElement.className = 'role-editor-modal__label';
    labelElement.textContent = label;
    field.appendChild(labelElement);

    const listContainer = document.createElement('div');
    listContainer.className = 'role-editor-modal__dynamic-list';

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'role-editor-modal__dynamic-list-items';
    listContainer.appendChild(itemsContainer);

    // Function to create a single list item
    function createListItem(value = '') {
      const item = document.createElement('div');
      item.className = 'role-editor-modal__dynamic-list-item';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'role-editor-modal__input';
      input.value = value;
      input.placeholder = placeholder;
      item.appendChild(input);

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'role-editor-modal__dynamic-list-remove';
      removeButton.setAttribute('aria-label', 'Remove');
      removeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      `;
      removeButton.addEventListener('click', () => {
        item.remove();
      });
      item.appendChild(removeButton);

      return item;
    }

    // Add initial items from values
    const initialValues = Array.isArray(values) ? values : [];
    initialValues.forEach(value => {
      if (value.trim()) {
        itemsContainer.appendChild(createListItem(value));
      }
    });

    // Add button
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'role-editor-modal__dynamic-list-add';
    addButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      <span>Add ${label.replace(/s$/, '')}</span>
    `;
    addButton.addEventListener('click', () => {
      const newItem = createListItem('');
      itemsContainer.appendChild(newItem);
      newItem.querySelector('input').focus();
    });
    listContainer.appendChild(addButton);

    field.appendChild(listContainer);

    // Method to get all values
    const getValues = () => {
      const inputs = itemsContainer.querySelectorAll('input');
      return Array.from(inputs)
        .map(input => input.value.trim())
        .filter(value => value.length > 0);
    };

    return { field, getValues };
  }

  // Create form fields
  const nameField = createField('Name', 'text', role?.name, 'e.g., Web Analyst', { required: true });
  const areaField = createField('Area', 'text', role?.area, 'e.g., Marketing, Development', { suggestions: existingAreas });
  const descriptionField = createField('Description', 'textarea', role?.description, 'Describe this role...', { rows: 3 });
  const skillsField = createDynamicListField('Skills', role?.skills, 'e.g., Data analysis');
  const toolsField = createDynamicListField('Tools', role?.tools, 'e.g., Google Analytics');
  const constraintsField = createDynamicListField('Constraints', role?.constraints, 'e.g., Only use verified data sources');
  const behaviorField = createField('Behavior & Tonality', 'textarea', role?.behavior, 'How should the AI behave in this role?', { rows: 3 });
  const moreInfoField = createField('Additional Information', 'textarea', role?.moreInfo, 'Any other relevant context...', { rows: 3 });

  // Add fields to content
  content.appendChild(nameField.field);
  content.appendChild(areaField.field);
  content.appendChild(descriptionField.field);
  content.appendChild(skillsField.field);
  content.appendChild(toolsField.field);
  content.appendChild(constraintsField.field);
  content.appendChild(behaviorField.field);
  content.appendChild(moreInfoField.field);

  modalElement.appendChild(content);

  // Create footer with buttons
  const footer = document.createElement('div');
  footer.className = 'role-editor-modal__footer';

  // Delete button (only in edit mode)
  if (isEditMode && onDelete) {
    const deleteButton = document.createElement('button');
    deleteButton.className = 'role-editor-modal__delete-button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this role?')) {
        onDelete(role.id);
        api.hide();
      }
    });
    footer.appendChild(deleteButton);
  }

  // Spacer
  const spacer = document.createElement('div');
  spacer.className = 'role-editor-modal__spacer';
  footer.appendChild(spacer);

  // Cancel button
  const cancelButton = document.createElement('button');
  cancelButton.className = 'role-editor-modal__cancel-button';
  cancelButton.textContent = 'Cancel';
  cancelButton.addEventListener('click', () => {
    if (onClose) onClose();
    api.hide();
  });
  footer.appendChild(cancelButton);

  // Save button
  const saveButton = document.createElement('button');
  saveButton.className = 'role-editor-modal__save-button';
  saveButton.textContent = 'Save';
  saveButton.addEventListener('click', () => {
    // Validate name
    const name = nameField.input.value.trim();
    if (!name) {
      nameField.input.focus();
      nameField.input.classList.add('role-editor-modal__input--error');
      return;
    }

    // Parse list fields (split by newlines)
    const parseList = (value) => {
      return value.split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    };

    const roleData = {
      id: role?.id,
      name: name,
      area: areaField.input.value.trim(),
      description: descriptionField.input.value.trim(),
      skills: skillsField.getValues(),
      tools: toolsField.getValues(),
      constraints: constraintsField.getValues(),
      behavior: behaviorField.input.value.trim(),
      moreInfo: moreInfoField.input.value.trim()
    };

    if (onSave) {
      onSave(roleData);
    }
    api.hide();
  });
  footer.appendChild(saveButton);

  modalElement.appendChild(footer);

  // Remove error class on input
  nameField.input.addEventListener('input', () => {
    nameField.input.classList.remove('role-editor-modal__input--error');
  });

  // Public API
  const api = {
    element: modalElement,
    overlay: overlay,
    show: () => {
      overlay.show();
      modalElement.classList.add('role-editor-modal--visible');
      document.body.appendChild(overlay.element);
      document.body.appendChild(modalElement);
      // Focus name field
      setTimeout(() => nameField.input.focus(), 100);
    },
    hide: () => {
      overlay.hide();
      modalElement.classList.remove('role-editor-modal--visible');
      setTimeout(() => {
        if (modalElement.parentNode) {
          modalElement.parentNode.removeChild(modalElement);
        }
        if (overlay.element.parentNode) {
          overlay.element.parentNode.removeChild(overlay.element);
        }
      }, 200);
    },
    getRole: () => ({
      id: role?.id,
      name: nameField.input.value.trim(),
      area: areaField.input.value.trim(),
      description: descriptionField.input.value.trim(),
      skills: skillsField.getValues(),
      tools: toolsField.getValues(),
      constraints: constraintsField.getValues(),
      behavior: behaviorField.input.value.trim(),
      moreInfo: moreInfoField.input.value.trim()
    })
  };

  return api;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createRoleEditorModal };
}
