const up = async knex => {
  await knex.schema.createTable('pomodoro_session', table => {
    table.increments('id').unsigned().primary();
    table.integer('task_id').unsigned().notNullable();
    table.integer('time_entry_id').unsigned().nullable();
    table.string('status', 20).notNullable();
    table.integer('session_number').unsigned().notNullable();
    table.string('break_type', 20).nullable();
    table.timestamp('work_started_at').nullable();
    table.timestamp('work_ends_at').nullable();
    table.timestamp('work_ended_at').nullable();
    table.timestamp('break_started_at').nullable();
    table.timestamp('break_ends_at').nullable();
    table.timestamp('break_warning_sent_at').nullable();
    table.timestamp('break_ended_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('task_id').references('id').inTable('task');
    table.foreign('time_entry_id').references('id').inTable('time_entry');
    table.index(['status'], 'idx_pomodoro_status');
    table.index(['task_id'], 'idx_pomodoro_task');
    table.index(['work_started_at'], 'idx_pomodoro_work_started');
  });
};

const down = async knex => {
  await knex.schema.dropTableIfExists('pomodoro_session');
};

export {up, down};
