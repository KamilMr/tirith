# Rename: task-tracker → Tirith

## package.json

- [ ] Line 2: `"name": "task-tracker"` → `"tirith"`
- [ ] Line 4: `"description": "Simple task-tracker for Nodejs"` → update description
- [ ] Line 5: `"homepage"` — GitHub URL (depends on repo rename)
- [ ] Line 27: `"url"` — Git SSH URL (depends on repo rename)
- [ ] Line 30: `"task-tracker"` keyword → `"tirith"`
- [ ] Line 35: `"bugs"` — GitHub URL (depends on repo rename)

## Docker Compose

- [ ] `docker-compose.yml` line 9: volume `~/data/task-tracker-prod/mysql` → `~/data/tirith-prod/mysql`
- [ ] `docker-compose.yml` line 42: image `kamilmrowka/task-tracker:latest` → `kamilmrowka/tirith:latest`
- [ ] `docker-compose.yml` line 55: service name `tasktracker` → `tirith`
- [ ] `docker-compose.dev.yml` line 9: volume `~/data/task-tracker-dev/mysql` → `~/data/tirith-dev/mysql`
- [ ] `docker-compose.dev.yml` line 54: service name `tasktracker` → `tirith`

## Scripts

- [ ] `scripts/start.sh` line 7-8: references to `tasktracker` service → `tirith`
- [ ] `scripts/push-docker.sh` lines 8-10: `task-tracker` in Docker image tags → `tirith`

## Source Code

- [ ] `src/toggl-sync/togglClient.js` line 17: `created_with: 'task-tracker'` → `'tirith'`

## Documentation

- [ ] `README.md` line 1: `# Task Tracker` → `# Tirith`
- [ ] `README.md` line 5: image reference `task-tracker.png` (if renaming asset)
- [ ] `src/toggl-sync/README.md` line 3: `task-tracker database` → `tirith database`

## Assets

- [ ] `assets/task-tracker.png` → rename to `assets/tirith.png` (optional)

## Environment

- [ ] `.env.example` line 15: `MYSQL_DATABASE=task_tracker_v1` → `tirith_v1` (optional, affects fresh setups only)
