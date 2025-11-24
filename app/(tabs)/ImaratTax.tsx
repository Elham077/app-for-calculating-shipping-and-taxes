import SafeScreen from "@/components/SafeScreen";
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
  addCar,
  deleteCar,
  getCar,
  getDollar,
  initDB,
  updateCar,
} from "../../helper/db";

// ========== TYPES ==========
interface Car {
  id: number;
  name: string;
  modal: string;
  total_tax: number;
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

const STRINGS = {
  errors: {
    loadCars: "در بارگذاری اطلاعات موترها مشکلی پیش آمد",
    saveCar: "در ذخیره اطلاعات مشکلی پیش آمد",
    deleteCar: "در حذف موتر مشکلی پیش آمد",
    bulkDelete: "مشکلی در حذف گروهی رخ داد",
  },
  success: {
    save: "اطلاعات موتر با موفقیت به روز شد",
    add: "موتر جدید با موفقیت افزوده شد",
    delete: "موتر با موفقیت حذف شد",
    bulkDelete: "حذف گروهی انجام شد",
  },
  validation: {
    required: "پر کردن تمام فیلدها اجباری است",
    invalidTax: "مالیات باید یک عدد معتبر باشد",
  },
  messages: {
    noSelection: "هیچ موتری انتخاب نشده است",
    confirmDelete: "آیا از حذف این موتر اطمینان دارید؟",
    confirmBulkDelete: "آیا می‌خواهید {count} موتر را حذف کنید؟",
    carManagement: "🚗 مدیریت موترها",
    addNewCar: "افزودن موتر جدید",
    editingCar: "در حال ویرایش موتر",
    carName: "نام موتر",
    carModel: "مدل",
    totalTax: "مالیات کل (افغانی)",
    carList: "لیست موترها",
    noCars: "هنوز موتری ثبت نشده است",
    noCarsSubtitle: "اولین موتر خود را با استفاده از فرم بالا اضافه کنید",
    searchPlaceholder: "جستجوی موتر...",
    namePlaceholder: "نام موتر را وارد کنید",
    modelPlaceholder: "مدل موتر را وارد کنید",
    taxPlaceholder: "مبلغ مالیات را وارد کنید",
    update: "بروزرسانی",
    addCar: "افزودن موتر",
    cancel: "انصراف",
    edit: "ویرایش",
    delete: "حذف",
    bulkMode: "حالت انتخاب",
    cancelBulkMode: "لغو حالت انتخاب",
    loadMore: "نمایش بیشتر",
    afghanCurrency: "افغانی",
  },
} as const;

// ========== UTILITY FUNCTIONS ==========
const formatCurrency = (value: number, currency: "AFN" | "USD" = "AFN"): string => {
  const formatter = new Intl.NumberFormat("fa-IR");
  const unit = currency === "AFN" ? STRINGS.messages.afghanCurrency : "$";
  return `${formatter.format(value)} ${unit}`;
};

const validateForm = (form: FormState): string | null => {
  if (!form.name.trim() || !form.modal.trim() || !form.totalTax.trim()) {
    return STRINGS.validation.required;
  }

  const taxVal = parseFloat(form.totalTax);
  if (isNaN(taxVal) || taxVal <= 0) {
    return STRINGS.validation.invalidTax;
  }

  return null;
};

// ========== SUB-COMPONENTS ==========
interface HeaderProps {
  isEditing: boolean;
}

const Header: React.FC<HeaderProps> = ({ isEditing }) => (
  <View style={styles.header}>
    <Text style={styles.title}>{STRINGS.messages.carManagement}</Text>
    <Text style={styles.subtitle}>
      {isEditing ? STRINGS.messages.editingCar : STRINGS.messages.addNewCar}
    </Text>
  </View>
);

interface CarFormProps {
  form: FormState;
  isEditing: boolean;
  onUpdateField: (field: keyof FormState, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const CarForm: React.FC<CarFormProps> = ({
  form,
  isEditing,
  onUpdateField,
  onSave,
  onCancel,
}) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>
      {isEditing ? STRINGS.messages.edit : STRINGS.messages.addCar}
    </Text>

    <View style={styles.form}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{STRINGS.messages.carName}</Text>
        <TextInput
          style={styles.input}
          placeholder={STRINGS.messages.namePlaceholder}
          value={form.name}
          onChangeText={(text) => onUpdateField('name', text)}
          textAlign="right"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{STRINGS.messages.carModel}</Text>
        <TextInput
          style={styles.input}
          placeholder={STRINGS.messages.modelPlaceholder}
          value={form.modal}
          onChangeText={(text) => onUpdateField('modal', text)}
          textAlign="right"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{STRINGS.messages.totalTax}</Text>
        <TextInput
          style={styles.input}
          placeholder={STRINGS.messages.taxPlaceholder}
          keyboardType="numeric"
          value={form.totalTax}
          onChangeText={(text) => onUpdateField('totalTax', text)}
          textAlign="right"
        />
      </View>

      <View style={styles.buttonGroup}>
        {isEditing && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>{STRINGS.messages.cancel}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={onSave}
        >
          <Text style={styles.saveButtonText}>
            {isEditing ? STRINGS.messages.update : STRINGS.messages.addCar}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

interface SearchBarProps {
  searchText: string;
  onSearch: (text: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchText, onSearch }) => (
  <View style={styles.searchContainer}>
    <TextInput
      style={styles.searchInput}
      placeholder={STRINGS.messages.searchPlaceholder}
      value={searchText}
      onChangeText={onSearch}
    />
  </View>
);

interface ListHeaderProps {
  carCount: number;
  isBulkMode: boolean;
  onToggleBulkMode: () => void;
}

const ListHeader: React.FC<ListHeaderProps> = ({
  carCount,
  isBulkMode,
  onToggleBulkMode,
}) => (
  <View style={styles.listHeader}>
    <Text style={styles.listTitle}>{STRINGS.messages.carList}</Text>
    <Text style={styles.listCount}>{carCount} موتر</Text>
    <TouchableOpacity
      style={[
        styles.bulkModeButton,
        { backgroundColor: isBulkMode ? COLORS.danger : COLORS.primary }
      ]}
      onPress={onToggleBulkMode}
    >
      <Text style={styles.bulkModeButtonText}>
        {isBulkMode ? STRINGS.messages.cancelBulkMode : STRINGS.messages.bulkMode}
      </Text>
    </TouchableOpacity>
  </View>
);

interface CarItemProps {
  item: Car;
  dollarRate: number;
  isBulkMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onEdit: (car: Car) => void;
  onDelete: (id: number) => void;
}

const CarItem: React.FC<CarItemProps> = ({
  item,
  dollarRate,
  isBulkMode,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
}) => {
  const dollarAmount = dollarRate > 0 ? item.total_tax / dollarRate : 0;

  return (
    <View style={styles.itemCard}>
      {isBulkMode && (
        <TouchableOpacity
          onPress={() => onToggleSelect(item.id)}
          style={[
            styles.selectionCheckbox,
            {
              backgroundColor: isSelected ? COLORS.primary : "#fff",
              borderColor: COLORS.primary,
            }
          ]}
        >
          {isSelected && (
            <FontAwesome name="check" size={14} color="#fff" />
          )}
        </TouchableOpacity>
      )}
      
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemModal}>{item.modal}</Text>
          </View>
          <Text style={styles.itemTax}>
            {formatCurrency(item.total_tax)} ({dollarAmount.toFixed(2)}$)
          </Text>
        </View>

        {!isBulkMode && (
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onEdit(item)}
            >
              <Text style={styles.editButtonText}>{STRINGS.messages.edit}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDelete(item.id)}
            >
              <Text style={styles.deleteButtonText}>{STRINGS.messages.delete}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

interface EmptyStateProps {
  isLoading: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ isLoading }) => {
  if (isLoading) return null;

  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🚗</Text>
      <Text style={styles.emptyText}>{STRINGS.messages.noCars}</Text>
      <Text style={styles.emptySubtext}>{STRINGS.messages.noCarsSubtitle}</Text>
    </View>
  );
};

interface LoadMoreButtonProps {
  hasMore: boolean;
  onLoadMore: () => void;
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ hasMore, onLoadMore }) => {
  if (!hasMore) return null;

  return (
    <TouchableOpacity style={styles.loadMoreButton} onPress={onLoadMore}>
      <Text style={styles.loadMoreText}>{STRINGS.messages.loadMore}</Text>
    </TouchableOpacity>
  );
};

interface BulkDeleteButtonProps {
  selectedCount: number;
  onBulkDelete: () => void;
}

const BulkDeleteButton: React.FC<BulkDeleteButtonProps> = ({
  selectedCount,
  onBulkDelete,
}) => {
  if (selectedCount === 0) return null;

  return (
    <TouchableOpacity style={styles.bulkDeleteButton} onPress={onBulkDelete}>
      <Text style={styles.bulkDeleteButtonText}>
        حذف {selectedCount} موتر انتخاب شده
      </Text>
    </TouchableOpacity>
  );
};

// ========== MAIN COMPONENT ==========
const CarScreen: React.FC = () => {
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
  const selectedCount = selectedItems.size;

  // ========== DATA FETCHING ==========
  const loadCars = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getCar();
      setCars(data);
      setPage(1);
    } catch (error) {
      console.error("Error loading cars:", error);
      Alert.alert("خطا", STRINGS.errors.loadCars);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const initializeData = useCallback(async () => {
    try {
      await initDB();
      await Promise.all([loadCars(), loadDollarRate()]);
    } catch (error) {
      console.error("Initialization error:", error);
    }
  }, [loadCars, loadDollarRate]);

  // ========== EVENT HANDLERS ==========
  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    setPage(1);
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
        Alert.alert("موفق", STRINGS.success.save);
      } else {
        await addCar(form.name, form.modal, taxVal);
        Alert.alert("موفق", STRINGS.success.add);
      }

