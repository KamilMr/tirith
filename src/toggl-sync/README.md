# Toggl Sync Module

This module syncs tasks from the Tirith database to Toggl Track.

## Configuration

Add the following to your `.env` file:

```env
TOGGL_API_TOKEN=your_api_token_here
TOGGL_WORKSPACE_ID=your_workspace_id_here
```

### Getting Your Toggl API Token

1. Go to https://track.toggl.com/profile
2. Scroll down to "API Token" section
3. Copy your API token

### Getting Your Workspace ID

1. Go to https://track.toggl.com/
2. Click on your workspace name
3. Look at the URL: `https://track.toggl.com/WORKSPACE_ID/...`
4. The number is your workspace ID

## Usage

### Basic Usage

```javascript
import createTogglSync from './toggl-sync/index.js';
import dotenv from 'dotenv';

dotenv.config();

const togglSync = createTogglSync(
  process.env.TOGGL_API_TOKEN,
  process.env.TOGGL_WORKSPACE_ID,
);

// Sync all tasks from today
const results = await togglSync.syncTasksByDate(new Date());
console.log(results);

// Sync tasks from specific date
const results = await togglSync.syncTasksByDate('2025-10-01');
console.log(results);
```

### Sync Tasks by Project

```javascript
// Sync tasks for specific project and date
const projectId = 1;
const date = '2025-10-01';
const results = await togglSync.syncTasksByProject(projectId, date);
console.log(results);
```

### Project Mapping

To map your local project IDs to Toggl project IDs:

```javascript
const projectMapping = {
  1: 123456789, // Local project ID 1 -> Toggl project ID 123456789
  2: 987654321, // Local project ID 2 -> Toggl project ID 987654321
};

const togglSync = createTogglSync(
  process.env.TOGGL_API_TOKEN,
  process.env.TOGGL_WORKSPACE_ID,
  projectMapping,
);

// Or update mapping later
togglSync.setProjectMapping(projectMapping);
```

### Get Toggl Projects

```javascript
const projects = await togglSync.getTogglProjects();
console.log(projects);
```

## API

### `createTogglSync(apiToken, workspaceId, projectMapping)`

Creates a new sync service instance.

**Parameters:**

- `apiToken` (string): Your Toggl API token
- `workspaceId` (string|number): Your Toggl workspace ID
- `projectMapping` (object, optional): Map of local project IDs to Toggl project IDs

### `syncTasksByDate(date, projectId)`

Syncs tasks for a specific date.

**Parameters:**

- `date` (Date|string): Date to sync (format: 'YYYY-MM-DD' or Date object)
- `projectId` (number, optional): Filter by specific project ID

**Returns:** Array of results with `{success, task, timeEntry|error}`

### `syncTasksByProject(projectId, date)`

Syncs tasks for a specific project and date.

**Parameters:**

- `projectId` (number): Project ID to sync
- `date` (Date|string): Date to sync

**Returns:** Array of results with `{success, task, timeEntry|error}`

### `setProjectMapping(mapping)`

Updates the project ID mapping.

**Parameters:**

- `mapping` (object): Map of local project IDs to Toggl project IDs

### `getTogglProjects()`

Fetches all projects from Toggl workspace.

**Returns:** Array of Toggl projects

## Example Script

```javascript
import createTogglSync from './toggl-sync/index.js';
import dotenv from 'dotenv';

dotenv.config();

const main = async () => {
  const togglSync = createTogglSync(
    process.env.TOGGL_API_TOKEN,
    process.env.TOGGL_WORKSPACE_ID,
  );

  // Sync today's tasks
  const today = new Date();
  const results = await togglSync.syncTasksByDate(today);

  console.log(`Synced ${results.length} tasks`);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Successful: ${successful}, Failed: ${failed}`);

  if (failed > 0) {
    console.log('Failed tasks:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`- ${r.task.title}: ${r.error}`);
      });
  }
};

main().catch(console.error);
```

## Notes

- Only completed tasks (with both start and end times) are synced
- Tasks are synced as time entries in Toggl
- The module uses the native Node.js `https` module (no external dependencies)
- Duration is calculated automatically from start/end times
