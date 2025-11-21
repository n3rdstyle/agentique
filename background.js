/**
 * Agentique Background Service Worker
 * Minimal background script for the extension
 */

console.log('[Agentique] Background service worker started');

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Agentique] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // First install - could show onboarding page
    console.log('[Agentique] First install - welcome!');
  } else if (details.reason === 'update') {
    console.log('[Agentique] Extension updated from', details.previousVersion);
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Agentique] Message received:', message);

  if (message.type === 'GET_ROLES') {
    // Get roles from storage
    chrome.storage.sync.get('agentique_roles', (result) => {
      sendResponse({ roles: result.agentique_roles || [] });
    });
    return true; // Keep channel open for async response
  }

  return false;
});
