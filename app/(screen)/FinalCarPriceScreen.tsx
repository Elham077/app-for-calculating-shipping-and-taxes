import CategoryDropdown from "@/components/DropDownX";
import SafeScreen from "@/components/SafeScreen";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { addFinalCarPrice, db, getCar, getShipping } from "../../helper/db";

// ========== TYPES ==========
interface Shipping {
  id: number;
  state: string;
  auction: string;
  rate: number;
}

interface Car {
  id: number;
  name: string;
  modal: string;
  total_tax: number;
}

interface FormattedShipping {
  label: string;
  value: string;
  rate: number;
}

interface FormattedCar {
  label: string;
  value: string;
  total_tax: number;
}

interface FormState {
  carPrice: string;
  selectedShipping: string | null;
  selectedCar: string | null;
}

// ========== CONSTANTS ==========
const COLORS = {
  primary: "#007AFF",
  success: "#34C759",
  danger: "#FF3B30",
  warning: "#FF9500",
  text: {
    primary: "#1a1a1a",
    secondary: "#666",
    tertiary: "#999",
  },
  background: {
    primary: "#fff",
    secondary: "#f5f5f5",
    tertiary: "#fafafa",
  },
  border: "#e0e0e0",
} as const;

// ========== MAIN COMPONENT ==========
const FinalCarPriceScreen: React.FC = () => {
  // State
  const [form, setForm] = useState<FormState>({
    carPrice: "",
    selectedShipping: null,
    selectedCar: null,
  });
  const [shippingList, setShippingList] = useState<FormattedShipping[]>([]);
  const [carList, setCarList] = useState<FormattedCar[]>([]);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [dollarPrice, setDollarPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // ========== DATA LOADING ==========
  const loadDollarPrice = useCallback(async () => {
    try {
      const res = await db.getFirstAsync<{ daily_price: number }>(
        "SELECT daily_price FROM Dollar ORDER BY id DESC LIMIT 1"
      );
      setDollarPrice(res?.daily_price || null);
    } catch (error) {
      console.error("Error loading dollar:", error);
      Alert.alert("خطا", "در دریافت قیمت دالر مشکلی پیش آمد");
    }
  }, []);

  const loadShipping = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getShipping();
      const formatted: FormattedShipping[] = data.map((item: Shipping) => ({
        label: `${item.state} - ${item.auction}`,
        value: item.id.toString(),
        rate: item.rate,
      }));
      setShippingList(formatted);
    } catch (error) {
      console.error("Error loading shipping:", error);
      Alert.alert("خطا", "مشکلی در دریافت اطلاعات حمل و نقل پیش آمد");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCar = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getCar();
      const formatted: FormattedCar[] = data.map((item: Car) => ({
        label: `${item.name} ${item.modal}`,
        value: item.id.toString(),
        total_tax: item.total_tax,
      }));
      setCarList(formatted);
    } catch (error) {
      console.error("Error loading cars:", error);
      Alert.alert("خطا", "مشکلی در دریافت اطلاعات موترها پیش آمد");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ========== FORM HANDLERS ==========
  const updateFormField = useCallback(
    (field: keyof FormState, value: string | null) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const validateForm = (): string | null => {
    if (!form.carPrice.trim()) {
      return "لطفاً قیمت موتر را وارد کنید";
    }

    const carPriceNum = Number(form.carPrice);
    if (isNaN(carPriceNum) || carPriceNum <= 0) {
      return "لطفاً قیمت موتر را به درستی وارد کنید";
    }

    if (!form.selectedCar) {
      return "لطفاً نوع موتر را انتخاب کنید";
    }

    if (!form.selectedShipping) {
      return "لطفاً مسیر حمل و نقل را انتخاب کنید";
    }

    if (!dollarPrice || dollarPrice <= 0) {
      return "قیمت دالر در سیستم ثبت نشده است";
    }

    return null;
  };

  // ========== CALCULATION ==========
  const calculate = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert("خطا", validationError);
      return;
    }

    try {
      setIsCalculating(true);

      const carPriceNum = Number(form.carPrice);
      const shipping = shippingList.find(
        (i) => i.value === form.selectedShipping
      );
      const car = carList.find((i) => i.value === form.selectedCar);

      if (!shipping || !car) {
        Alert.alert("خطا", "اطلاعات انتخاب شده معتبر نیستند");
        return;
      }

      // تبدیل مالیات از افغانی به دالر
      const taxInDollar = car.total_tax / dollarPrice!;

      // قیمت نهایی
      const total = carPriceNum + shipping.rate + taxInDollar;

      // ذخیره در دیتابیس
      await addFinalCarPrice(carPriceNum, shipping.rate, taxInDollar, total);

      setFinalPrice(total);
      Alert.alert("موفق", "محاسبه با موفقیت انجام و ذخیره شد");
    } catch (error) {
      console.error("Calculation error:", error);
      Alert.alert("خطا", "در محاسبه قیمت مشکلی پیش آمد");
    } finally {
      setIsCalculating(false);
    }
  }, [form, shippingList, carList, dollarPrice]);

  const resetForm = useCallback(() => {
    setForm({
      carPrice: "",
      selectedShipping: null,
      selectedCar: null,
    });
    setFinalPrice(null);
  }, []);

  // ========== EFFECTS ==========
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([loadDollarPrice(), loadShipping(), loadCar()]);
    };
    initializeData();
  }, [loadDollarPrice, loadShipping, loadCar]);

  // ========== RENDER COMPONENTS ==========
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>قیمت نهایی موتر</Text>
      <Text style={styles.subtitle}>
        محاسبه قیمت تمام شده موتر با احتساب مالیات و هزینه حمل
      </Text>
    </View>
  );

  const renderForm = () => (
    <View style={styles.formCard}>
      {/* قیمت پایه موتر */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>قیمت موتر (دالر)</Text>
        <TextInput
          style={styles.input}
          placeholder="قیمت موتر را وارد کنید..."
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={form.carPrice}
          onChangeText={(value) => updateFormField("carPrice", value)}
          textAlign="right"
        />
      </View>

      {/* انتخاب موتر و مالیات */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>نوع موتر و مالیات</Text>
        <CategoryDropdown
          value={form.selectedCar}
          onChange={(value) => updateFormField("selectedCar", value)}
          items={carList}
          placeholder="موتر و مالیات را انتخاب کنید"
          required={true}
          searchable={true}
          disabled={isLoading}
        />
      </View>

      {/* انتخاب مسیر حمل */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>مسیر حمل و نقل</Text>
        <CategoryDropdown
          value={form.selectedShipping}
          onChange={(value) => updateFormField("selectedShipping", value)}
          items={shippingList}
          placeholder="ایالت و مزایده را انتخاب کنید"
          required={true}
          searchable={true}
          disabled={isLoading}
        />
      </View>

      {/* اطلاعات قیمت دالر */}
      {dollarPrice && (
        <View style={styles.dollarInfo}>
          <Text style={styles.dollarLabel}>قیمت دالر فعلی:</Text>
          <Text style={styles.dollarValue}>
            {dollarPrice.toLocaleString()} افغانی
          </Text>
        </View>
      )}

      {/* دکمه‌های اقدام */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={resetForm}
          disabled={isCalculating}
        >
          <Text style={styles.resetButtonText}>پاک کردن</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.calculateButton]}
          onPress={calculate}
          disabled={isCalculating || isLoading}
        >
          {isCalculating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.calculateButtonText}>محاسبه قیمت</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderResult = () => {
    if (finalPrice === null) return null;

    return (
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>نتیجه محاسبه</Text>
        <View style={styles.resultContent}>
          <Text style={styles.finalPrice}>
            {finalPrice.toLocaleString()} دالر
          </Text>
          <Text style={styles.resultSubtitle}>قیمت نهایی موتر</Text>
        </View>

        {/* جزئیات محاسبه */}
        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>جزئیات محاسبه:</Text>
          {form.carPrice && (
            <Text style={styles.breakdownItem}>
              قیمت پایه: {Number(form.carPrice).toLocaleString()} دالر
            </Text>
          )}
          {form.selectedShipping && (
            <Text style={styles.breakdownItem}>
              هزینه حمل:{" "}
              {shippingList
                .find((s) => s.value === form.selectedShipping)
                ?.rate.toLocaleString()}{" "}
              دالر
            </Text>
          )}
          {form.selectedCar && dollarPrice && (
            <Text style={styles.breakdownItem}>
              مالیات:{" "}
              {(
                carList.find((c) => c.value === form.selectedCar)!.total_tax /
                dollarPrice
              ).toFixed(2)}{" "}
              دالر
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderLoading = () => {
    if (!isLoading) return null;

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>در حال بارگذاری اطلاعات...</Text>
      </View>
    );
  };

  return (
    <SafeScreen>
      <ScrollView style={styles.container} nestedScrollEnabled={true}>
        {renderHeader()}
        {renderLoading()}
        {!isLoading && renderForm()}
        {renderResult()}
      </ScrollView>
    </SafeScreen>
  );
};

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    backgroundColor: COLORS.background.primary,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text.primary,
    textAlign: "right",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: "right",
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: COLORS.background.primary,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.background.tertiary,
    textAlign: "right",
  },
  dollarInfo: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  dollarLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: "500",
  },
  dollarValue: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: "600",
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
    minHeight: 50,
  },
  calculateButton: {
    backgroundColor: COLORS.primary,
  },
  resetButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calculateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resetButtonText: {
    color: COLORS.text.secondary,
    fontSize: 16,
    fontWeight: "500",
  },
  resultCard: {
    backgroundColor: COLORS.background.primary,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
    textAlign: "right",
    marginBottom: 16,
  },
  resultContent: {
    alignItems: "center",
    marginBottom: 16,
  },
  finalPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.success,
    textAlign: "center",
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: "center",
  },
  breakdown: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    textAlign: "right",
    marginBottom: 12,
  },
  breakdownItem: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: "right",
    marginBottom: 6,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: "center",
  },
});

export default FinalCarPriceScreen;