      resetForm();
      await loadCars();
    } catch (error) {
      console.error("Error saving car:", error);
      Alert.alert("خطا", STRINGS.errors.saveCar);
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
      Alert.alert("تأیید حذف", STRINGS.messages.confirmDelete, [
        { text: STRINGS.messages.cancel, style: "cancel" },
        {
          text: STRINGS.messages.delete,
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCar(id);
              await loadCars();
              Alert.alert("حذف شد", STRINGS.success.delete);
            } catch (error) {
              console.error("Error deleting car:", error);
              Alert.alert("خطا", STRINGS.errors.deleteCar);
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

  const updateFormField = useCallback((field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleBulkMode = useCallback(() => {
    setIsBulkMode(prev => !prev);
    setSelectedItems(new Set());
  }, []);

  const toggleSelectItem = useCallback((id: number) => {
    setSelectedItems(prev => {
      const updated = new Set(prev);
      updated.has(id) ? updated.delete(id) : updated.add(id);
      return updated;
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedCount === 0) {
      Alert.alert("انتخاب نشده", STRINGS.messages.noSelection);
      return;
    }

    Alert.alert(
      "تأیید حذف گروهی",
      STRINGS.messages.confirmBulkDelete.replace("{count}", selectedCount.toString()),
      [
        { text: STRINGS.messages.cancel, style: "cancel" },
        {
          text: STRINGS.messages.delete,
          style: "destructive",
          onPress: async () => {
            try {
              for (const id of selectedItems) {
                await deleteCar(id);
              }

              setSelectedItems(new Set());
              setIsBulkMode(false);
              await loadCars();

              Alert.alert("موفق", STRINGS.success.bulkDelete);
            } catch (error) {
              console.error(error);
              Alert.alert("خطا", STRINGS.errors.bulkDelete);
            }
          },
        },
      ]
    );
  }, [selectedCount, selectedItems, loadCars]);

  const loadMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  // ========== EFFECTS ==========
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // ========== RENDER ==========
  return (
    <SafeScreen>
      <ScrollView style={styles.container}>
        <Header isEditing={isEditing} />
        
        <CarForm
          form={form}
          isEditing={isEditing}
          onUpdateField={updateFormField}
          onSave={handleSave}
          onCancel={resetForm}
        />
        
        <SearchBar searchText={searchText} onSearch={handleSearch} />
        
        <ListHeader
          carCount={cars.length}
          isBulkMode={isBulkMode}
          onToggleBulkMode={toggleBulkMode}
        />

        <FlatList
          data={paginatedCars}
          scrollEnabled={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <CarItem
              item={item}
              dollarRate={dollarRate}
              isBulkMode={isBulkMode}
              isSelected={selectedItems.has(item.id)}
              onToggleSelect={toggleSelectItem}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          ListEmptyComponent={<EmptyState isLoading={isLoading} />}
        />

        <LoadMoreButton hasMore={hasMore} onLoadMore={loadMore} />
        
        <BulkDeleteButton
          selectedCount={selectedCount}
          onBulkDelete={handleBulkDelete}
        />
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
  bulkModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bulkModeButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
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
    flexDirection: "row-reverse",
    alignItems: "flex-start",
  },
  itemContent: {
    flex: 1,
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    borderWidth: 2,
    marginLeft: 10,
    marginTop: 2,
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
  bulkDeleteButton: {
    backgroundColor: COLORS.danger,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  bulkDeleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default CarScreen;