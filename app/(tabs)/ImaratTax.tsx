import SafeScreen from "@/components/SafeScreen";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import FontAwesome from "@expo/vector-icons/FontAwesome";

// ========== TYPES ==========
interface Car {
  id: number;
  name: string;
  modal: string;
  total_tax: number;
}

interface DollarRate {
  daily_price: number;
}

interface FormState {
  name: string;
  modal: string;
  totalTax: string;
}

// ========== CONSTANTS ==========
const PAGE_SIZE = 5;
const COLORS = {
  primary: "#007AFF",
  danger: "#FF3B30",
  success: "#34C759",
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

// ========== UTILITY FUNCTIONS ==========
const formatCurrency = (value: number, currency: "AFN" | "USD" = "AFN") => {
  const formatter = new Intl.NumberFormat("fa-IR");
  const unit = currency === "AFN" ? "افغانی" : "$";
  return `${formatter.format(value)} ${unit}`;
};

const validateForm = (form: FormState): string | null => {
  if (!form.name.trim() || !form.modal.trim() || !form.totalTax.trim()) {
    return "پر کردن تمام فیلدها اجباری است";
  }

  const taxVal = parseFloat(form.totalTax);
  if (isNaN(taxVal) || taxVal <= 0) {
    return "مالیات باید یک عدد معتبر باشد";
  }

  return null;
};

// ========== MAIN COMPONENT ==========
const CarScreen = () => {
  // State
  const [searchText, setSearchText] = useState("");
  const [cars, setCars] = useState<Car[]>([]);
  const [form, setForm] = useState<FormState>({
    name: "",
    modal: "",
    totalTax: "",
  });
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dollarRate, setDollarRate] = useState<number>(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSelectItem = useCallback((id: number) => {
    setSelectedItems((prev) => {
      const updated = new Set(prev);
      updated.has(id) ? updated.delete(id) : updated.add(id);
      return updated;
    });
  }, []);
  const loadCars = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getCar();
      setCars(data);
      setPage(1); // Reset to first page when data changes
    } catch (error) {
      console.error("Error loading cars:", error);
      Alert.alert("خطا", "در بارگذاری اطلاعات موترها مشکلی پیش آمد");
    } finally {
      setIsLoading(false);
    }
  }, []);
  const handleBulkDelete = useCallback(() => {
    if (selectedItems.size === 0) {
      Alert.alert("انتخاب نشده", "هیچ موتری انتخاب نشده است");
      return;
    }

    Alert.alert(
      "تأیید حذف گروهی",
      `آیا می‌خواهید ${selectedItems.size} موتر را حذف کنید؟`,
      [
        { text: "انصراف", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              for (const id of selectedItems) {
                await deleteCar(id);
              }

              setSelectedItems(new Set());
              setIsBulkMode(false);

              await loadCars();

              Alert.alert("موفق", "حذف گروهی انجام شد");
            } catch (error) {
              console.error(error);
              Alert.alert("خطا", "مشکلی در حذف گروهی رخ داد");
            }
          },
        },
      ]
    );
  }, [selectedItems, loadCars]);

  // ========== COMPUTED VALUES ==========
  const filteredCars = useMemo(() => {
    if (!searchText.trim()) return cars;

    const searchLower = searchText.toLowerCase();
    return cars.filter(
      (car) =>
        car.name.toLowerCase().includes(searchLower) ||
        car.modal.toLowerCase().includes(searchLower)
    );
  }, [cars, searchText]);

  const paginatedCars = useMemo(
    () => filteredCars.slice(0, page * PAGE_SIZE),
    [filteredCars, page]
  );

  const hasMore = paginatedCars.length < filteredCars.length;
  const isEditing = editingId !== null;

  // ========== DATA FETCHING ==========

  const loadDollarRate = useCallback(async () => {
    try {
      const dollars = await getDollar();
      if (dollars.length > 0) {
        setDollarRate(dollars[0].daily_price);
      }
    } catch (error) {
      console.error("Error loading dollar rate:", error);
    }
  }, []);

  // ========== EVENT HANDLERS ==========
  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    setPage(1); // Reset to first page when searching
  }, []);

  const handleSave = useCallback(async () => {
    const validationError = validateForm(form);
    if (validationError) {
      Alert.alert("خطا", validationError);
      return;
    }

    try {
      const taxVal = parseFloat(form.totalTax);

      if (isEditing && editingId) {
        await updateCar(editingId, form.name, form.modal, taxVal);
        Alert.alert("موفق", "اطلاعات موتر با موفقیت به روز شد");
      } else {
        await addCar(form.name, form.modal, taxVal);
        Alert.alert("موفق", "موتر جدید با موفقیت افزوده شد");
      }

      resetForm();
      await loadCars();
    } catch (error) {
      console.error("Error saving car:", error);
      Alert.alert("خطا", "در ذخیره اطلاعات مشکلی پیش آمد");
    }
  }, [form, editingId, loadCars]);

  const handleEdit = useCallback((car: Car) => {
    setForm({
      name: car.name,
      modal: car.modal,
      totalTax: car.total_tax.toString(),
    });
    setEditingId(car.id);
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      Alert.alert("تأیید حذف", "آیا از حذف این موتر اطمینان دارید؟", [
        { text: "انصراف", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCar(id);
              await loadCars();
              Alert.alert("حذف شد", "موتر با موفقیت حذف شد");
            } catch (error) {
              console.error("Error deleting car:", error);
              Alert.alert("خطا", "در حذف موتر مشکلی پیش آمد");
            }
          },
        },
      ]);
    },
    [loadCars]
  );

  const resetForm = useCallback(() => {
    setForm({ name: "", modal: "", totalTax: "" });
    setEditingId(null);
  }, []);

  const convertToDollar = useCallback(
    (tax: number) => {
      if (!dollarRate || dollarRate <= 0) return 0;
      return tax / dollarRate;
    },
    [dollarRate]
  );

  const loadMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  // ========== EFFECTS ==========
  useEffect(() => {
    const initializeData = async () => {
      await initDB();
      await Promise.all([loadCars(), loadDollarRate()]);
    };
    initializeData();
  }, [loadCars, loadDollarRate]);

  // ========== RENDER COMPONENTS ==========
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>🚗 مدیریت موترها</Text>
      <Text style={styles.subtitle}>
        {isEditing ? "در حال ویرایش موتر" : "افزودن موتر جدید"}
      </Text>
    </View>
  );

  const renderForm = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {isEditing ? "ویرایش موتر" : "افزودن موتر"}
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>نام موتر</Text>
          <TextInput
            style={styles.input}
            placeholder="نام موتر را وارد کنید"
            value={form.name}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, name: text }))
            }
            textAlign="right"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>مدل</Text>
          <TextInput
            style={styles.input}
            placeholder="مدل موتر را وارد کنید"
            value={form.modal}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, modal: text }))
            }
            textAlign="right"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>مالیات کل (افغانی)</Text>
          <TextInput
            style={styles.input}
            placeholder="مبلغ مالیات را وارد کنید"
            keyboardType="numeric"
            value={form.totalTax}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, totalTax: text }))
            }
            textAlign="right"
          />
        </View>

        <View style={styles.buttonGroup}>
          {isEditing && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={resetForm}
            >
              <Text style={styles.cancelButtonText}>انصراف</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? "بروزرسانی" : "افزودن موتر"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSearch = () => (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="جستجوی موتر..."
        value={searchText}
        onChangeText={handleSearch}
      />
    </View>
  );

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.listTitle}>لیست موترها</Text>
      <Text style={styles.listCount}>{cars.length} موتر</Text>
      <TouchableOpacity
        style={{
          backgroundColor: isBulkMode ? COLORS.danger : COLORS.primary,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
        }}
        onPress={() => {
          setIsBulkMode(!isBulkMode);
          setSelectedItems(new Set());
        }}
      >
        <Text style={{ color: "#fff" }}>
          {isBulkMode ? "لغو حالت انتخاب" : "حالت انتخاب"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCarItem = ({ item }: { item: Car }) => {
    const dollarAmount = convertToDollar(item.total_tax);

    return (
      <View style={styles.itemCard}>
        {isBulkMode && (
          <TouchableOpacity
            onPress={() => toggleSelectItem(item.id)}
            style={{
              marginLeft: 10,
              width: 24,
              height: 24,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
              borderWidth: 2,
              borderColor: COLORS.primary,
              backgroundColor: selectedItems.has(item.id)
                ? COLORS.primary
                : "#fff",
            }}
          >
            <FontAwesome
              name="check"
              size={14}
              color={selectedItems.has(item.id) ? "#fff" : COLORS.primary}
            />
          </TouchableOpacity>
        )}
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemModal}>{item.modal}</Text>
          </View>
          <Text style={styles.itemTax}>
            {formatCurrency(item.total_tax)} ({dollarAmount.toFixed(2)}$)
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
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🚗</Text>
      <Text style={styles.emptyText}>هنوز موتری ثبت نشده است</Text>
      <Text style={styles.emptySubtext}>
        اولین موتر خود را با استفاده از فرم بالا اضافه کنید
      </Text>
    </View>
  );

  const renderLoadMore = () => {
    if (!hasMore) return null;

    return (
      <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
        <Text style={styles.loadMoreText}>نمایش بیشتر</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeScreen>
      <ScrollView style={styles.container}>
        {renderHeader()}
        {renderForm()}
        {renderSearch()}
        {renderListHeader()}

        <FlatList
          data={paginatedCars}
          scrollEnabled={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCarItem}
          ListEmptyComponent={!isLoading ? renderEmptyState : null}
        />

        {renderLoadMore()}
        {isBulkMode && selectedItems.size > 0 && (
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.danger,
              marginHorizontal: 16,
              marginTop: 10,
              padding: 14,
              borderRadius: 8,
              alignItems: "center",
            }}
            onPress={handleBulkDelete}
          >
            <Text style={{ color: "#fff", fontSize: 16 }}>
              حذف {selectedItems.size} موتر انتخاب شده
            </Text>
          </TouchableOpacity>
        )}
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
    marginBottom: 4,
    textAlign: "right",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: "right",
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
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
    color: COLORS.text.primary,
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.background.tertiary,
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
    backgroundColor: COLORS.primary,
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
    color: COLORS.text.secondary,
    fontSize: 16,
    fontWeight: "500",
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.background.primary,
    textAlign: "right",
  },
  listHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background.primary,
    marginTop: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
    textAlign: "right",
  },
  listCount: {
    fontSize: 14,
    color: COLORS.text.secondary,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCard: {
    backgroundColor: COLORS.background.primary,
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
    color: COLORS.text.primary,
    marginBottom: 2,
    textAlign: "right",
  },
  itemModal: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: "right",
  },
  itemTax: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
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
    borderColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    marginHorizontal: 16,
    backgroundColor: COLORS.background.primary,
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
    color: COLORS.text.secondary,
    marginBottom: 4,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    textAlign: "center",
  },
  loadMoreButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
    marginHorizontal: 16,
  },
  loadMoreText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default CarScreen;
