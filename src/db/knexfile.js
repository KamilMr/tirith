import dotenv from 'dotenv';
dotenv.config({path: '../../.env'});

const host = process.env.MYSQL_HOST;
const port = Number(process.env.MYSQL_PORT) || 3306;
const user = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWD;
const db = process.env.MYSQL_DATABASE;

export default {
  development: {
    client: 'mysql2',
    connection: {
      host: host,
      port,
      user: user,
      password: password,
      database: db,
    },
  },
  production: {
    client: 'mysql2',
    connection: {
      host: host,
      port,
      user: user,
      password: password,
      database: db,
    },
  },
};
