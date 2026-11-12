import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

function initializeSequelize(database, username, password) {
  return new Sequelize(database, username, password, {
    host: process.env.MYSQL_HOST_UN || 'localhost',
    dialect: 'mysql',
    logging: true
    // logging: (sql) => console.log('SQL:', sql)
  });
}

const UN_DB_CONNECTION = initializeSequelize(
  process.env.MYSQL_DB_UN,
  process.env.MYSQL_USER_UN,
  process.env.MYSQL_PASSWORD_UN
);

const connectDB = async () => {
  try {
    await UN_DB_CONNECTION.authenticate();
    console.log('Connection to upniva database has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

export { UN_DB_CONNECTION, connectDB };
