import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("local.db");

// اجرای کوئری عمومی
export const query = async <T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> => {
  try {
    const result = await db.getAllAsync(sql, params);
    return result as T[];
  } catch (error) {
    console.log("SQL error:", error);
    throw error;
  }
};

// ✅ ایجاد جداول (تضمین ساخت کامل قبل از query)
export const initDB = async () => {
  console.log("Initializing database...");

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS Dollar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      daily_price REAL
    );

    CREATE TABLE IF NOT EXISTS Shipping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state TEXT,
      auction TEXT,
      rate REAL
    );

    CREATE TABLE IF NOT EXISTS Car (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      modal TEXT,
      total_tax REAL
    );
  `);

  console.log("DB initialized ✅");
};

// ===== Dollar =====
export const addDollar = (daily_price: number) =>
  query(`INSERT INTO Dollar (daily_price) VALUES (?)`, [daily_price]);

export const getDollar = () => query(`SELECT * FROM Dollar ORDER BY id DESC`);

export const updateDollar = (id: number, daily_price: number) =>
  query(`UPDATE Dollar SET daily_price=? WHERE id=?`, [daily_price, id]);

export const deleteDollar = (id: number) =>
  query(`DELETE FROM Dollar WHERE id=?`, [id]);

// ===== Shipping =====
export const addShipping = (state: string, auction: string, rate: number) =>
  query(`INSERT INTO Shipping (state, auction, rate) VALUES (?, ?, ?)`, [
    state,
    auction,
    rate,
  ]);

export const getShipping = () =>
  query(`SELECT * FROM Shipping ORDER BY id DESC`);

export const updateShipping = (
  id: number,
  state: string,
  auction: string,
  rate: number
) =>
  query(`UPDATE Shipping SET state=?, auction=?, rate=? WHERE id=?`, [
    state,
    auction,
    rate,
    id,
  ]);

export const deleteShipping = (id: number) =>
  query(`DELETE FROM Shipping WHERE id=?`, [id]);

// ===== Car =====
export const addCar = (name: string, modal: string, total_tax: number) =>
  query(`INSERT INTO Car (name, modal, total_tax) VALUES (?, ?, ?)`, [
    name,
    modal,
    total_tax,
  ]);

export const getCar = () => query(`SELECT * FROM Car ORDER BY id DESC`);

export const updateCar = (
  id: number,
  name: string,
  modal: string,
  total_tax: number
) =>
  query(`UPDATE Car SET name=?, modal=?, total_tax=? WHERE id=?`, [
    name,
    modal,
    total_tax,
    id,
  ]);

export const deleteCar = (id: number) =>
  query(`DELETE FROM Car WHERE id=?`, [id]);
