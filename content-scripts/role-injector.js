/**
 * Agentique Role Injector
 * Injects role context into AI chat interfaces
 * Supported platforms: ChatGPT, Claude, Gemini, Grok
 */

// Platform detection and configuration
const PLATFORMS = {
  CHATGPT: {
    name: 'ChatGPT',
    hostPatterns: ['chat.openai.com', 'chatgpt.com'],
    selectors: {
      promptInput: '#prompt-textarea, textarea[data-id], div[contenteditable="true"][data-testid="textbox"]',
      inputContainer: 'main'
    },
    isContentEditable: true
  },
  CLAUDE: {
    name: 'Claude',
    hostPatterns: ['claude.ai'],
    selectors: {
      promptInput: 'div[contenteditable="true"][data-placeholder*="message"], div.ProseMirror[contenteditable="true"]',
      inputContainer: 'div[class*="InputContainer"], fieldset'
    },
    isContentEditable: true
  },
  GEMINI: {
    name: 'Gemini',
    hostPatterns: ['gemini.google.com'],
    selectors: {
      promptInput: 'div[contenteditable="true"].ql-editor, rich-textarea[class*="input-area"]',
      inputContainer: 'div[class*="input-area-container"]'
    },
    isContentEditable: true
  },
  GROK: {
    name: 'Grok',
    hostPatterns: ['grok.com', 'x.com', 'twitter.com'],
    selectors: {
      promptInput: 'textarea[placeholder*="Ask" i], textarea[placeholder*="message" i], textarea[class*="input"], textarea[data-testid*="input"], div[contenteditable="true"], textarea',
      inputContainer: 'div.query-bar, form, main'
    },
    isContentEditable: false
  }
};

// Global state
let currentPlatform = null;
let injectionButton = null;
let promptElement = null;
let roles = [];
let observerActive = false;

/**
 * Detect current platform
 */
function detectPlatform() {
  const hostname = window.location.hostname;

  for (const [, platform] of Object.entries(PLATFORMS)) {
    if (platform.hostPatterns.some(pattern => hostname.includes(pattern))) {
      return platform;
    }
  }

  return null;
}

/**
 * Find the prompt input element
 */
function findPromptElement(platform) {
  if (!platform) return null;
  return document.querySelector(platform.selectors.promptInput);
}

/**
 * Get prompt element value
 */
function getPromptValue() {
  if (!promptElement) return '';

  if (currentPlatform.isContentEditable) {
    return promptElement.textContent || '';
  } else {
    return promptElement.value || '';
  }
}

/**
 * Set prompt element value
 */
function setPromptValue(text) {
  if (!promptElement) return;

  const currentText = getPromptValue();
  const separator = currentText.trim() ? '\n\n' : '';
  const combinedText = currentText + separator + text;

  if (currentPlatform.isContentEditable) {
    // For contenteditable, convert newlines to proper HTML
    // Use <p> tags for paragraphs (double newlines) and <br> for single newlines
    const htmlContent = combinedText
      .split('\n\n')
      .map(paragraph => {
        // Convert single newlines within paragraphs to <br>
        const withBreaks = paragraph.split('\n').join('<br>');
        return `<p>${withBreaks}</p>`;
      })
      .join('');

    promptElement.innerHTML = htmlContent;

    const event = new Event('input', { bubbles: true });
    promptElement.dispatchEvent(event);

    // Place cursor at end
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(promptElement);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    promptElement.focus();
  } else {
    promptElement.value = combinedText;
    promptElement.dispatchEvent(new Event('input', { bubbles: true }));
    promptElement.dispatchEvent(new Event('change', { bubbles: true }));
    promptElement.focus();
    promptElement.setSelectionRange(combinedText.length, combinedText.length);
  }
}

/**
 * Format role for injection
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
 * Create the injection button
 */
function createInjectionButton() {
  const button = document.createElement('button');
  button.id = 'agentique-inject-button';
  button.className = 'agentique-inject-button';
  button.textContent = 'Inject a Role';
  button.setAttribute('aria-label', 'Inject a role context');
  button.setAttribute('type', 'button');

  button.addEventListener('click', handleInjectionClick);

  return button;
}

/**
 * Show the injection button
 */
function showInjectionButton() {
  if (injectionButton || !promptElement) return;

  injectionButton = createInjectionButton();

  // Create wrapper for positioning
  const wrapper = document.createElement('div');
  wrapper.className = 'agentique-button-wrapper';
  wrapper.appendChild(injectionButton);

  // Try to position near the input
  const formElement = promptElement.closest('form');
  if (formElement && formElement.parentElement) {
    formElement.parentElement.insertBefore(wrapper, formElement);
  } else if (promptElement.parentElement) {
    promptElement.parentElement.insertBefore(wrapper, promptElement);
  }

  injectionButton._wrapper = wrapper;
}

/**
 * Hide the injection button
 */
function hideInjectionButton() {
  if (injectionButton && injectionButton._wrapper) {
    injectionButton._wrapper.remove();
  }
  injectionButton = null;
}

/**
 * Show role selection dropdown
 */
