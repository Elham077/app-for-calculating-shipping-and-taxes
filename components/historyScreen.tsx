import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getFinalCarPrices, db } from "../helper/db";

export default function HistoryScreen() {
  const [records, setRecords] = useState<any[]>([]);

  const loadRecords = async () => {
    const data = await getFinalCarPrices();
    setRecords(data);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const deleteRecord = (id: number) => {
    Alert.alert("حذف رکورد", "آیا مطمئن هستید؟", [
      { text: "لغو", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          await db.runAsync(`DELETE FROM final_car_prices WHERE id = ?`, [id]);
          loadRecords();
        },
      },
    ]);
  };

  const editRecord = (item: any) => {
    Alert.alert(
      "ویرایش",
      "در این نسخه فقط نمایش داده می‌شود. اگر خواستی فرم ویرایش کامل بسازم."
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.title}>قیمت نهایی: {item.final_price}</Text>
      <Text>قیمت موتر: {item.car_price}</Text>
      <Text>شپنگ: {item.shipping_rate}</Text>
      <Text>تکس کل: {item.total_tax}</Text>
      <Text style={styles.time}>زمان: {item.timestamp}</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => editRecord(item)}
        >
          <Text style={styles.btnText}>ویرایش</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteRecord(item.id)}
        >
          <Text style={styles.btnText}>حذف</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>تاریخچه محاسبه‌ها</Text>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f4f4f4",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  time: { fontSize: 12, color: "#666", marginTop: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  editBtn: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  deleteBtn: {
    backgroundColor: "#d9534f",
    padding: 10,
    borderRadius: 8,
    flex: 1,
  },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
