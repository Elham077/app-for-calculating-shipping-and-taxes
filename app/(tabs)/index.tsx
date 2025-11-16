/* eslint-disable react-hooks/exhaustive-deps */
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useNavigation, useRouter } from "expo-router";
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
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState({
    carCount: 0,
    shippingCount: 0,
  });

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
      // Search across multiple tables (Dollar, Shipping, Car)
      const query = `
        SELECT 'dollar' AS source, id, daily_price AS value, 'قیمت دالر' as title
        FROM Dollar
        WHERE daily_price LIKE ?
        UNION
        SELECT 'shipping' AS source, id, rate AS value, state || ' - ' || auction as title
        FROM Shipping
        WHERE state LIKE ? OR auction LIKE ? OR rate LIKE ?
        UNION
        SELECT 'car' AS source, id, total_tax AS value, name || ' - ' || modal as title
        FROM Car
        WHERE name LIKE ? OR modal LIKE ? OR total_tax LIKE ?
      `;

      const pattern = `%${text}%`;
      const res = await db.getAllAsync(query, [
        pattern,
        pattern,
        pattern,
        pattern,
        pattern,
        pattern,
        pattern,
      ]);
      setResults(res);
    } catch (error) {
      console.log("Search error:", error);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "dollar":
        return <FontAwesome name="dollar" size={16} color="#007AFF" />;
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

        <View style={styles.startBtnSection}>
          <TouchableOpacity
            style={styles.startBtnSection}
            onPress={() => router.push("/(screen)/FinalCarPriceScreen")}
          >
            <Text>محاسبه کنید</Text>
          </TouchableOpacity>
        </View>

        {/* بخش جستجو */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>جستجوی پیشرفته</Text>
          <View style={styles.searchContainer}>
            <FontAwesome
              name="search"
              size={20}
              color="#8E8E93"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="جستجو در همه اطلاعات (قیمت، موتر، حمل و نقل)..."
              value={search}
              onChangeText={handleSearch}
              textAlign="right"
            />
          </View>
        </View>

        {/* نتایج جستجو */}
        {search.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>
              {`نتایج جستجو برای "${search}"`}
            </Text>

            {results.length > 0 ? (
              <FlatList
                data={results}
                scrollEnabled={false}
                keyExtractor={(item) => `${item.source}-${item.id}`}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resultItem}>
                    <View style={styles.resultHeader}>
                      <View style={styles.resultSource}>
                        {getSourceIcon(item.source)}
                        <Text style={styles.resultSourceText}>
                          {getSourceName(item.source)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.resultTitle}>{item.title}</Text>
                    <Text style={styles.resultValue}>
                      {item.value.toLocaleString()}{" "}
                      {item.source === "dollar" ? "افغانی" : "?"}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.noResults}>
                <FontAwesome name="search" size={48} color="#C7C7CC" />
                <Text style={styles.noResultsText}>نتیجه‌ای یافت نشد</Text>
                <Text style={styles.noResultsSubtext}>
                  سعی کنید عبارت جستجوی خود را تغییر دهید
                </Text>
              </View>
            )}
          </View>
        )}

        {/* راهنمای سریع */}
        {search.length === 0 && (
          <View style={styles.quickGuide}>
            <Text style={styles.guideTitle}>راهنمای سریع</Text>
            <View style={styles.guideItems}>
              <View style={styles.guideItem}>
                <FontAwesome name="dollar" size={20} color="#007AFF" />
                <Text style={styles.guideText}>مدیریت قیمت دالر</Text>
              </View>
              <View style={styles.guideItem}>
                <FontAwesome name="car" size={20} color="#34C759" />
                <Text style={styles.guideText}>ثبت و مدیریت موترها</Text>
              </View>
              <View style={styles.guideItem}>
                <FontAwesome name="truck" size={20} color="#FF9500" />
                <Text style={styles.guideText}>تعریف مسیرهای حمل</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
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
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "right",
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
  resultsSection: {
    margin: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "right",
  },
  resultItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
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
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  quickGuide: {
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
  guideTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
    textAlign: "right",
  },
  guideItems: {
    gap: 12,
  },
  guideItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  guideText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
});
