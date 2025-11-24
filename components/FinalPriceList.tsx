/* eslint-disable react-hooks/exhaustive-deps */
import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { deleteFinalCarPrice, getFinalCarPrices } from "../db/db";

// ========== TYPES ==========
interface FinalCarPrice {
  id: number;
  final_price: string;
  car_price: string;
  shipping_rate: string;
  total_tax: string;
  timestamp: string;
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
    tertiary: "#8E8E93",
  },
  background: {
    primary: "#fff",
    secondary: "#f5f5f5",
  },
  selection: {
    active: "#e6f2ff",
    border: "#007AFF",
  },
} as const;

// ========== MAIN COMPONENT ==========
const FinalPriceList: React.FC = () => {
  const [records, setRecords] = useState<FinalCarPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);

  // ========== DATA LOADING ==========
  const loadData = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await getFinalCarPrices();
        setRecords(data);

        // فقط اگر در حالت bulk نیستیم، stateها را reset کنیم
        if (!isBulkMode) {
          setSelectedItems(new Set());
        }
      } catch (error) {
        console.error("Error loading records:", error);
        Alert.alert("خطا", "مشکلی در بارگذاری اطلاعات پیش آمد");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isBulkMode]
  ); // وابستگی به isBulkMode

  useEffect(() => {
    loadData();
  }, []); // حذف وابستگی به loadData

  // ========== BULK OPERATIONS ==========
  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.size === 0) return;

    Alert.alert(
      "تأیید حذف گروهی",
      `آیا از حذف ${selectedItems.size} محاسبه انتخاب شده اطمینان دارید؟`,
      [
        { text: "انصراف", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              setRefreshing(true);
              const ids = Array.from(selectedItems);

              // حذف همه آیتم‌های انتخاب شده
              await Promise.all(ids.map((id) => deleteFinalCarPrice(id)));

              // به‌روزرسانی لیست
              setRecords((prev) =>
                prev.filter((item) => !selectedItems.has(item.id))
              );
              setSelectedItems(new Set());
              setIsBulkMode(false);

              Alert.alert("موفق", "محاسبه‌های انتخاب شده با موفقیت حذف شدند");
            } catch (error) {
              console.error("Bulk delete error:", error);
              Alert.alert("خطا", "در حذف محاسبه‌ها مشکلی پیش آمد");
            } finally {
              setRefreshing(false);
            }
          },
        },
      ]
    );
  }, [selectedItems]);

  const toggleSelectItem = useCallback((id: number) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAllItems = useCallback(() => {
    setSelectedItems((prev) => {
      // اگر همه آیتم‌ها انتخاب شده‌اند، همه را پاک کن
      if (prev.size === records.length) {
        return new Set();
      }
      // در غیر این صورت همه را انتخاب کن
      const allIds = new Set(records.map((item) => item.id));
      return allIds;
    });
  }, [records]);

  const exitBulkMode = useCallback(() => {
    setIsBulkMode(false);
    setSelectedItems(new Set());
  }, []);

  const enterBulkMode = useCallback(() => {
    setIsBulkMode(true);
  }, []);

  // ========== SINGLE DELETE ==========
  const handleDelete = useCallback((id: number, carPrice: string) => {
    Alert.alert(
      "تأیید حذف",
      `آیا از حذف محاسبه با قیمت ${Number(
        carPrice
      ).toLocaleString()} افغانی اطمینان دارید؟`,
      [
        { text: "انصراف", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFinalCarPrice(id);
              Alert.alert("موفق", "رکورد با موفقیت حذف شد");
              // استفاده از callback برای به‌روزرسانی state
              setRecords((prev) => prev.filter((item) => item.id !== id));
            } catch (error) {
              console.error("Error deleting record:", error);
              Alert.alert("خطا", "مشکلی در حذف رکورد پیش آمد");
            }
          },
        },
      ]
    );
  }, []);

  // ========== UTILITY FUNCTIONS ==========
  const formatDate = useCallback((iso: string) => {
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
  }, []);

  const getTimeAgo = useCallback(
    (iso: string) => {
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
    },
    [formatDate]
  );

  // ========== RENDER COMPONENTS ==========
  const renderCheckbox = (isSelected: boolean) => (
    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
      {isSelected && <FontAwesome name="check" size={14} color="#fff" />}
    </View>
  );

  const renderBulkActions = () => {
    if (!isBulkMode || selectedItems.size === 0) return null;

    const allSelected = selectedItems.size === records.length;

    return (
      <View style={styles.bulkActionsContainer}>
        <View style={styles.bulkActionsHeader}>
          <Text style={styles.selectedCountText}>
            {selectedItems.size} محاسبه انتخاب شده
          </Text>
          <TouchableOpacity onPress={exitBulkMode}>
            <Text style={styles.clearSelectionText}>انصراف</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bulkActionsButtons}>
          <TouchableOpacity
            style={[styles.bulkActionButton, styles.selectAllButton]}
            onPress={selectAllItems}
          >
            <FontAwesome
              name={allSelected ? "check-square" : "square"}
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.selectAllButtonText}>
              {allSelected ? "لغو" : "انتخاب همه"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bulkActionButton, styles.deleteAllButton]}
            onPress={handleBulkDelete}
            disabled={refreshing}
          >
            <FontAwesome name="trash" size={18} color="#fff" />
            <Text style={styles.deleteAllButtonText}>
              حذف ({selectedItems.size})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRecordCard = (item: FinalCarPrice, index: number) => {
    const isSelected = selectedItems.has(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.card,
          index === 0 && styles.firstCard,
          index === records.length - 1 && styles.lastCard,
          isBulkMode && styles.cardBulkMode,
          isSelected && styles.cardSelected,
        ]}
        onPress={() => {
          if (isBulkMode) {
            toggleSelectItem(item.id);
          }
        }}
        onLongPress={() => {
          if (!isBulkMode) {
            enterBulkMode();
            toggleSelectItem(item.id);
          }
        }}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.priceSection}>
            {isBulkMode && renderCheckbox(isSelected)}
            <FontAwesome name="money" size={20} color="#34C759" />
            <Text style={styles.finalPrice}>
              {Number(item.final_price).toLocaleString()} دالر
            </Text>
          </View>

          {!isBulkMode && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id, item.car_price)}
              >
                <FontAwesome name="trash" size={16} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={styles.breakdown}>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>قیمت موتر</Text>
              <Text style={styles.breakdownValue}>
                {Number(item.car_price).toLocaleString()} دالر
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>هزینه حمل و نقل</Text>
              <Text style={styles.breakdownValue}>
                {Number(item.shipping_rate).toLocaleString()} دالر
              </Text>
            </View>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>مالیات داخل کشور</Text>
              <Text style={styles.breakdownValue}>
                {Number(item.total_tax).toLocaleString()} دالر
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>جمع کل</Text>
              <Text style={[styles.breakdownValue, styles.totalValue]}>
                {Number(item.final_price).toLocaleString()} دالر
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
          <Text style={styles.fullDate}>{formatDate(item.timestamp)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <FontAwesome name="history" size={24} color="#1a1a1a" />
        <Text style={styles.headerTitle}>محاسبات</Text>
      </View>

      <View style={styles.headerActions}>
        <Text style={styles.recordCount}>{records.length} </Text>

        {isBulkMode ? (
          <TouchableOpacity
            style={[styles.bulkModeToggle, styles.bulkModeActive]}
            onPress={exitBulkMode}
          >
            <FontAwesome name="times" size={16} color={COLORS.primary} />
            <Text style={styles.bulkModeText}>لغو</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.bulkModeToggle}
              onPress={enterBulkMode}
            >
              <Text style={styles.bulkModeText}>حذف همه</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.refreshBtn, refreshing && styles.refreshing]}
              onPress={() => loadData(true)}
              disabled={refreshing}
            >
              <FontAwesome
                name="refresh"
                size={16}
                color={refreshing ? "#8E8E93" : COLORS.primary}
              />
              <Text
                style={[
                  styles.refreshText,
                  refreshing && styles.refreshingText,
                ]}
              >
                {refreshing ? "..." : "تازه‌سازی"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      {renderBulkActions()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
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
            <FontAwesome name="refresh" size={16} color={COLORS.primary} />
            <Text style={styles.emptyActionText}>بارگذاری مجدد</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {records.map(renderRecordCard)}
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

// ========== STYLES ==========
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
  bulkModeToggle: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
  },
  bulkModeActive: {
    backgroundColor: "#FFF0F0",
  },
  bulkModeText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  // Bulk Actions Styles
  bulkActionsContainer: {
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bulkActionsHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectedCountText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  clearSelectionText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  bulkActionsButtons: {
    flexDirection: "row-reverse",
    gap: 12,
  },
  bulkActionButton: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  selectAllButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  deleteAllButton: {
    backgroundColor: COLORS.danger,
  },
  selectAllButtonText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  deleteAllButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Checkbox Styles
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginLeft: 8,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  // Card Styles
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
  cardBulkMode: {
    borderLeftColor: "#FF9500",
  },
  cardSelected: {
    backgroundColor: COLORS.selection.active,
    borderWidth: 2,
    borderColor: COLORS.selection.border,
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
  bulkModeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#E3F2FD",
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
  listContainer: {
    flex: 1,
  },
  listFooter: {
    alignItems: "center",
    padding: 16,
  },
  listFooterText: {
    fontSize: 12,
    color: "#999",
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
});

export default FinalPriceList;
