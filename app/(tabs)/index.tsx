import CategoryDropdown from "@/components/DropDownX";
import FinalPriceList from "@/components/FinalPriceList";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ========== TYPES ==========
type SearchTableType = "all" | "car" | "shipping" | "dollar";

interface SearchResult {
  source: SearchTableType;
  id: number;
  value: number;
  title: string;
}

interface Stats {
  carCount: number;
  shippingCount: number;
}

interface SearchFilterOption {
  label: string;
  value: SearchTableType;
  icon: string;
  color: string;
}

// ========== CONSTANTS ==========
const SEARCH_FILTER_OPTIONS: SearchFilterOption[] = [
  {
    label: "موترها",
    value: "car",
    icon: "car",
    color: "#FF9500",
  },
  {
    label: "حمل و نقل",
    value: "shipping",
    icon: "truck",
    color: "#5856D6",
  },
];

const COLORS = {
  primary: "#007AFF",
  success: "#34C759",
  warning: "#FF9500",
  secondary: "#5856D6",
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
const getSourceConfig = (source: SearchTableType) => {
  const configs = {
    dollar: {
      name: "قیمت دالر",
      icon: "dollar" as const,
      color: COLORS.success,
    },
    car: { name: "موتر", icon: "car" as const, color: COLORS.warning },
    shipping: {
      name: "حمل و نقل",
      icon: "truck" as const,
      color: COLORS.secondary,
    },
    all: { name: "همه", icon: "search" as const, color: COLORS.primary },
  };

  return configs[source] || configs.all;
};

const formatCurrency = (value: number, currency: "AFN" | "USD" = "AFN") => {
  const formatter = new Intl.NumberFormat("fa-IR");
  const unit = currency === "AFN" ? "افغانی" : "دالر";
  return `${formatter.format(value)} ${unit}`;
};

// ========== MAIN COMPONENT ==========
const HomeScreen = () => {
  const router = useRouter();
  const db = useSQLiteContext();

  // State
  const [dollarPrice, setDollarPrice] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [searchTable, setSearchTable] = useState<SearchTableType>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<Stats>({ carCount: 0, shippingCount: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // ========== DATA FETCHING ==========
  const loadDollarPrice = useCallback(async () => {
    try {
      const res = await db.getFirstAsync<{ daily_price: number }>(
        "SELECT daily_price FROM Dollar ORDER BY id DESC LIMIT 1"
      );
      setDollarPrice(res?.daily_price || null);
    } catch (error) {
      console.error("Error loading dollar price:", error);
    }
  }, [db]);

  const loadStats = useCallback(async () => {
    try {
      const [carRes, shippingRes] = await Promise.all([
        db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM Car"
        ),
        db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM Shipping"
        ),
      ]);

      setStats({
        carCount: carRes?.count || 0,
        shippingCount: shippingRes?.count || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, [db]);

  // ========== SEARCH LOGIC ==========
  const handleSearch = useCallback(
    async (text: string) => {
      setSearch(text);

      if (text.trim() === "") {
        setResults([]);
        return;
      }

      if (searchTable === "all") {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const pattern = `%${text}%`;
        let query = "";
        let params: string[] = [pattern];

        if (searchTable === "shipping") {
          query = `
          SELECT 'shipping' AS source, id, rate AS value, 
                 state || ' - ' || auction AS title
          FROM Shipping
          WHERE state LIKE ?`;
        } else if (searchTable === "car") {
          query = `
          SELECT 'car' AS source, id, total_tax AS value, 
                 name || ' - ' || modal AS title
          FROM Car
          WHERE name LIKE ?`;
        }

        const res = await db.getAllAsync<SearchResult>(query, params);
        setResults(res);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchTable, db]
  );

  // ========== COMPUTED VALUES ==========
  const selectedFilterLabel = useMemo(() => {
    const selected = SEARCH_FILTER_OPTIONS.find(
      (option) => option.value === searchTable
    );
    return selected?.label || "حمل و نقل";
  }, [searchTable]);

  const formattedResults = useMemo(() => {
    return results.map((item) => {
      const sourceConfig = getSourceConfig(item.source);

      let displayValue = "";
      if (item.source === "car" && dollarPrice && dollarPrice > 0) {
        const valueInDollars = Number(item.value) / dollarPrice;
        displayValue = Number.isFinite(valueInDollars)
          ? formatCurrency(Math.round(valueInDollars), "USD")
          : "—";
      } else {
        displayValue = formatCurrency(
          Number(item.value),
          item.source === "dollar" ? "AFN" : "USD"
        );
      }

      return {
        ...item,
        displayValue,
        sourceConfig,
      };
    });
  }, [results, dollarPrice]);

  // ========== EFFECTS ==========
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([loadDollarPrice(), loadStats()]);
    };
    initializeData();
  }, [loadDollarPrice, loadStats]);

  // ========== EVENT HANDLERS ==========
  const refreshPage = useCallback(() => {
    loadDollarPrice();
    loadStats();
    setSearch("");
    setResults([]);
    setSearchTable("all");
  }, [loadDollarPrice, loadStats]);

  const handleClearSearch = useCallback(() => {
    setSearch("");
    setResults([]);
  }, []);

  const navigateToCalculator = useCallback(() => {
    router.push("/(screen)/FinalCarPriceScreen");
  }, [router]);

  // ========== RENDER COMPONENTS ==========
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>صفحه مدیریت</Text>
      <Text style={styles.headerSubtitle}>خلاصه اطلاعات و جستجو</Text>
      <TouchableOpacity style={styles.refreshBtn} onPress={refreshPage}>
        <FontAwesome name="refresh" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: "#E3F2FD" }]}>
          <FontAwesome name="dollar" size={24} color={COLORS.primary} />
        </View>
        <Text style={styles.statValue}>
          {dollarPrice}
        </Text>
        <Text style={styles.statLabel}>قیمت دالر</Text>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: "#E8F5E8" }]}>
          <FontAwesome name="car" size={24} color={COLORS.success} />
        </View>
        <Text style={styles.statValue}>{stats.carCount}</Text>
        <Text style={styles.statLabel}>تعداد موترها</Text>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: "#FFF3E0" }]}>
          <FontAwesome name="truck" size={24} color={COLORS.warning} />
        </View>
        <Text style={styles.statValue}>{stats.shippingCount}</Text>
        <Text style={styles.statLabel}>مسیر حمل</Text>
      </View>
    </View>
  );

  const renderCalculatorButton = () => (
    <View style={styles.startBtnSection}>
      <TouchableOpacity
        style={styles.startBtn}
        onPress={navigateToCalculator}
        activeOpacity={0.7}
      >
        <FontAwesome name="calculator" size={20} color="#fff" />
        <Text style={styles.startBtnText}>محاسبه قیمت نهایی</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchSection = () => (
    <View style={styles.searchSection}>
      <View style={styles.searchHeader}>
        <Text style={styles.sectionTitle}>جستجوی پیشرفته</Text>
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>
            فیلتر: {selectedFilterLabel}
          </Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <CategoryDropdown
          value={searchTable}
          onChange={(v) => setSearchTable(v as SearchTableType)}
          items={SEARCH_FILTER_OPTIONS}
          placeholder="فیلتر جستجو..."
          label="جستجو در:"
          searchable={true}
        />
      </View>

      <View style={styles.searchContainer}>
        <FontAwesome
          name="search"
          size={20}
          color="#8E8E93"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={`جستجو در ${selectedFilterLabel.toLowerCase()}...`}
          value={search}
          onChangeText={handleSearch}
          textAlign="right"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchBtn}
            onPress={handleClearSearch}
          >
            <FontAwesome name="times" size={16} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {searchTable !== "all" && (
        <View style={styles.activeFilterInfo}>
          <FontAwesome name="info-circle" size={14} color={COLORS.primary} />
          <Text style={styles.activeFilterText}>
            جستجو فقط در {selectedFilterLabel} انجام می‌شود
          </Text>
        </View>
      )}
    </View>
  );

  const renderSearchResults = () => {
    if (search.length === 0) return null;

    return (
      <View style={styles.resultsSection}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {`نتایج جستجو برای "${search}"`}
          </Text>
          <View style={styles.resultsCount}>
            <Text style={styles.resultsCountText}>
              {formattedResults.length} نتیجه
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text>در حال جستجو...</Text>
          </View>
        ) : formattedResults.length > 0 ? (
          <FlatList
            data={formattedResults}
            scrollEnabled={false}
            keyExtractor={(item) => `${item.source}-${item.id}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.resultItem,
                  { borderLeftColor: item.sourceConfig.color },
                ]}
              >
                <View style={styles.resultHeader}>
                  <View style={styles.resultSource}>
                    <FontAwesome
                      name={item.sourceConfig.icon}
                      size={16}
                      color={item.sourceConfig.color}
                    />
                    <Text style={styles.resultSourceText}>
                      {item.sourceConfig.name}
                    </Text>
                  </View>
                </View>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultValue}>{item.displayValue}</Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.noResults}>
            <FontAwesome name="search" size={48} color="#C7C7CC" />
            <Text style={styles.noResultsText}>نتیجه‌ای یافت نشد</Text>
            <Text style={styles.noResultsSubtext}>
              {searchTable === "all"
                ? "لطفاً یک فیلتر جستجو انتخاب کنید"
                : `هیچ نتیجه‌ای در ${selectedFilterLabel} یافت نشد`}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {renderHeader()}
        {renderStats()}
        {renderCalculatorButton()}
        {renderSearchSection()}
        {renderSearchResults()}
        <FinalPriceList />
      </ScrollView>
    </SafeAreaView>
  );
};

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.background.primary,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text.primary,
    textAlign: "right",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: "right",
  },
  statsContainer: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshBtn: {
    position: "absolute",
    left: 20,
    top: 20,
    backgroundColor: "#E3F2FD",
    padding: 10,
    borderRadius: 30,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: "center",
  },
  startBtnSection: {
    backgroundColor: COLORS.background.primary,
    margin: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row-reverse",
    gap: 8,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  searchSection: {
    backgroundColor: COLORS.background.primary,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
    textAlign: "right",
  },
  filterBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  filterBadgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
  },
  filterContainer: {
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: COLORS.background.tertiary,
  },
  searchIcon: {
    padding: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    textAlign: "right",
  },
  clearSearchBtn: {
    padding: 12,
  },
  activeFilterInfo: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: "#F0F7FF",
    borderRadius: 6,
  },
  activeFilterText: {
    fontSize: 12,
    color: COLORS.primary,
    textAlign: "right",
  },
  resultsSection: {
    margin: 16,
  },
  resultsHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    textAlign: "right",
    flex: 1,
  },
  resultsCount: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultsCountText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: "500",
  },
  resultItem: {
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resultSource: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  resultSourceText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: "500",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 4,
    textAlign: "right",
  },
  resultValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
    textAlign: "right",
  },
  noResults: {
    alignItems: "center",
    padding: 40,
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text.secondary,
    marginTop: 12,
    marginBottom: 4,
    textAlign: "center",
  },
  noResultsSubtext: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    textAlign: "center",
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
  },
});

export default HomeScreen;
