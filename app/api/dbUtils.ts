import * as mysql from "mysql";

const { DB_HOST, DB_PORT, DB_PASSWORD, DB_NAME } = process.env;

const logger = console;

const dbConnection = {
  host: DB_HOST,
  port: +DB_PORT,
  user: "root",
  password: DB_PASSWORD,
  database: DB_NAME,
  dateStrings: true,
};

let pool = connect();
function connect() {
  const _pool = mysql.createPool(
    Object.assign(dbConnection, { connectionLimit: 4, queueLimit: 10 }),
  );
  _pool.on("error", function handleError(err: any) {
    logger.error(err.stack || err);
    pool = connect();
  });
  _pool.on("acquire", function () {
    // console.log('Connection %d acquired', connection.threadId);
  });

  _pool.on("enqueue", function () {
    logger.info("Waiting for available connection slot");
  });
  return _pool;
}
export async function exeScript<T extends object = object>(
  sql: string,
): Promise<T[]> {
  return await new Promise((resolve, reject) => {
    pool.query(sql, function (error: any, results: T[]) {
      if (error) {
        logger.error(`${sql}:${error}`);
        reject(error);
      }
      resolve(results);
    });
  });
}
