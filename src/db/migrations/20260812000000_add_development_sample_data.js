const DEVELOPMENT_CLIENT_NAMES = [
  'Northstar Health [DEV]',
  'Atlas Logistics [DEV]',
  'Lumen Studio [DEV]',
];

const CLIENTS = [
  {
    name: DEVELOPMENT_CLIENT_NAMES[0],
    hourly_rate: 145,
    currency: 'PLN',
    monthly_hours: 120,
    daily_hours: 6,
  },
  {
    name: DEVELOPMENT_CLIENT_NAMES[1],
    hourly_rate: 175,
    currency: 'PLN',
    monthly_hours: 80,
    daily_hours: 4,
  },
  {
    name: DEVELOPMENT_CLIENT_NAMES[2],
    hourly_rate: 95,
    currency: 'EUR',
    monthly_hours: 40,
    daily_hours: 2,
  },
];

const PREVIOUS_HOURLY_RATES = [130, 160, 85];

const PROJECTS = [
  {key: 'portal', client: 0, name: 'Patient Portal'},
  {key: 'mobile', client: 0, name: 'Mobile App'},
  {key: 'operations', client: 1, name: 'Operations Dashboard'},
  {key: 'api', client: 1, name: 'API Modernization'},
  {key: 'website', client: 2, name: 'Marketing Website'},
];

const TASKS = [
  [
    'portal',
    'Appointment booking flow',
    720,
    'Self-service',
    'feature',
    0,
    'large',
  ],
  ['portal', 'Accessibility audit fixes', 300, 'Quality', 'fix', 0, 'medium'],
  [
    'portal',
    'Insurance details form',
    240,
    'Patient profile',
    'ui',
    0,
    'medium',
  ],
  [
    'mobile',
    'Push notification settings',
    360,
    'Engagement',
    'feature',
    0,
    'medium',
  ],
  [
    'mobile',
    'Investigate offline sync',
    180,
    'Reliability',
    'integration',
    1,
    'small',
  ],
  [
    'mobile',
    'App startup performance',
    300,
    'Performance',
    'refactor',
    0,
    'medium',
  ],
  [
    'operations',
    'Weekly delivery report',
    480,
    'Reporting',
    'feature',
    0,
    'large',
  ],
  ['operations', 'Shipment status filters', 210, 'Tracking', 'ui', 0, 'small'],
  [
    'operations',
    'Export results to CSV',
    180,
    'Reporting',
    'feature',
    0,
    'small',
  ],
  [
    'api',
    'Replace legacy auth tokens',
    600,
    'Platform',
    'integration',
    0,
    'large',
  ],
  ['api', 'Retry failed webhooks', 300, 'Reliability', 'fix', 0, 'medium'],
  [
    'api',
    'Document partner endpoints',
    240,
    'Developer experience',
    'config',
    0,
    'medium',
  ],
  ['website', 'Case studies landing page', 360, 'Content', 'ui', 0, 'medium'],
  [
    'website',
    'Improve contact form',
    150,
    'Lead generation',
    'fix',
    0,
    'small',
  ],
  [
    'website',
    'Analytics event cleanup',
    180,
    'Analytics',
    'refactor',
    0,
    'small',
  ],
];

const DAY_SCHEDULE = [
  [7, 30, 95],
  [9, 20, 110],
  [11, 45, 80],
  [13, 35, 125],
];

const isDevelopment = () => process.env.ENV === 'development';

const getRecentWorkingDays = count => {
  const days = [];
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  day.setUTCDate(day.getUTCDate() - 1);

  while (days.length < count) {
    if (day.getUTCDay() !== 0 && day.getUTCDay() !== 6)
      days.unshift(new Date(day));
    day.setUTCDate(day.getUTCDate() - 1);
  }

  return days;
};

const atTime = (day, hour, minute) => {
  const value = new Date(day);
  value.setUTCHours(hour, minute, 0, 0);
  return value;
};

const addMinutes = (date, minutes) =>
  new Date(date.getTime() + minutes * 60 * 1000);

const toDate = date => date.toISOString().slice(0, 10);

const up = async knex => {
  if (!isDevelopment()) return;

  const existing = await knex('client')
    .whereIn('name', DEVELOPMENT_CLIENT_NAMES)
    .first();
  if (existing) return;

  const clientIds = [];
  for (const client of CLIENTS) {
    const [id] = await knex('client').insert(client);
    clientIds.push(id);
  }

  const workingDays = getRecentWorkingDays(15);
  const firstDay = toDate(workingDays[0]);
  const rateHistory = clientIds.flatMap((clientId, index) => [
    {
      client_id: clientId,
      hourly_rate: PREVIOUS_HOURLY_RATES[index],
      currency: CLIENTS[index].currency,
      effective_from: toDate(
        new Date(workingDays[0].getTime() - 180 * 24 * 60 * 60 * 1000),
      ),
    },
    {
      client_id: clientId,
      hourly_rate: CLIENTS[index].hourly_rate,
      currency: CLIENTS[index].currency,
      effective_from: firstDay,
    },
  ]);
  await knex('client_rate_history').insert(rateHistory);

  const projectIds = {};
  for (const project of PROJECTS) {
    const [id] = await knex('project').insert({
      name: project.name,
      client_id: clientIds[project.client],
    });
    projectIds[project.key] = id;
  }

  const taskIds = [];
  for (const [
    project,
    title,
    estimated_minutes,
    epic,
    category,
    is_exploration,
    scope,
  ] of TASKS) {
    const [id] = await knex('task').insert({
      project_id: projectIds[project],
      title,
      estimated_minutes,
      epic,
      category,
      is_exploration,
      scope,
    });
    taskIds.push(id);
  }

  const timeEntries = workingDays.flatMap((day, dayIndex) =>
    DAY_SCHEDULE.map(([hour, minute, duration], sessionIndex) => {
      const start = atTime(day, hour, minute);
      return {
        task_id: taskIds[(dayIndex * 3 + sessionIndex * 4) % taskIds.length],
        start,
        end: addMinutes(start, duration),
      };
    }),
  );
  await knex('time_entry').insert(timeEntries);

  const insertedEntries = (
    await knex('time_entry')
      .whereIn('task_id', taskIds)
      .orderBy('start', 'desc')
      .limit(8)
  ).reverse();
  await knex('pomodoro_session').insert(
    insertedEntries.map((entry, index) => {
      const isLongBreak = index % 4 === 3;
      const workEnded = addMinutes(new Date(entry.start), 25);
      const breakEnded = addMinutes(workEnded, isLongBreak ? 15 : 5);
      return {
        task_id: entry.task_id,
        time_entry_id: entry.id,
        status: 'completed',
        session_number: (index % 4) + 1,
        break_type: isLongBreak ? 'long' : 'short',
        work_started_at: entry.start,
        work_ends_at: workEnded,
        work_ended_at: workEnded,
        break_started_at: workEnded,
        break_ends_at: breakEnded,
        break_ended_at: breakEnded,
      };
    }),
  );

  await knex('synced_day').insert(
    clientIds.map((clientId, index) => ({
      day: toDate(workingDays[index]),
      client_id: clientId,
      synced: true,
      synced_at: addMinutes(workingDays[index], 18 * 60),
    })),
  );
};

const down = async knex => {
  if (!isDevelopment()) return;
  await knex('client').whereIn('name', DEVELOPMENT_CLIENT_NAMES).del();
};

export {up, down};
