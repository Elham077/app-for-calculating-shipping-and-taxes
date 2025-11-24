import SafeScreen from "@/components/SafeScreen";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addDollar,
  deleteDollar,
  getDollar,
  initDB,
  updateDollar,
} from "../../db/db";

type DollarType = {
  id: number;
  daily_price: number;
};

const DollarScreen = () => {
  const [dollar, setDollar] = useState<DollarType | null>(null);
  const [price, setPrice] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initDB();
      loadDollar();
    };
    init();
  }, []);

  const loadDollar = async () => {
    try {
      const data = await getDollar();
      if (data.length > 0) {
        setDollar(data[0]);
        setPrice(data[0].daily_price.toString());
      } else {
        setDollar(null);
        setPrice("");
      }
    } catch (error) {
      console.log("Error loading dollar:", error);
    }
  };

  const handleSave = async () => {
    const val = parseFloat(price);
    if (isNaN(val)) {
      Alert.alert("خطا", "لطفاً یک عدد معتبر وارد کنید");
      return;
    }

    if (val <= 0) {
      Alert.alert("خطا", "قیمت باید بزرگتر از صفر باشد");
      return;
    }

    try {
      if (dollar) {
        await updateDollar(dollar.id, val);
        Alert.alert("موفق", "قیمت دالر با موفقیت بروزرسانی شد");
      } else {
        await addDollar(val);
        Alert.alert("موفق", "قیمت دالر با موفقیت ثبت شد");
      }
      setEditing(false);
      loadDollar();
    } catch (error) {
      console.log("Error saving dollar:", error);
      Alert.alert("خطا", "مشکلی در ذخیره قیمت دالر پیش آمد");
    }
  };

  const handleEdit = () => setEditing(true);

  const handleDelete = async () => {
    if (!dollar) return;
    Alert.alert("تأیید حذف", "آیا از حذف قیمت دالر اطمینان دارید؟", [
      { text: "انصراف", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDollar(dollar.id);
            Alert.alert("حذف شد", "قیمت دالر با موفقیت حذف شد");
            loadDollar();
          } catch (error) {
            console.log("Error deleting dollar:", error);
            Alert.alert("خطا", "مشکلی در حذف قیمت دالر پیش آمد");
          }
        },
      },
    ]);
  };

  const cancelEdit = () => {
    setEditing(false);
    if (dollar) {
      setPrice(dollar.daily_price.toString());
    }
  };

  return (
    <SafeScreen>
      <ScrollView style={styles.container}>
        {/* هدر صفحه */}
        <View style={styles.header}>
          <Text style={styles.title}>قیمت دالر</Text>
          <Text style={styles.subtitle}>
            {dollar
              ? editing
                ? "در حال ویرایش قیمت"
                : "مشاهده قیمت فعلی"
              : "ثبت قیمت جدید"}
          </Text>
        </View>

        {/* کارت اصلی */}
        <View style={styles.card}>
          {dollar ? (
            // حالت وقتی قیمت وجود دارد
            <>
              <View style={styles.priceDisplay}>
                <Text style={styles.priceLabel}>قیمت فعلی دالر:</Text>
                <Text style={styles.priceValue}>
                  {dollar.daily_price.toLocaleString()} افغانی
                </Text>
                <Text style={styles.priceNote}>
                  هر 1 دلار = {dollar.daily_price.toLocaleString()} افغانی
                </Text>
              </View>

              {editing && (
                <View style={styles.editSection}>
                  <Text style={styles.editLabel}>قیمت جدید:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="قیمت جدید دالر را وارد کنید"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                    textAlign="right"
                  />
                </View>
              )}

              <View style={styles.buttonGroup}>
                {editing ? (
                  <>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={cancelEdit}
                    >
                      <Text style={styles.cancelButtonText}>انصراف</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.saveButton]}
                      onPress={handleSave}
                    >
                      <Text style={styles.saveButtonText}>ذخیره تغییرات</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.button, styles.editButton]}
                      onPress={handleEdit}
                    >
                      <Text style={styles.editButtonText}>ویرایش قیمت</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.deleteButton]}
                      onPress={handleDelete}
                    >
                      <Text style={styles.deleteButtonText}>حذف قیمت</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          ) : (
            // حالت وقتی قیمتی وجود ندارد
            <>
              <View style={styles.addSection}>
                <Text style={styles.addLabel}>ثبت قیمت جدید دالر</Text>
                <Text style={styles.addDescription}>
                  لطفاً قیمت روز دالر را به افغانی وارد کنید
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="مثال: 85.5"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                  textAlign="right"
                />

                <TouchableOpacity
                  style={[styles.button, styles.saveButton, styles.fullWidth]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>ثبت قیمت دالر</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* اطلاعات راهنما */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>راهنما</Text>
          <Text style={styles.infoText}>
            • قیمت دالر باید به واحد افغانی وارد شود{"\n"}• این قیمت در محاسبات
            مالی استفاده می‌شود{"\n"}• در صورت تغییر قیمت بازار، آن را بروزرسانی
            کنید
          </Text>
        </View>
      </ScrollView>
    </SafeScreen>
  );
};

export default DollarScreen;

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
  priceDisplay: {
    alignItems: "center",
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  priceValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 8,
    textAlign: "center",
  },
  priceNote: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  editSection: {
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
    textAlign: "right",
  },
  addSection: {
    alignItems: "center",
  },
  addLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  addDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
    textAlign: "right",
    marginBottom: 16,
    width: "100%",
  },
  buttonGroup: {
    flexDirection: "row-reverse",
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    flex: 1,
    width: "100%",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  editButton: {
    backgroundColor: "#34C759",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
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
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "right",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    textAlign: "right",
  },
});
