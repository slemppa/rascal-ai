// src/services/mixpostApi.js
class MixpostAPI {
    constructor() {
      this.rascalBaseUrl = import.meta.env.VITE_MIXPOST_RASCAL_API_URL || 'https://mixpost.mak8r.fi';
      this.mixpostBaseUrl = (import.meta.env.VITE_MIXPOST_API_URL || 'https://mixpost.mak8r.fi') + '/mixpost';
    }
  
    async createUserWithWorkspace(userData) {
      const response = await fetch(`${this.rascalBaseUrl}/users-with-workspace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      return response.json();
    }
  
    async getUserWorkspaces(email) {
      const response = await fetch(`${this.rascalBaseUrl}/users/${email}/workspaces`, {
        headers: { 'Accept': 'application/json' }
      });
      return response.json();
    }
  
    async getSocialAccounts(workspaceUuid, apiToken) {
      const response = await fetch(`${this.mixpostBaseUrl}/${workspaceUuid}/accounts`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      });
      return response.json();
    }
  
    async publishContent(workspaceUuid, apiToken, content, accountIds, scheduleTime = null) {
      const postData = {
        content: content,
        account_ids: accountIds,
        ...(scheduleTime && { scheduled_at: scheduleTime })
      };
  
      const response = await fetch(`${this.mixpostBaseUrl}/${workspaceUuid}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(postData)
      });
      return response.json();
    }
  }
  
  export default new MixpostAPI();