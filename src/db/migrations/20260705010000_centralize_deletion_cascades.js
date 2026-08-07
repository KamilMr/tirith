const replaceForeignKey = async (
  knex,
  tableName,
  columnName,
  referencedTable,
  onDelete,
) => {
  const constraint = await knex('information_schema.KEY_COLUMN_USAGE')
    .select('CONSTRAINT_NAME')
    .whereRaw('TABLE_SCHEMA = DATABASE()')
    .where({TABLE_NAME: tableName, COLUMN_NAME: columnName})
    .whereNotNull('REFERENCED_TABLE_NAME')
    .first();

  if (!constraint) {
    throw new Error(`Foreign key not found for ${tableName}.${columnName}`);
  }

  await knex.schema.alterTable(tableName, table => {
    table.dropForeign([columnName], constraint.CONSTRAINT_NAME);
  });

  await knex.schema.alterTable(tableName, table => {
    const foreignKey = table
      .foreign(columnName)
      .references('id')
      .inTable(referencedTable);

    if (onDelete) foreignKey.onDelete(onDelete);
  });
};

const up = async knex => {
  await replaceForeignKey(
    knex,
    'pomodoro_session',
    'time_entry_id',
    'time_entry',
    'SET NULL',
  );
  await replaceForeignKey(
    knex,
    'pomodoro_session',
    'task_id',
    'task',
    'CASCADE',
  );
  await replaceForeignKey(knex, 'time_entry', 'task_id', 'task', 'CASCADE');
  await replaceForeignKey(knex, 'task', 'project_id', 'project', 'CASCADE');
  await replaceForeignKey(knex, 'project', 'client_id', 'client', 'CASCADE');
};

const down = async knex => {
  await replaceForeignKey(knex, 'project', 'client_id', 'client');
  await replaceForeignKey(knex, 'task', 'project_id', 'project');
  await replaceForeignKey(knex, 'time_entry', 'task_id', 'task');
  await replaceForeignKey(knex, 'pomodoro_session', 'task_id', 'task');
  await replaceForeignKey(
    knex,
    'pomodoro_session',
    'time_entry_id',
    'time_entry',
  );
};

export {up, down};
