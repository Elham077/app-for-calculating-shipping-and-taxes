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
  addShipping,
  deleteShipping,
  getShipping,
  initDB,
  updateShipping,
} from "../../helper/db";

type ShippingType = {
  id: number;
  state: string;
  auction: string;
  rate: number;
};

const ShippingScreen = () => {
  const [shippings, setShippings] = useState<ShippingType[]>([]);
  const [state, setState] = useState("");
  const [auction, setAuction] = useState("");
  const [rate, setRate] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    initDB();
    loadShippings();
  }, []);

  const loadShippings = async () => {
    const data = await getShipping();
    setShippings(data);
  };

  const handleSave = async () => {
    if (!state || !auction || !rate) {
      Alert.alert("خطا", "تمام فیلدها الزامی هستند");
      return;
    }

    const rateVal = parseFloat(rate);
    if (isNaN(rateVal)) {
      Alert.alert("خطا", "نرخ باید یک عدد باشد");
      return;
    }

    if (editingId !== null) {
      await updateShipping(editingId, state, auction, rateVal);
      Alert.alert("موفق", "اطلاعات حمل و نقل با موفقیت به روز شد");
      setEditingId(null);
    } else {
      await addShipping(state, auction, rateVal);
      Alert.alert("موفق", "حمل و نقل جدید با موفقیت افزوده شد");
    }

    setState("");
    setAuction("");
    setRate("");
    loadShippings();
  };

  const handleEdit = (item: ShippingType) => {
    setState(item.state);
    setAuction(item.auction);
    setRate(item.rate.toString());
    setEditingId(item.id);
  };

  const handleDelete = (id: number) => {
    Alert.alert("تأیید حذف", "آیا از حذف این آیتم اطمینان دارید؟", [
      { text: "انصراف", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          await deleteShipping(id);
          loadShippings();
          Alert.alert("حذف شد", "آیتم با موفقیت حذف شد");
        },
      },
    ]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setState("");
    setAuction("");
    setRate("");
  };

  return (
    <SafeScreen>
      <ScrollView style={styles.container}>
        {/* هدر */}
        <View style={styles.header}>
          <Text style={styles.title}>حمل و نقل از امریکا الی اسلام قلعه</Text>
          <Text style={styles.subtitle}>
            {editingId ? "در حال ویرایش آیتم" : "افزودن نرخ حمل و نقل جدید"}
          </Text>
        </View>

        {/* فرم در کارت */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {editingId ? "ویرایش حمل و نقل" : "افزودن حمل و نقل"}
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>استان</Text>
              <TextInput
                style={styles.input}
                placeholder="نام ایالت امریکا(State) را وارد کنید"
                value={state}
                onChangeText={setState}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>مزایده</Text>
              <TextInput
                style={styles.input}
                placeholder="نام مزایده را وارد کنید"
                value={auction}
                onChangeText={setAuction}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>نرخ (ریال)</Text>
              <TextInput
                style={styles.input}
                placeholder="نرخ را وارد کنید"
                keyboardType="numeric"
                value={rate}
                onChangeText={setRate}
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
                  {editingId ? "بروزرسانی" : "افزودن حمل و نقل"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* هدر لیست */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>نرخ‌های حمل و نقل</Text>
          <Text style={styles.listCount}>{shippings.length} آیتم</Text>
        </View>

        {/* لیست حمل و نقل */}
        <FlatList
          data={shippings}
          scrollEnabled={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemState}>{item.state}</Text>
                  <Text style={styles.itemAuction}>{item.auction}</Text>
                </View>
                <Text style={styles.itemRate}>
                  {item.rate.toLocaleString()} ریال
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
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>هنوز اطلاعاتی ثبت نشده است</Text>
              <Text style={styles.emptySubtext}>
                اولین نرخ حمل و نقل خود را با استفاده از فرم بالا اضافه کنید
              </Text>
            </View>
          }
        />
      </ScrollView>
    </SafeScreen>
  );
};

export default ShippingScreen;

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
  itemState: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
    textAlign: "right",
  },
  itemAuction: {
    fontSize: 14,
    color: "#666",
    textAlign: "right",
  },
  itemRate: {
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
