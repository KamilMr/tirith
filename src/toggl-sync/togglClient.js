import https from 'https';

class TogglClient {
  constructor(apiToken, workspaceId) {
    this.apiToken = apiToken;
    this.workspaceId = workspaceId;
    this.baseUrl = 'api.track.toggl.com';
  }

  async createTimeEntry({projectId, description, start, stop, duration}) {
    const body = {
      workspace_id: parseInt(this.workspaceId),
      description,
      start,
      stop,
      duration,
      created_with: 'tirith',
    };

    if (projectId) body.project_id = parseInt(projectId);

    return this._makeRequest(
      'POST',
      `/api/v9/workspaces/${this.workspaceId}/time_entries`,
      body,
    );
  }

  async getProjects() {
    return this._makeRequest(
      'GET',
      `/api/v9/workspaces/${this.workspaceId}/projects`,
    );
  }

  _makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const auth = Buffer.from(`${this.apiToken}:api_token`).toString('base64');

      const options = {
        hostname: this.baseUrl,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
      };

      const req = https.request(options, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve(data);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', error => {
        reject(error);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }
}

export default TogglClient;
