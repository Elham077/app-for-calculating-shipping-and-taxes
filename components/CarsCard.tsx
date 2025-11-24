import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getAllCarsGrouped, getDollar, initDB } from "../helper/db";

// ========== ENHANCED TYPES ==========
interface Car {
  id: number;
  name: string;
  modal: string;
  total_tax: number;
}

interface DollarRate {
  daily_price: number;
}

interface CarGroup {
  [key: string]: Car[];
}

// ========== CONSTANTS ==========
const COLORS = {
  primary: "#007AFF",
  secondary: "#5856D6",
  success: "#34C759",
  warning: "#FF9500",
  danger: "#FF3B30",
  text: {
    primary: "#1a1a1a",
    secondary: "#666",
    tertiary: "#999",
  },
  background: {
    primary: "#fff",
    secondary: "#f5f5f5",
    tertiary: "#f7f7f7",
  },
  border: "#e0e0e0",
} as const;

const STRINGS = {
  errors: {
    loadCars: "در بارگذاری اطلاعات موترها مشکلی پیش آمد",
    loadDollar: "در بارگذاری نرخ دلار مشکلی پیش آمد",
    invalidData: "getAllCarsGrouped did not return an array of cars",
  },
  messages: {
    loading: "در حال بارگذاری موترها...",
    noCars: "موتری ثبت نشده است",
    noCarsSubtitle: "برای شروع، موتر جدیدی به سیستم اضافه کنید",
    headerTitle: "دسته‌بندی موترها",
    retry: "تلاش مجدد",
    models: "مدل",
    afghanCurrency: "افغانی",
    dollarCurrency: "دالر",
  },
} as const;

// ========== UTILITY FUNCTIONS ==========
const formatCurrency = (amount: number, currency: string): string => {
  const rounded = Math.round(amount); // حذف اعشار
  return `${rounded.toLocaleString()} ${currency}`;
};

const validateCarsData = (data: unknown): data is Car[] => {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        item && typeof item.id === "number" && typeof item.name === "string"
    )
  );
};

// ========== SUB-COMPONENTS ==========
interface GroupHeaderProps {
  name: string;
  itemCount: number;
  isOpen: boolean;
  onToggle: () => void;
}

const GroupHeaderComponent: React.FC<GroupHeaderProps> = ({
  name,
  itemCount,
  isOpen,
  onToggle,
}) => (
  <TouchableOpacity
    onPress={onToggle}
    style={styles.groupHeader}
    activeOpacity={0.7}
  >
    <View style={styles.groupHeaderContent}>
      <View style={styles.groupTitleContainer}>
        <FontAwesome name="car" size={20} color={COLORS.primary} />
        <Text style={styles.groupTitle}>{name}</Text>
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupCount}>
          {itemCount} {STRINGS.messages.models}
        </Text>
        <FontAwesome
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={16}
          color={COLORS.text.secondary}
        />
      </View>
    </View>
  </TouchableOpacity>
);

const GroupHeader = React.memo(GroupHeaderComponent);
GroupHeader.displayName = "GroupHeader";

interface CarItemProps {
  item: Car;
  dollarRate: number;
}

const CarItem = React.memo(function CarItem({
  item,
  dollarRate,
}: CarItemProps) {
  const dollarAmount = useMemo(
    () => (dollarRate > 0 ? item.total_tax / dollarRate : 0),
    [item.total_tax, dollarRate]
  );

  return (
    <View style={styles.itemBox}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemModel}>مدل: {item.modal}</Text>
      </View>
      <Text style={styles.itemPrice}>
        {formatCurrency(item.total_tax, STRINGS.messages.afghanCurrency)}
      </Text>
      <Text style={styles.itemPrice}>
        {formatCurrency(dollarAmount, STRINGS.messages.dollarCurrency)}
      </Text>
    </View>
  );
});

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = STRINGS.messages.loading,
}) => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <View style={styles.centerContainer}>
    <FontAwesome name="exclamation-triangle" size={48} color={COLORS.warning} />
    <Text style={styles.errorText}>{error}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <FontAwesome name="refresh" size={16} color="#fff" />
      <Text style={styles.retryButtonText}>{STRINGS.messages.retry}</Text>
    </TouchableOpacity>
  </View>
);

const EmptyState: React.FC = () => (
  <View style={styles.centerContainer}>
    <FontAwesome name="car" size={48} color={COLORS.text.tertiary} />
    <Text style={styles.emptyText}>{STRINGS.messages.noCars}</Text>
    <Text style={styles.emptySubtext}>{STRINGS.messages.noCarsSubtitle}</Text>
  </View>
);

