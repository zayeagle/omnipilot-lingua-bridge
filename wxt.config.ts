import { defineConfig } from 'wxt';

export default defineConfig({
  modules: [],
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      // Keep building popup.html for the in-page iframe, but use action.onClicked.
      if (manifest.action) {
        delete manifest.action.default_popup;
      }
    },
  },
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    // version comes from package.json (WXT default)
    permissions: ['storage', 'activeTab', 'scripting'],
    host_permissions: ['<all_urls>'],
    web_accessible_resources: [
      {
        resources: [
          'popup.html',
          'options.html',
          'assets/*',
          'chunks/*',
          'icon-16.png',
          'icon-32.png',
          'icon-48.png',
          'icon-96.png',
          'icon-128.png',
          'icon.png',
        ],
        matches: ['<all_urls>'],
      },
    ],
    icons: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      96: 'icon-96.png',
      128: 'icon-128.png',
    },
    action: {
      default_title: '__MSG_actionTitle__',
      default_icon: {
        16: 'icon-16.png',
        32: 'icon-32.png',
        48: 'icon-48.png',
      },
    },
    browser_specific_settings: {
      gecko: {
        id: 'lingua-bridge@omnipilot.local',
        strict_min_version: '109.0',
      },
    },
  },
});