function showRoleDropdown() {
  if (roles.length === 0) {
    alert('No roles configured. Create roles in the Agentique extension popup.');
    return;
  }

  // Remove existing dropdown
  const existingDropdown = document.getElementById('agentique-role-dropdown');
  if (existingDropdown) {
    existingDropdown.remove();
  }

  // Create dropdown
  const dropdown = document.createElement('div');
  dropdown.id = 'agentique-role-dropdown';
  dropdown.className = 'agentique-dropdown';

  // Group roles by area
  const rolesByArea = {};
  const rolesWithoutArea = [];

  roles.forEach(role => {
    if (role.area) {
      if (!rolesByArea[role.area]) {
        rolesByArea[role.area] = [];
      }
      rolesByArea[role.area].push(role);
    } else {
      rolesWithoutArea.push(role);
    }
  });

  // Render roles without area
  rolesWithoutArea.forEach(role => {
    const item = createDropdownItem(role);
    dropdown.appendChild(item);
  });

  // Render grouped roles
  const sortedAreas = Object.keys(rolesByArea).sort();
  sortedAreas.forEach(area => {
    const areaHeader = document.createElement('div');
    areaHeader.className = 'agentique-dropdown__area';
    areaHeader.textContent = area;
    dropdown.appendChild(areaHeader);

    rolesByArea[area].forEach(role => {
      const item = createDropdownItem(role);
      dropdown.appendChild(item);
    });
  });

  // Position dropdown
  const wrapper = injectionButton._wrapper;
  if (wrapper) {
    wrapper.style.position = 'relative';
    dropdown.style.position = 'absolute';
    dropdown.style.bottom = 'calc(100% + 8px)';
    dropdown.style.right = '0';
    wrapper.appendChild(dropdown);
  }

  // Show with animation
  setTimeout(() => dropdown.classList.add('agentique-dropdown--open'), 10);

  // Close on outside click
  const closeDropdown = (e) => {
    if (!dropdown.contains(e.target) && !injectionButton.contains(e.target)) {
      dropdown.classList.remove('agentique-dropdown--open');
      setTimeout(() => dropdown.remove(), 200);
      document.removeEventListener('click', closeDropdown);
    }
  };
  setTimeout(() => document.addEventListener('click', closeDropdown), 100);
}

/**
 * Create dropdown item for a role
 */
function createDropdownItem(role) {
  const item = document.createElement('div');
  item.className = 'agentique-dropdown__item';
  item.textContent = role.name;
  item.addEventListener('click', () => {
    injectRole(role);
    // Close dropdown
    const dropdown = document.getElementById('agentique-role-dropdown');
    if (dropdown) {
      dropdown.classList.remove('agentique-dropdown--open');
      setTimeout(() => dropdown.remove(), 200);
    }
  });
  return item;
}

/**
 * Inject a role into the chat
 */
function injectRole(role) {
  const formattedText = formatRoleForInjection(role);
  setPromptValue(formattedText);
  console.log('[Agentique] Injected role:', role.name);
}

/**
 * Handle injection button click
 */
function handleInjectionClick(event) {
  event.stopPropagation();
  showRoleDropdown();
}

/**
 * Load roles from storage
 */
async function loadRoles() {
  try {
    const result = await chrome.storage.sync.get('agentique_roles');
    roles = result.agentique_roles || [];
    console.log('[Agentique] Loaded', roles.length, 'roles');

    // Try local storage as fallback
    if (roles.length === 0) {
      const localResult = await chrome.storage.local.get('agentique_roles');
      roles = localResult.agentique_roles || [];
    }
  } catch (error) {
    console.error('[Agentique] Failed to load roles:', error);
    roles = [];
  }
}

/**
 * Initialize the injector
 */
async function initializeInjector() {
  // Detect platform
  currentPlatform = detectPlatform();
  if (!currentPlatform) {
    console.log('[Agentique] Platform not supported');
    return;
  }

  console.log('[Agentique] Detected platform:', currentPlatform.name);

  // Load roles
  await loadRoles();

  // Wait for prompt element
  const waitForPrompt = setInterval(() => {
    promptElement = findPromptElement(currentPlatform);

    if (promptElement) {
      clearInterval(waitForPrompt);
      console.log('[Agentique] Found prompt element');

      // Show button if we have roles
      if (roles.length > 0) {
        showInjectionButton();
      }

      // Setup monitoring
      setupMonitoring();
    }
  }, 1000);

  // Stop after 30 seconds
  setTimeout(() => clearInterval(waitForPrompt), 30000);
}

/**
 * Setup monitoring for URL changes and storage updates
 */
function setupMonitoring() {
  if (observerActive) return;

  // Monitor URL changes
  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      hideInjectionButton();
      promptElement = null;
      observerActive = false;
      setTimeout(initializeInjector, 1000);
    }
  });

  urlObserver.observe(document.body, { childList: true, subtree: true });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (changes.agentique_roles) {
      roles = changes.agentique_roles.newValue || [];
      console.log('[Agentique] Roles updated:', roles.length);

      if (roles.length > 0 && !injectionButton) {
        showInjectionButton();
      } else if (roles.length === 0 && injectionButton) {
        hideInjectionButton();
      }
    }
  });

  observerActive = true;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeInjector);
} else {
  initializeInjector();
}