interface HeaderProps {
  totalCars: number;
  totalGroups: number;
}

const Header: React.FC<HeaderProps> = ({ totalCars, totalGroups }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{STRINGS.messages.headerTitle}</Text>
    <View style={styles.headerBadge}>
      <Text style={styles.headerBadgeText}>
        {totalCars} موتر در {totalGroups} دسته
      </Text>
    </View>
  </View>
);

// ========== MAIN COMPONENT ==========
const CarAccordion: React.FC = () => {
  // State
  const [groups, setGroups] = useState<CarGroup>({});
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dollarRate, setDollarRate] = useState<number>(0);

  // ========== DATA LOADING ==========
  const loadDollarRate = useCallback(async (): Promise<boolean> => {
    try {
      const dollars: DollarRate[] = await getDollar();
      if (dollars.length > 0 && dollars[0].daily_price > 0) {
        setDollarRate(dollars[0].daily_price);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error loading dollar rate:", err);
      setError(STRINGS.errors.loadDollar);
      return false;
    }
  }, []);

  const loadCars = useCallback(async (): Promise<boolean> => {
    try {
      const cars = await getAllCarsGrouped();

      if (!validateCarsData(cars)) {
        throw new Error(STRINGS.errors.invalidData);
      }

      const grouped = cars.reduce<CarGroup>((acc, car) => {
        const key = car.name;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(car);
        return acc;
      }, {});

      setGroups(grouped);
      return true;
    } catch (err) {
      console.error("Error loading cars:", err);
      setError(STRINGS.errors.loadCars);
      return false;
    }
  }, []);

  const initializeData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await initDB();
      const [carsSuccess, dollarSuccess] = await Promise.allSettled([
        loadCars(),
        loadDollarRate(),
      ]);

      if (
        carsSuccess.status === "rejected" ||
        dollarSuccess.status === "rejected"
      ) {
        throw new Error("Failed to initialize data");
      }
    } catch (err) {
      console.error("Initialization error:", err);
      if (!error) {
        setError(STRINGS.errors.loadCars);
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadCars, loadDollarRate, error]);

  // ========== EVENT HANDLERS ==========
  const toggleGroup = useCallback((name: string) => {
    setOpenGroup((prev) => (prev === name ? null : name));
  }, []);

  const handleRetry = useCallback(() => {
    initializeData();
  }, [initializeData]);

  // ========== COMPUTED VALUES ==========
  const groupEntries = useMemo(() => Object.entries(groups), [groups]);

  const { totalCarsCount, totalGroupsCount } = useMemo(
    () => ({
      totalCarsCount: Object.values(groups).reduce(
        (total, group) => total + group.length,
        0
      ),
      totalGroupsCount: Object.keys(groups).length,
    }),
    [groups]
  );

  const hasData = useMemo(() => groupEntries.length > 0, [groupEntries]);

  // ========== EFFECTS ==========
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // ========== RENDER FUNCTIONS ==========
  const renderGroup = useCallback(
    ([name, items]: [string, Car[]]) => (
      <View key={name} style={styles.groupCard}>
        <GroupHeader
          name={name}
          itemCount={items.length}
          isOpen={openGroup === name}
          onToggle={() => toggleGroup(name)}
        />
        {openGroup === name && (
          <View style={styles.itemsContainer}>
            {items.map((item) => (
              <CarItem key={item.id} item={item} dollarRate={dollarRate} />
            ))}
          </View>
        )}
      </View>
    ),
    [openGroup, dollarRate, toggleGroup]
  );

  // ========== MAIN RENDER ==========
  return (
    <View style={styles.container}>
      <Header totalCars={totalCarsCount} totalGroups={totalGroupsCount} />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={handleRetry} />
      ) : !hasData ? (
        <EmptyState />
      ) : (
        <View style={styles.groupsContainer}>
          {groupEntries.map(renderGroup)}
        </View>
      )}
    </View>
  );
};

// ========== OPTIMIZED STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text.primary,
    textAlign: "right",
  },
  headerBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  groupsContainer: {
    padding: 16,
    gap: 12,
  },
  groupCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    padding: 16,
  },
  groupHeaderContent: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  groupTitleContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text.primary,
    textAlign: "right",
  },
  groupInfo: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  groupCount: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: "500",
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 12,
    gap: 8,
  },
  itemBox: {
    backgroundColor: COLORS.background.tertiary,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemModel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    textAlign: "right",
  },
  itemPrice: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: "500",
    textAlign: "right",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: "center",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.primary,
    textAlign: "center",
    marginBottom: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.secondary,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default CarAccordion;
