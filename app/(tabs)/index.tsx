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
type SearchTableType = "car" | "shipping";

interface SearchResult {
  source: SearchTableType;
  id: number;
  value: number;
  title: string;
}

interface Stats {
  carCount: number;
  shippingCount: number;
  dollarPrice: number | null;
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
    car: { name: "موتر", icon: "car" as const, color: COLORS.warning },
    shipping: {
      name: "حمل و نقل",
      icon: "truck" as const,
      color: COLORS.secondary,
    },
  };

  return configs[source] || configs.shipping;
};

const formatCurrency = (value: number, currency: "AFN" | "USD" = "AFN") => {
  const formatter = new Intl.NumberFormat("en");
  return `${formatter.format(value)} دالر `;
};

// ========== SUB-COMPONENTS ==========
interface HeaderProps {
  onRefresh: () => void;
}

const Header: React.FC<HeaderProps> = ({ onRefresh }) => (
  <View style={styles.header}>
    <View>
      <Text style={styles.headerTitle}>صفحه مدیریت</Text>
      <Text style={styles.headerSubtitle}>اطلاعات و جستجو</Text>
    </View>
    <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
      <FontAwesome name="refresh" size={20} color={COLORS.primary} />
    </TouchableOpacity>
  </View>
);

interface StatsCardProps {
  icon: string;
  value: string | number;
  label: string;
  iconColor: string;
  backgroundColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  value,
  label,
  iconColor,
  backgroundColor,
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor }]}>
      <FontAwesome name={icon as any} size={24} color={iconColor} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

interface StatsSectionProps {
  stats: Stats;
}

const StatsSection: React.FC<StatsSectionProps> = ({ stats }) => (
  <View style={styles.statsContainer}>
    <StatsCard
      icon="dollar"
      value={stats.dollarPrice || "—"}
      label="قیمت دالر"
      iconColor={COLORS.primary}
      backgroundColor="#E3F2FD"
    />
    <StatsCard
      icon="car"
      value={stats.carCount}
      label="موترها"
      iconColor={COLORS.success}
      backgroundColor="#E8F5E8"
    />
    <StatsCard
      icon="truck"
      value={stats.shippingCount}
      label="حمل و نقل"
      iconColor={COLORS.warning}
      backgroundColor="#FFF3E0"
    />
  </View>
);

interface CalculatorButtonProps {
  onPress: () => void;
}

const CalculatorButton: React.FC<CalculatorButtonProps> = ({ onPress }) => (
  <View style={styles.startBtnSection}>
    <TouchableOpacity
      style={styles.startBtn}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <FontAwesome name="calculator" size={20} color="#fff" />
      <Text style={styles.startBtnText}>محاسبه قیمت</Text>
    </TouchableOpacity>
  </View>
);

interface SearchSectionProps {
  searchTable: SearchTableType;
  search: string;
  selectedFilterLabel: string;
  onSearchTableChange: (value: SearchTableType) => void;
  onSearchChange: (text: string) => void;
  onClearSearch: () => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  searchTable,
  search,
  selectedFilterLabel,
  onSearchTableChange,
  onSearchChange,
  onClearSearch,
}) => {
  return (
    <View style={styles.searchSection}>
      <View style={styles.searchHeader}>
        <Text style={styles.sectionTitle}>جستجو</Text>
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>
            فیلتر: {selectedFilterLabel}
          </Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <CategoryDropdown
          value={searchTable}
          onChange={(value) => onSearchTableChange(value as SearchTableType)}
          items={SEARCH_FILTER_OPTIONS}
          placeholder="فیلتر جستجو..."
          label="جستجو در:"
          searchable={false}
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
          onChangeText={onSearchChange}
          textAlign="right"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchBtn}
            onPress={onClearSearch}
          >
            <FontAwesome name="times" size={16} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.activeFilterInfo}>
        <FontAwesome name="info-circle" size={14} color={COLORS.primary} />
        <Text style={styles.activeFilterText}>
          جستجو فقط در {selectedFilterLabel} انجام می‌شود
        </Text>
      </View>
    </View>
  );
};

interface SearchResultItemProps {
  item: SearchResult & {
    displayValue: string;
    sourceConfig: ReturnType<typeof getSourceConfig>;
  };
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ item }) => (
  <TouchableOpacity
    style={[styles.resultItem, { borderLeftColor: item.sourceConfig.color }]}
  >
    <View style={styles.resultHeader}>
      <View style={styles.resultSource}>
        <FontAwesome
          name={item.sourceConfig.icon}
          size={16}
          color={item.sourceConfig.color}
        />
        <Text style={styles.resultSourceText}>{item.sourceConfig.name}</Text>
      </View>
    </View>
    <Text style={styles.resultTitle}>{item.title}</Text>
    <Text style={styles.resultValue}>{item.displayValue}</Text>
  </TouchableOpacity>
);

