import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from "react-native";
import { getFinalCarPrices, deleteFinalCarPrice } from "../helper/db";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const FinalPriceList: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --------- Load Records ---------
  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const data = await getFinalCarPrices();
      setRecords(data);
    } catch (error) {
      console.log("Error loading records:", error);
      Alert.alert("خطا", "مشکلی در بارگذاری اطلاعات پیش آمد");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --------- Delete Record ---------
  const handleDelete = (id: number, carPrice: string) => {
    Alert.alert(
      "تأیید حذف",
      `آیا از حذف محاسبه با قیمت ${Number(carPrice).toLocaleString()} افغانی اطمینان دارید؟`,
      [
        { text: "انصراف", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFinalCarPrice(id);
              Alert.alert("موفق", "رکورد با موفقیت حذف شد");
              loadData();
            } catch (error) {
              console.log("Error deleting record:", error);
              Alert.alert("خطا", "مشکلی در حذف رکورد پیش آمد");
            }
          },
        },
      ]
    );
  };

  // --------- Date Format ---------
  const formatDate = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  // --------- Calculate Time Ago ---------
  const getTimeAgo = (iso: string) => {
    try {
      const now = new Date();
      const recordDate = new Date(iso);
      const diffInMs = now.getTime() - recordDate.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) return "همین الان";
      if (diffInMinutes < 60) return `${diffInMinutes} دقیقه قبل`;
      if (diffInHours < 24) return `${diffInHours} ساعت قبل`;
      if (diffInDays < 7) return `${diffInDays} روز قبل`;
      
      return formatDate(iso);
    } catch {
      return iso;
    }
  };

  // --------- Render Each Row ---------
  const renderRows = () =>
    records.map((item, index) => (
      <View key={item.id} style={[
        styles.card,
        index === 0 && styles.firstCard,
        index === records.length - 1 && styles.lastCard
      ]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.priceSection}>
            <FontAwesome name="money" size={20} color="#34C759" />
            <Text style={styles.finalPrice}>
              {Number(item.final_price).toLocaleString()} دالر
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id, item.car_price)}
          >
            <FontAwesome name="trash" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        {/* Price Breakdown */}
        <View style={styles.breakdown}>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>قیمت موتر</Text>
              <Text style={styles.breakdownValue}>
                {Number(item.car_price).toLocaleString()}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>هزینه حمل و نقل</Text>
              <Text style={styles.breakdownValue}>
                {Number(item.shipping_rate).toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>مالیات داخل کشور</Text>
              <Text style={styles.breakdownValue}>
                {Number(item.total_tax).toLocaleString()}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>جمع کل</Text>
              <Text style={[styles.breakdownValue, styles.totalValue]}>
                {Number(item.final_price).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.timeInfo}>
            <FontAwesome name="clock-o" size={12} color="#8E8E93" />
            <Text style={styles.timeText}>{getTimeAgo(item.timestamp)}</Text>
          </View>
          <Text style={styles.fullDate}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
      </View>
    ));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <FontAwesome name="history" size={24} color="#1a1a1a" />
          <Text style={styles.headerTitle}>تاریخچه محاسبات</Text>
        </View>
        
        <View style={styles.headerActions}>
          <Text style={styles.recordCount}>
            {records.length} محاسبه
          </Text>
          <TouchableOpacity 
            style={[styles.refreshBtn, refreshing && styles.refreshing]}
            onPress={() => loadData(true)}
            disabled={refreshing}
          >
            <FontAwesome 
              name="refresh" 
              size={16} 
              color={refreshing ? "#8E8E93" : "#007AFF"} 
            />
            <Text style={[
              styles.refreshText,
              refreshing && styles.refreshingText
            ]}>
              {refreshing ? "در حال بارگذاری..." : "تازه‌سازی"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>در حال بارگذاری تاریخچه...</Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="file-text-o" size={64} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>تاریخچه‌ای موجود نیست</Text>
          <Text style={styles.emptySubtitle}>
            پس از انجام محاسبات قیمت خودرو، تاریخچه اینجا نمایش داده می‌شود
          </Text>
          <TouchableOpacity 
            style={styles.emptyActionBtn}
            onPress={() => loadData(true)}
          >
            <FontAwesome name="refresh" size={16} color="#007AFF" />
            <Text style={styles.emptyActionText}>بارگذاری مجدد</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderRows()}
          <View style={styles.listFooter}>
            <Text style={styles.listFooterText}>
              نمایش {records.length} محاسبه
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default FinalPriceList;

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 16,
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerContent: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  headerActions: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  recordCount: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refreshBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
  },
  refreshing: {
    opacity: 0.6,
  },
  refreshText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  refreshingText: {
    color: "#8E8E93",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  listContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  firstCard: {
    marginTop: 4,
  },
  lastCard: {
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceSection: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  finalPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#34C759",
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#FFF0F0",
  },
  breakdown: {
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  breakdownItem: {
    flex: 1,
    alignItems: "flex-end",
  },
  breakdownLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1a1a1a",
  },
  totalValue: {
    color: "#34C759",
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  timeInfo: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  fullDate: {
    fontSize: 11,
    color: "#999",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActionBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
  },
  emptyActionText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  listFooter: {
    alignItems: "center",
    padding: 16,
  },
  listFooterText: {
    fontSize: 12,
    color: "#999",
  },
});