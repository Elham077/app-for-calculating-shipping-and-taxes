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
import DropDownPicker from "react-native-dropdown-picker";
import { addFinalCarPrice, db, getCar, getShipping } from "../../helper/db";

// ---------- Types ----------
interface ShippingType {
  id: number;
  state: string;
  auction: string;
  rate: number;
}

interface CarType {
  id: number;
  name: string;
  modal: string;
  total_tax: number;
}

// ------------------------------------------
const FinalCarPriceScreen: React.FC = () => {
  const [carPrice, setCarPrice] = useState<string>("");
  const [shippingList, setShippingList] = useState<any[]>([]);
  const [carList, setCarList] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<number | null>(null);
  const [selectedCar, setSelectedCar] = useState<number | null>(null);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [carOpen, setCarOpen] = useState(false);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [dollarPrice, setDollarPrice] = useState<number | null>(null);

  // -------- Load from SQLite --------
  useEffect(() => {
    loadShipping();
    loadCar();
    loadDollarPrice();
  }, []);
  const loadDollarPrice = async () => {
    try {
      const res = await db.getFirstAsync<{ daily_price: number }>(
        "SELECT daily_price FROM Dollar ORDER BY id DESC LIMIT 1"
      );
      setDollarPrice(res?.daily_price || null);
    } catch (error) {
      console.log("Error loading dollar:", error);
    }
  };

  const loadShipping = async () => {
    try {
      const data = await getShipping();
      const formatted = data.map((item: ShippingType) => ({
        label: `${item.state} - ${item.auction}`,
        value: item.id,
        rate: item.rate,
      }));
      setShippingList(formatted);
    } catch (error) {
      console.log("Error loading shipping:", error);
      Alert.alert("خطا", "مشکلی در دریافت اطلاعات حمل و نقل پیش آمد");
    }
  };

  const loadCar = async () => {
    try {
      const data = await getCar();
      const formatted = data.map((item: CarType) => ({
        label: `${item.name} ${item.modal}`,
        value: item.id,
        total_tax: item.total_tax,
      }));
      setCarList(formatted);
    } catch (error) {
      console.log("Error loading cars:", error);
      Alert.alert("خطا", "مشکلی در دریافت اطلاعات موترها پیش آمد");
    }
  };

  // -------- Calculator ----------
  const calculate = async () => {
    if (!carPrice || !selectedShipping || !selectedCar) {
      Alert.alert("خطا", "لطفاً تمام بخش ها را پر کنید!");
      return;
    }

    const carPriceNum = Number(carPrice);
    if (isNaN(carPriceNum) || carPriceNum <= 0) {
      Alert.alert("خطا", "لطفاً قیمت موتر را به درستی وارد کنید");
      return;
    }

    const shipping = shippingList.find((i) => i.value === selectedShipping);
    const car = carList.find((i) => i.value === selectedCar);

    if (!shipping || !car) return;

    if (!dollarPrice || dollarPrice <= 0) {
      Alert.alert("خطا", "قیمت دالر در دیتابیس ثبت نشده است!");
      return;
    }

    // تبدیل مالیه از افغانی به دالر
    const taxInDollar = car.total_tax / dollarPrice;

    // قیمت نهایی
    const total = carPriceNum + shipping.rate + taxInDollar;

    // ذخیره در دیتابیس
    await addFinalCarPrice(carPriceNum, shipping.rate, taxInDollar, total);

    setFinalPrice(total);
  };

  const resetForm = () => {
    setCarPrice("");
    setSelectedShipping(null);
    setSelectedCar(null);
    setFinalPrice(null);
    setShippingOpen(false);
    setCarOpen(false);
  };

  return (
    <SafeScreen>
      <ScrollView style={styles.container} nestedScrollEnabled={true}>
        {/* هدر صفحه */}
        <View style={styles.header}>
          <Text style={styles.title}>قیمت نهایی موتر</Text>
          <Text style={styles.subtitle}>
            محاسبه قیمت تمام شده موتر با احتساب مالیات و هزینه حمل
          </Text>
        </View>

        {/* فرم محاسبه */}
        <View style={styles.formCard}>
          {/* قیمت پایه موتر */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>قیمت پایه موتر (افغانی)</Text>
            <TextInput
              style={styles.input}
              placeholder="قیمت موتر را وارد کنید..."
              keyboardType="numeric"
              value={carPrice}
              onChangeText={setCarPrice}
              textAlign="right"
            />
          </View>

          {/* انتخاب مسیر حمل */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>مسیر حمل و نقل</Text>
            <DropDownPicker
              open={shippingOpen}
              listMode="SCROLLVIEW"
              value={selectedShipping}
              items={shippingList}
              setOpen={setShippingOpen}
              setValue={setSelectedShipping}
              setItems={setShippingList}
              placeholder="استان و مزایده را انتخاب کنید"
              style={styles.dropdown}
              textStyle={styles.dropdownText}
              dropDownContainerStyle={styles.dropdownContainer}
              listItemContainerStyle={styles.listItemContainer}
              listItemLabelStyle={styles.listItemLabel}
              arrowIconStyle={styles.arrowIcon}
              tickIconStyle={styles.tickIcon}
              closeOnBackPressed={true}
              zIndex={3000}
              zIndexInverse={1000}
            />
          </View>

          {/* انتخاب موتر و مالیات */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>نوع موتر و مالیات</Text>
            <DropDownPicker
              open={carOpen}
              listMode="SCROLLVIEW"
              value={selectedCar}
              items={carList}
              setOpen={setCarOpen}
              setValue={setSelectedCar}
              setItems={setCarList}
              placeholder="موتر و مالیات را انتخاب کنید"
              style={styles.dropdown}
              textStyle={styles.dropdownText}
              dropDownContainerStyle={styles.dropdownContainer}
              listItemContainerStyle={styles.listItemContainer}
              listItemLabelStyle={styles.listItemLabel}
              arrowIconStyle={styles.arrowIcon}
              tickIconStyle={styles.tickIcon}
              closeOnBackPressed={true}
              zIndex={2000}
              zIndexInverse={2000}
            />
          </View>

          {/* دکمه‌های اقدام */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={resetForm}
            >
              <Text style={styles.resetButtonText}>پاک کردن</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.calculateButton]}
              onPress={calculate}
            >
              <Text style={styles.calculateButtonText}>محاسبه قیمت</Text>
            </TouchableOpacity>
          </View>

          {/* نمایش قیمت نهایی */}
          {finalPrice !== null && (
            <Text
              style={{
                fontSize: 22,
                marginTop: 20,
                fontWeight: "bold",
                color: "#007AFF",
                textAlign: "center",
              }}
            >
              قیمت نهایی: {finalPrice.toLocaleString()} دالر
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeScreen>
  );
};

// -------------- Styles --------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
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
    textAlign: "right",
    marginBottom: 4,
  },
  subtitle: { fontSize: 16, color: "#666", textAlign: "right", lineHeight: 22 },
  formCard: {
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
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
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
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fafafa",
    minHeight: 50,
  },
  dropdownText: { textAlign: "right", fontSize: 16 },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  listItemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    minHeight: 40,
  },
  listItemLabel: { textAlign: "right", fontSize: 14 },
  arrowIcon: { width: 16, height: 16 },
  tickIcon: { width: 16, height: 16 },
  buttonGroup: { flexDirection: "row-reverse", gap: 12, marginTop: 8 },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  calculateButton: { backgroundColor: "#007AFF" },
  resetButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  calculateButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  resetButtonText: { color: "#666", fontSize: 16, fontWeight: "500" },
});

export default FinalCarPriceScreen;