interface SearchResultsProps {
  search: string;
  searchTable: SearchTableType;
  results: (SearchResult & {
    displayValue: string;
    sourceConfig: ReturnType<typeof getSourceConfig>;
  })[];
  isLoading: boolean;
  selectedFilterLabel: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  search,
  searchTable,
  results,
  isLoading,
  selectedFilterLabel,
}) => {
  if (search.length === 0) return null;

  return (
    <View style={styles.resultsSection}>
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {`نتایج جستجو برای "${search}"`}
        </Text>
        <View style={styles.resultsCount}>
          <Text style={styles.resultsCountText}>{results.length} نتیجه</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>در حال جستجو...</Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          scrollEnabled={false}
          keyExtractor={(item) => `${item.source}-${item.id}`}
          renderItem={({ item }) => <SearchResultItem item={item} />}
        />
      ) : (
        <View style={styles.noResults}>
          <FontAwesome name="search" size={48} color="#C7C7CC" />
          <Text style={styles.noResultsText}>نتیجه‌ای یافت نشد</Text>
          <Text style={styles.noResultsSubtext}>
            {searchTable === "shipping"
              ? "لطفاً یک فیلتر جستجو انتخاب کنید"
              : `هیچ نتیجه‌ای در ${selectedFilterLabel} یافت نشد`}
          </Text>
        </View>
      )}
    </View>
  );
};

// ========== MAIN COMPONENT ==========
const HomeScreen: React.FC = () => {
  const router = useRouter();
  const db = useSQLiteContext();

  // State
  const [stats, setStats] = useState<Stats>({
    carCount: 0,
    shippingCount: 0,
    dollarPrice: null,
  });
  const [search, setSearch] = useState("");
  const [searchTable, setSearchTable] = useState<SearchTableType>("shipping");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ========== DATA FETCHING ==========
  const loadStats = useCallback(async (): Promise<void> => {
    try {
      const [dollarRes, carRes, shippingRes] = await Promise.all([
        db.getFirstAsync<{ daily_price: number }>(
          "SELECT daily_price FROM Dollar ORDER BY id DESC LIMIT 1"
        ),
        db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM Car"
        ),
        db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM Shipping"
        ),
      ]);

      setStats({
        dollarPrice: dollarRes?.daily_price || null,
        carCount: carRes?.count || 0,
        shippingCount: shippingRes?.count || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, [db]);

  // ========== SEARCH LOGIC ==========
  const performSearch = useCallback(
    async (searchText: string, table: SearchTableType) => {
      if (searchText.trim() === "") {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const pattern = `%${searchText}%`;
        let query = "";
        let params: string[] = [];

        if (table === "shipping") {
          // فقط state معیار سرچ باشد
          query = `
          SELECT 'shipping' AS source, id, rate AS value, 
                 state || ' - ' || auction AS title
          FROM Shipping
          WHERE auction LIKE ?`;
          params = [pattern];
        } else if (table === "car") {
          // فقط name معیار سرچ باشد
          query = `
          SELECT 'car' AS source, id, total_tax AS value, 
                 name || ' - ' || modal AS title
          FROM Car
          WHERE name LIKE ?`;
          params = [pattern];
        }

        const searchResults = await db.getAllAsync<SearchResult>(query, params);
        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [db]
  );

  const handleSearch = useCallback(
    (text: string) => {
      setSearch(text);
      if (text.trim() === "") {
        setResults([]);
        return;
      }
      performSearch(text, searchTable);
    },
    [searchTable, performSearch]
  );

  // ========== COMPUTED VALUES ==========
  const selectedFilterLabel = useMemo(() => {
    const selected = SEARCH_FILTER_OPTIONS.find(
      (option) => option.value === searchTable
    );
    return selected?.label || "همه";
  }, [searchTable]);

  const formattedResults = useMemo(() => {
    return results.map((item) => {
      const sourceConfig = getSourceConfig(item.source);

      let displayValue = "";
      if (item.source === "car" && stats.dollarPrice && stats.dollarPrice > 0) {
        const valueInDollars = Number(item.value) / stats.dollarPrice;
        displayValue = Number.isFinite(valueInDollars)
          ? formatCurrency(Math.round(valueInDollars), "USD")
          : "—";
      } else {
        displayValue = formatCurrency(
          Number(item.value),
          item.source === "shipping" ? "AFN" : "USD"
        );
      }

      return {
        ...item,
        displayValue,
        sourceConfig,
      };
    });
  }, [results, stats.dollarPrice]);

  // ========== EVENT HANDLERS ==========
  const refreshPage = useCallback(() => {
    loadStats();
    setSearch("");
    setResults([]);
    setSearchTable("shipping");
  }, [loadStats]);

  const handleClearSearch = useCallback(() => {
    setSearch("");
    setResults([]);
  }, []);

  const handleSearchTableChange = useCallback(
    (value: SearchTableType) => {
      setSearchTable(value);
      if (search) {
        performSearch(search, value);
      }
    },
    [search, performSearch]
  );

  const navigateToCalculator = useCallback(() => {
    router.push("/(screen)/FinalCarPriceScreen");
  }, [router]);

  // ========== EFFECTS ==========
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (search) {
      const timeoutId = setTimeout(() => {
        performSearch(search, searchTable);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [search, searchTable]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Header onRefresh={refreshPage} />
        <StatsSection stats={stats} />
        <CalculatorButton onPress={navigateToCalculator} />

        <SearchSection
          searchTable={searchTable}
          search={search}
          selectedFilterLabel={selectedFilterLabel}
          onSearchTableChange={handleSearchTableChange}
          onSearchChange={handleSearch}
          onClearSearch={handleClearSearch}
        />

        <SearchResults
          search={search}
          searchTable={searchTable}
          results={formattedResults}
          isLoading={isLoading}
          selectedFilterLabel={selectedFilterLabel}
        />

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
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  refreshBtn: {
    backgroundColor: "#E3F2FD",
    padding: 10,
    borderRadius: 30,
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
