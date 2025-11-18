import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("local.db");

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

// پاک کردن تمام رکوردهای جدول final_car_prices
export const clearFinalPrices = async (): Promise<void> => {
  try {
    await db.execAsync(`DELETE FROM final_car_prices`);
  } catch (error) {
    console.log("SQL error:", error);
    throw error;
  }
};

// ---------- ایجاد جدول اگر وجود نداشت ----------
export const initFinalCarPricesTable = async (): Promise<void> => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS final_car_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        car_price REAL,
        shipping_rate REAL,
        total_tax REAL,
        final_price REAL,
        timestamp TEXT
      )
    `);
  } catch (error) {
    console.log("SQL error:", error);
    throw error;
  }
};

// ---------- اضافه کردن رکورد ----------
export const addFinalCarPrice = async (
  car_price: number,
  shipping_rate: number,
  total_tax: number,
  final_price: number
): Promise<void> => {
  try {
    const timestamp = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO final_car_prices (car_price, shipping_rate, total_tax, final_price, timestamp)
       VALUES (?, ?, ?, ?, ?)`,
      [car_price, shipping_rate, total_tax, final_price, timestamp]
    );
  } catch (error) {
    console.log("SQL error:", error);
    throw error;
  }
};

export const getFinalCarPrices = async (): Promise<any[]> => {
  try {
    const result = await db.getAllAsync(`SELECT * FROM final_car_prices ORDER BY id DESC`);
    return result as any[];
  } catch (error) {
    console.log("SQL error:", error);
    throw error;
  }
};
// حذف یک رکورد بر اساس id
export const deleteFinalCarPrice = async (id: number): Promise<void> => {
  try {
    await db.runAsync(
      `DELETE FROM final_car_prices WHERE id = ?`,
      [id]
    );
  } catch (error) {
    console.log("SQL error:", error);
    throw error;
  }
};
