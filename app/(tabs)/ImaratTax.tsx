import SafeScreen from "@/components/SafeScreen";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addCar,
  deleteCar,
  getCar,
  getDollar,
  initDB,
  updateCar,
} from "../../helper/db";

type CarType = {
  id: number;
  name: string;
  modal: string;
  total_tax: number;
};

const CarScreen = () => {
  const [cars, setCars] = useState<CarType[]>([]);
  const [name, setName] = useState("");
  const [modal, setModal] = useState("");
  const [totalTax, setTotalTax] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dollarRate, setDollarRate] = useState<number>(1);

  useEffect(() => {
    initDB();
    loadCars();
    loadDollarRate();
  }, []);

  const loadCars = async () => {
    const data = await getCar();
    setCars(data);
  };
  const loadDollarRate = async () => {
    const dollars = await getDollar();
    if (dollars.length > 0) setDollarRate(dollars[0].daily_price);
  };
  const handleSave = async () => {
    if (!name || !modal || !totalTax) {
      Alert.alert("خطا", "پر کردن جدول اجباری است");
      return;
    }

    const taxVal = parseFloat(totalTax);
    if (isNaN(taxVal)) {
      Alert.alert("خطا", "مالیات باید یک عدد باشد");
      return;
    }

    if (editingId !== null) {
      await updateCar(editingId, name, modal, taxVal);
      Alert.alert("موفق", "اطلاعات موتر با موفقیت به روز شد");
      setEditingId(null);
    } else {
      await addCar(name, modal, taxVal);
      Alert.alert("موفق", "موتر جدید با موفقیت افزوده شد");
    }

    setName("");
    setModal("");
    setTotalTax("");
    loadCars();
  };

  const handleEdit = (item: CarType) => {
    setName(item.name);
    setModal(item.modal);
    setTotalTax(item.total_tax.toString());
    setEditingId(item.id);
  };

  const handleDelete = (id: number) => {
    Alert.alert("تأیید حذف", "آیا از حذف این موتر اطمینان دارید؟", [
      { text: "انصراف", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          await deleteCar(id);
          loadCars();
          Alert.alert("حذف شد", "موتر با موفقیت حذف شد");
        },
      },
    ]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setModal("");
    setTotalTax("");
  };
  const convertToDollar = (tax: number) => {
    if (!dollarRate || dollarRate <= 0) return 0;
    return tax / dollarRate;
  };
  return (
    <SafeScreen>
      <ScrollView style={styles.container}>
        {/* هدر */}
        <View style={styles.header}>
          <Text style={styles.title}>🚗 مدیریت موترها</Text>
          <Text style={styles.subtitle}>
            {editingId ? "در حال ویرایش موتر" : "افزودن موتر جدید"}
          </Text>
        </View>

        {/* فرم در کارت */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {editingId ? "ویرایش موتر" : "افزودن موتر"}
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>نام موتر</Text>
              <TextInput
                style={styles.input}
                placeholder="نام موتر را وارد کنید"
                value={name}
                onChangeText={setName}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>مدل</Text>
              <TextInput
                style={styles.input}
                placeholder="مدل موتر را وارد کنید"
                value={modal}
                onChangeText={setModal}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>مالیات کل (افغانی)</Text>
              <TextInput
                style={styles.input}
                placeholder="مبلغ مالیات را وارد کنید"
                keyboardType="numeric"
                value={totalTax}
                onChangeText={setTotalTax}
                textAlign="right"
              />
            </View>

            <View style={styles.buttonGroup}>
              {editingId && (
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={cancelEdit}
                >
                  <Text style={styles.cancelButtonText}>انصراف</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>
                  {editingId ? "بروزرسانی" : "افزودن موتر"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* هدر لیست */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>لیست موترها</Text>
          <Text style={styles.listCount}>{cars.length} موتر</Text>
        </View>

        {/* لیست موترها */}
        <FlatList
          data={cars}
          scrollEnabled={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemModal}>{item.modal}</Text>
                </View>
                <Text style={styles.itemTax}>
                  {item.total_tax.toLocaleString()} افغانی ({convertToDollar(item.total_tax).toFixed(2)}$)
                </Text>
              </View>

              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(item)}
                >
                  <Text style={styles.editButtonText}>ویرایش</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={styles.deleteButtonText}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🚗</Text>
              <Text style={styles.emptyText}>هنوز موتری ثبت نشده است</Text>
              <Text style={styles.emptySubtext}>
                اولین موتر خود را با استفاده از فرم بالا اضافه کنید
              </Text>
            </View>
          }
        />
      </ScrollView>
    </SafeScreen>
  );
};

export default CarScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
    textAlign: "right",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "right",
  },
  card: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
    textAlign: "right",
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
    textAlign: "right",
  },
  buttonGroup: {
    flexDirection: "row-reverse",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  listHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "right",
  },
  listCount: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    alignItems: "flex-end",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
    textAlign: "right",
  },
  itemModal: {
    fontSize: 14,
    color: "#666",
    textAlign: "right",
  },
  itemTax: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
    textAlign: "left",
  },
  itemActions: {
    flexDirection: "row-reverse",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#f0f7ff",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  deleteButton: {
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: "#ff3b30",
  },
  editButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  deleteButtonText: {
    color: "#ff3b30",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginBottom: 4,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
