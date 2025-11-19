/* eslint-disable react-hooks/exhaustive-deps */
import CategoryDropdown from "@/components/DropDownX";
import FinalPriceList from "@/components/FinalPriceList";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
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

const HomeScreen = () => {
  const router = useRouter();
  const db = useSQLiteContext();
  const [dollarPrice, setDollarPrice] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [searchTable, setSearchTable] = useState<string>("all"); // all, dollar, car, shipping
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState({
    carCount: 0,
    shippingCount: 0,
  });

  // گزینه‌های فیلتر جستجو
  const searchFilterOptions = [
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

  // Load data on component mount
  useEffect(() => {
    loadDollarPrice();
    loadStats();
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

  const loadStats = async () => {
    try {
      const carRes = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM Car"
      );
      const shippingRes = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM Shipping"
      );

      setStats({
        carCount: carRes?.count || 0,
        shippingCount: shippingRes?.count || 0,
      });
    } catch (error) {
      console.log("Error loading stats:", error);
    }
  };

  // Perform search
  const handleSearch = async (text: string) => {
    setSearch(text);

    if (text.trim() === "") {
      setResults([]);
      return;
    }

    try {
      const pattern = `%${text}%`;
      let query = "";
      let params: any[] = [];

      if (searchTable === "all" || searchTable === "dollar") {
        query += `
        SELECT 'dollar' AS source, id, daily_price AS value, 'قیمت دالر' as title
        FROM Dollar
        WHERE daily_price LIKE ?`;
        params.push(pattern);
      }

      if (searchTable === "all" || searchTable === "shipping") {
        if (query) query += " UNION ";
        query += `
        SELECT 'shipping' AS source, id, rate AS value, state || ' - ' || auction as title
        FROM Shipping
        WHERE state LIKE ? OR auction LIKE ? OR rate LIKE ?`;
        params.push(pattern, pattern, pattern);
      }

      if (searchTable === "all" || searchTable === "car") {
        if (query) query += " UNION ";
        query += `
        SELECT 'car' AS source, id, total_tax AS value, name || ' - ' || modal as title
        FROM Car
        WHERE name LIKE ? OR modal LIKE ? OR total_tax LIKE ?`;
        params.push(pattern, pattern, pattern);
      }

      const res = await db.getAllAsync(query, params);
      setResults(res);
    } catch (error) {
      console.log("Search error:", error);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "car":
        return <FontAwesome name="car" size={16} color="#34C759" />;
      case "shipping":
        return <FontAwesome name="truck" size={16} color="#FF9500" />;
      default:
        return <FontAwesome name="search" size={16} color="#8E8E93" />;
    }
  };

  const refreshPage = () => {
    loadDollarPrice();
    loadStats();
    setSearch("");
    setResults([]);
    setSearchTable("all");
  };

  const getSourceName = (source: string) => {
    switch (source) {
      case "dollar":
        return "قیمت دالر";
      case "car":
        return "موتر";
      case "shipping":
        return "حمل و نقل";
      default:
        return source;
    }
  };

  const getSelectedFilterLabel = () => {
    const selected = searchFilterOptions.find(
      (option) => option.value === searchTable
    );
    return selected ? selected.label : "حمل و نقل";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* هدر صفحه */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>صفحه مدیریت</Text>
          <Text style={styles.headerSubtitle}>خلاصه اطلاعات و جستجو</Text>

          <TouchableOpacity style={styles.refreshBtn} onPress={refreshPage}>
            <FontAwesome name="refresh" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* کارت آمار */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#E3F2FD" }]}>
              <FontAwesome name="dollar" size={24} color="#007AFF" />
            </View>
            <Text style={styles.statValue}>
              {dollarPrice
                ? `${dollarPrice.toLocaleString()} افغانی`
                : "ثبت نشده"}
            </Text>
            <Text style={styles.statLabel}>قیمت دالر</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#E8F5E8" }]}>
              <FontAwesome name="car" size={24} color="#34C759" />
            </View>
            <Text style={styles.statValue}>{stats.carCount}</Text>
            <Text style={styles.statLabel}>تعداد موترها</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#FFF3E0" }]}>
              <FontAwesome name="truck" size={24} color="#FF9500" />
            </View>
            <Text style={styles.statValue}>{stats.shippingCount}</Text>
            <Text style={styles.statLabel}>مسیر حمل</Text>
          </View>
        </View>

        {/* دکمه محاسبه قیمت */}
        <View style={styles.startBtnSection}>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => router.push("/(screen)/FinalCarPriceScreen")}
            activeOpacity={0.7}
          >
            <FontAwesome name="calculator" size={20} color="#fff" />
            <Text style={styles.startBtnText}>محاسبه قیمت نهایی</Text>
          </TouchableOpacity>
        </View>

        {/* بخش جستجو */}
        <View style={styles.searchSection}>
          <View style={styles.searchHeader}>
            <Text style={styles.sectionTitle}>جستجوی پیشرفته</Text>
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                فیلتر: {getSelectedFilterLabel()}
              </Text>
            </View>
          </View>

          {/* فیلتر جستجو با Dropdown */}
          <View style={styles.filterContainer}>
            <CategoryDropdown
              value={searchTable}
              onChange={setSearchTable}
              items={searchFilterOptions}
              placeholder="فیلتر جستجو..."
              label="جستجو در:"
              searchable={true}
            />
          </View>

          {/* نوار جستجو */}
          <View style={styles.searchContainer}>
            <FontAwesome
              name="search"
              size={20}
              color="#8E8E93"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={`جستجو در ${getSelectedFilterLabel().toLowerCase()}...`}
              value={search}
              onChangeText={handleSearch}
              textAlign="right"
            />
            {search.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => setSearch("")}
              >
                <FontAwesome name="times" size={16} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>

          {/* اطلاعات فیلتر فعال */}
          {searchTable !== "all" && (
            <View style={styles.activeFilterInfo}>
              <FontAwesome name="info-circle" size={14} color="#007AFF" />
              <Text style={styles.activeFilterText}>
                جستجو فقط در {getSelectedFilterLabel()} انجام می‌شود
              </Text>
            </View>
          )}
        </View>

        {/* نتایج جستجو */}
        {search.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {`نتایج جستجو برای "${search}"`}
              </Text>
              <View style={styles.resultsCount}>
                <Text style={styles.resultsCountText}>
                  {results.length} نتیجه
                </Text>
              </View>
            </View>

            {results.length > 0 ? (
              <FlatList
                data={results}
                scrollEnabled={false}
                keyExtractor={(item) => `${item.source}-${item.id}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.resultItem,
                      { borderLeftColor: getSourceColor(item.source) },
                    ]}
                  >
                    <View style={styles.resultHeader}>
                      <View style={styles.resultSource}>
                        {getSourceIcon(item.source)}
                        <Text style={styles.resultSourceText}>
                          {getSourceName(item.source)}
                        </Text>
                      </View>
                      <View style={styles.resultBadge}>
                        <Text style={styles.resultBadgeText}>
                          {getSourceName(item.source)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.resultTitle}>{item.title}</Text>
                    <Text style={styles.resultValue}>
                      {getSelectedFilterLabel() === "موترها"
                        ? dollarPrice && Number(dollarPrice) > 0
                          ? (() => {
                              const val = Number(item.value);
                              const conv = Number.isFinite(val)
                                ? val / Number(dollarPrice)
                                : NaN;
                              return Number.isFinite(conv)
                                ? `${conv.toLocaleString()} دالر`
                                : "—";
                            })()
                          : "قیمت دالر ثبت نشده"
                        : (() => {
                            const val = Number(item.value);
                            const formatted = Number.isFinite(val)
                              ? val.toLocaleString()
                              : item.value;
                            const unit =
                              item.source === "dollar" ? "افغانی" : "دالر";
                            return `${formatted} ${unit}`;
                          })()}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.noResults}>
                <FontAwesome name="search" size={48} color="#C7C7CC" />
                <Text style={styles.noResultsText}>نتیجه‌ای یافت نشد</Text>
                <Text style={styles.noResultsSubtext}>
                  {searchTable === "all"
                    ? "سعی کنید عبارت جستجوی خود را تغییر دهید"
                    : `هیچ نتیجه‌ای در ${getSelectedFilterLabel()} یافت نشد`}
                </Text>
                <TouchableOpacity
                  style={styles.changeFilterBtn}
                  onPress={() => setSearchTable("all")}
                >
                  <Text style={styles.changeFilterText}>
                    جستجو در همه جداول
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <FinalPriceList />
      </ScrollView>
    </SafeAreaView>
  );
};

// تابع کمکی برای رنگ‌های منبع
const getSourceColor = (source: string) => {
  switch (source) {
    case "dollar":
      return "#34C759";
    case "car":
      return "#FF9500";
    case "shipping":
      return "#5856D6";
    default:
      return "#007AFF";
  }
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "right",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
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
    backgroundColor: "#fff",
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
    color: "#1a1a1a",
    marginBottom: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  startBtnSection: {
    backgroundColor: "#ffffff",
    margin: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  startBtn: {
    backgroundColor: "#2563eb",
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
    backgroundColor: "#fff",
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
    color: "#1a1a1a",
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
    color: "#007AFF",
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
    backgroundColor: "#fafafa",
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
    color: "#007AFF",
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
    color: "#1a1a1a",
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
    color: "#666",
    fontWeight: "500",
  },
  resultItem: {
    backgroundColor: "#fff",
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
    color: "#666",
    fontWeight: "500",
  },
  resultBadge: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultBadgeText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
    textAlign: "right",
  },
  resultValue: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    textAlign: "right",
  },
  noResults: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginTop: 12,
    marginBottom: 4,
    textAlign: "center",
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 16,
  },
  changeFilterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
  },
  changeFilterText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
});
