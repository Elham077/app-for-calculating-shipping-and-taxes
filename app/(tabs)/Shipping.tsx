import CategoryDropdown from "@/components/DropDownX";
import SafeScreen from "@/components/SafeScreen";
import { US_STATES } from "@/constants/usStates";
import FontAwesome from "@expo/vector-icons/FontAwesome";
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
  addShipping,
  deleteShipping,
  getShipping,
  initDB,
  updateShipping,
} from "../../db/db";

// ========== TYPES ==========
interface Shipping {
  id: number;
  state: string;
  auction: string;
  rate: number;
}

interface FormState {
  stateValue: string;
  auction: string;
  rate: string;
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
const formatCurrency = (value: number, currency: "USD" = "USD") => {
  const formatter = new Intl.NumberFormat("fa-IR");
  const unit = currency === "USD" ? "دالر" : "";
  return `${formatter.format(value)} ${unit}`;
};

const validateForm = (form: FormState): string | null => {
  if (!form.stateValue.trim() || !form.auction.trim() || !form.rate.trim()) {
    return "پر کردن تمام فیلدها الزامی هستند";
  }

  const rateVal = parseFloat(form.rate);
  if (isNaN(rateVal) || rateVal <= 0) {
    return "نرخ باید یک عدد معتبر باشد";
  }

  return null;
};

// ========== MAIN COMPONENT ==========
const ShippingScreen = () => {
  // State
  const [searchText, setSearchText] = useState("");
  const [shippings, setShippings] = useState<Shipping[]>([]);
  const [form, setForm] = useState<FormState>({
    stateValue: "",
    auction: "",
    rate: "",
  });
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const toggleSelectItem = useCallback((id: number) => {
    setSelectedItems((prev) => {
      const updated = new Set(prev);
      updated.has(id) ? updated.delete(id) : updated.add(id);
      return updated;
    });
  }, []);

  // ========== COMPUTED VALUES ==========
  const filteredShippings = useMemo(() => {
    if (!searchText.trim()) return shippings;

    const searchLower = searchText.toLowerCase();
    return shippings.filter(
      (item) =>
        item.state.toLowerCase().includes(searchLower) ||
        item.auction.toLowerCase().includes(searchLower) ||
        item.rate.toString().includes(searchText)
    );
  }, [shippings, searchText]);

  const paginatedShippings = useMemo(
    () => filteredShippings.slice(0, page * PAGE_SIZE),
    [filteredShippings, page]
  );

  const hasMore = paginatedShippings.length < filteredShippings.length;
  const isEditing = editingId !== null;

  // ========== DATA FETCHING ==========
  const loadShippings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getShipping();
      setShippings(data);
      setPage(1); // Reset to first page when data changes
    } catch (error) {
      console.error("Error loading shippings:", error);
      Alert.alert("خطا", "در بارگذاری اطلاعات حمل و نقل مشکلی پیش آمد");
    } finally {
      setIsLoading(false);
    }
  }, []);
  const handleBulkDelete = useCallback(() => {
    if (selectedItems.size === 0) {
      Alert.alert("انتخاب نشده", "هیچ مسیری انتخاب نشده است");
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
                await deleteShipping(id);
              }

              setSelectedItems(new Set());
              setIsBulkMode(false);

              await loadShippings();

              Alert.alert("موفق", "حذف گروهی انجام شد");
            } catch (error) {
              console.error(error);
              Alert.alert("خطا", "مشکلی در حذف گروهی رخ داد");
            }
          },
        },
      ]
    );
  }, [selectedItems, loadShippings]);

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
      const rateVal = parseFloat(form.rate);

      if (isEditing && editingId) {
        await updateShipping(editingId, form.stateValue, form.auction, rateVal);
        Alert.alert("موفق", "اطلاعات حمل و نقل با موفقیت به روز شد");
      } else {
        await addShipping(form.stateValue, form.auction, rateVal);
        Alert.alert("موفق", "حمل و نقل جدید با موفقیت افزوده شد");
      }

      resetForm();
      await loadShippings();
    } catch (error) {
      console.error("Error saving shipping:", error);
      Alert.alert("خطا", "در ذخیره اطلاعات مشکلی پیش آمد");
    }
  }, [form, editingId, loadShippings]);

  const handleEdit = useCallback((shipping: Shipping) => {
    setForm({
      stateValue: shipping.state,
      auction: shipping.auction,
      rate: shipping.rate.toString(),
    });
    setEditingId(shipping.id);
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      Alert.alert("تأیید حذف", "آیا از حذف این آیتم اطمینان دارید؟", [
        { text: "انصراف", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteShipping(id);
              await loadShippings();
              Alert.alert("حذف شد", "آیتم با موفقیت حذف شد");
            } catch (error) {
              console.error("Error deleting shipping:", error);
              Alert.alert("خطا", "در حذف آیتم مشکلی پیش آمد");
            }
          },
        },
      ]);
    },
    [loadShippings]
  );

  const resetForm = useCallback(() => {
    setForm({ stateValue: "", auction: "", rate: "" });
    setEditingId(null);
  }, []);

  const loadMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const updateFormField = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // ========== EFFECTS ==========
  useEffect(() => {
    const initializeData = async () => {
      await initDB();
      await loadShippings();
    };
    initializeData();
  }, [loadShippings]);

  // ========== RENDER COMPONENTS ==========
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>حمل و نقل از امریکا الی اسلام قلعه</Text>
      <Text style={styles.subtitle}>
        {isEditing ? "در حال ویرایش آیتم" : "افزودن نرخ حمل و نقل جدید"}
      </Text>
    </View>
  );

  const renderForm = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {isEditing ? "ویرایش حمل و نقل" : "افزودن حمل و نقل"}
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>ایالت</Text>
          <CategoryDropdown
            label="ولایت/ایالت"
            placeholder="یک گزینه انتخاب کنید..."
            items={US_STATES}
            value={form.stateValue}
            onChange={(value) => updateFormField("stateValue", value)}
            searchable={true}
            required={true}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>مزایده (Auction)</Text>
          <TextInput
            style={styles.input}
            placeholder="نام مزایده را وارد کنید"
            value={form.auction}
            onChangeText={(value) => updateFormField("auction", value)}
            textAlign="right"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>نرخ (دالر)</Text>
          <TextInput
            style={styles.input}
            placeholder="نرخ را وارد کنید"
            keyboardType="numeric"
            value={form.rate}
            onChangeText={(value) => updateFormField("rate", value)}
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
              {isEditing ? "بروزرسانی" : "افزودن حمل و نقل"}
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
        placeholder="جستجو بر اساس ایالت، مزایده یا نرخ..."
        value={searchText}
        onChangeText={handleSearch}
      />
    </View>
  );

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.listTitle}>نرخ‌های حمل و نقل</Text>
      <Text style={styles.listCount}>{shippings.length} آیتم</Text>
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

  const renderShippingItem = ({ item }: { item: Shipping }) => (
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
          <Text style={styles.itemState}>{item.state}</Text>
          <Text style={styles.itemAuction}>{item.auction}</Text>
        </View>
        <Text style={styles.itemRate}>{formatCurrency(item.rate)}</Text>
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

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyText}>هنوز اطلاعاتی ثبت نشده است</Text>
      <Text style={styles.emptySubtext}>
        اولین نرخ حمل و نقل خود را با استفاده از فرم بالا اضافه کنید
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
          data={paginatedShippings}
          scrollEnabled={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderShippingItem}
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
              حذف {selectedItems.size} مسیرهای انتخاب شده
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
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.background.primary,
    fontSize: 16,
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
  itemState: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 2,
    textAlign: "right",
  },
  itemAuction: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: "right",
  },
  itemRate: {
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
    margin: 16,
  },
  loadMoreText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default ShippingScreen;
