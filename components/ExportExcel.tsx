import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Picker } from "@react-native-picker/picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useSQLiteContext } from "expo-sqlite";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { utils, write } from "xlsx";

const ExportExcel: React.FC = () => {
  const db = useSQLiteContext();
  const [table, setTable] = useState<string>("Shipping");
  const [loading, setLoading] = useState(false);
  const [exportStats, setExportStats] = useState({
    totalRecords: 0,
    fileSize: "0 KB",
    fileName: "",
  });

  const tableConfig = {
    Dollar: {
      name: "قیمت دالر",
      description: "تاریخچه قیمت‌های دالر",
      icon: "dollar",
    },
    Car: {
      name: "موترها",
      description: "لیست موترها و مالیات آنها",
      icon: "car",
    },
    Shipping: {
      name: "حمل و نقل",
      description: "مسیرهای حمل و نرخ‌های مربوطه",
      icon: "truck",
    },
    final_car_prices: {
      name: "قیمت‌های نهایی",
      description: "تاریخچه محاسبات قیمت نهایی موتر",
      icon: "calculator",
    },
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setExportStats({ totalRecords: 0, fileSize: "0 KB", fileName: "" });

      // 1. Load data with progress
      const rows: any[] = await db.getAllAsync(`SELECT * FROM ${table}`);

      if (rows.length === 0) {
        Alert.alert(
          "خطا ❌",
          `هیچ تاریخچه یی در جدول "${
            tableConfig[table as keyof typeof tableConfig].name
          }" یافت نشد`
        );
        setLoading(false);
        return;
      }

      setExportStats((prev) => ({ ...prev, totalRecords: rows.length }));

      // 2. Prepare worksheet
      const ws = utils.json_to_sheet(rows);

      // حذف تنظیمات ناسازگار با موبایل
      delete ws["!cols"];

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, table);

      // 3. Generate Excel file
      const wbout = write(wb, {
        type: "base64",
        bookType: "xlsx",
        bookSST: false,
      });

      const baseDir =
        FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? "";
      const fileName = `${table}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      const fileUri = `${baseDir}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 4. Get file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      const fileSize = fileInfo.exists ? formatFileSize(fileInfo.size) : "0 KB";

      setExportStats({
        totalRecords: rows.length,
        fileSize,
        fileName,
      });

      // 5. Share / Download
      if (Platform.OS === "ios" || Platform.OS === "android") {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            dialogTitle: `خروجی ${
              tableConfig[table as keyof typeof tableConfig].name
            }`,
          });
        } else {
          Alert.alert(
            "موفقیت ✅",
            `فایل Excel ساخته شد:\n\n📊 تعداد تاریخچه ها: ${rows.length}\n💾 حجم فایل: ${fileSize}\n\nمسیر فایل: ${fileUri}`
          );
        }
      } else {
        Alert.alert(
          "موفقیت ✅",
          `فایل Excel ساخته شد:\n\n📊 تعداد تاریخچه ها: ${rows.length}\n💾 حجم فایل: ${fileSize}\n\nمسیر فایل: ${fileUri}`
        );
      }
    } catch (error) {
      console.log("Export Excel error:", error);
      Alert.alert(
        "خطا ❌",
        "خطا در ساخت فایل Excel. لطفاً اطمینان حاصل کنید که اطلاعات معتبری در جدول وجود دارد."
      );
    } finally {
      setLoading(false);
    }
  };

  const getTableInfo = async () => {
    try {
      const countResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${table}`
      );
      return countResult?.count || 0;
    } catch (error) {
      console.log("Error getting table info:", error);
      return 0;
    }
  };

  const [tableCount, setTableCount] = useState(0);

  React.useEffect(() => {
    const loadTableCount = async () => {
      const count = await getTableInfo();
      setTableCount(count);
    };
    loadTableCount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  return (
    <ScrollView style={styles.container}>
      {/* هدر */}
      <View style={styles.header}>
        <FontAwesome name="download" size={24} color="#007AFF" />
        <Text style={styles.headerTitle}>خروجی اطلاعات به Excel</Text>
      </View>

      {/* انتخاب جدول */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>انتخاب جدول مبدأ</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={table}
            onValueChange={(value) => setTable(value)}
            style={styles.picker}
          >
            {Object.entries(tableConfig).map(([key, config]) => (
              <Picker.Item key={key} label={config.name} value={key} />
            ))}
          </Picker>
        </View>
      </View>

      {/* اطلاعات جدول */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>اطلاعات جدول انتخابی</Text>
        <View style={styles.tableInfo}>
          <View style={styles.infoRow}>
            <FontAwesome
              name={tableConfig[table as keyof typeof tableConfig].icon as any}
              size={18}
              color="#007AFF"
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>نام جدول:</Text>
              <Text style={styles.infoValue}>
                {tableConfig[table as keyof typeof tableConfig].name}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <FontAwesome name="info-circle" size={18} color="#FF9500" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>توضیحات:</Text>
              <Text style={styles.infoValue}>
                {tableConfig[table as keyof typeof tableConfig].description}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <FontAwesome name="database" size={18} color="#34C759" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>تعداد تاریخچه ها:</Text>
              <Text style={[styles.infoValue, styles.recordCount]}>
                {tableCount} رکورد
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* دکمه export */}
      <TouchableOpacity
        style={[styles.exportBtn, loading && styles.exportBtnDisabled]}
        onPress={handleExport}
        disabled={loading || tableCount === 0}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <FontAwesome name="download" size={20} color="#fff" />
        )}
        <Text style={styles.exportText}>
          {loading
            ? "در حال ساخت فایل..."
            : tableCount === 0
            ? "جدول خالی است"
            : "دریافت خروجی Excel"}
        </Text>
      </TouchableOpacity>

      {/* آمار export */}
      {exportStats.totalRecords > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>📊 اطلاعات فایل خروجی:</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <FontAwesome name="file-text-o" size={20} color="#007AFF" />
              <Text style={styles.statNumber}>{exportStats.totalRecords}</Text>
              <Text style={styles.statLabel}>تعداد تاریخچه ها</Text>
            </View>
            <View style={styles.statItem}>
              <FontAwesome name="hdd-o" size={20} color="#34C759" />
              <Text style={styles.statNumber}>{exportStats.fileSize}</Text>
              <Text style={styles.statLabel}>حجم فایل</Text>
            </View>
            <View style={styles.statItem}>
              <FontAwesome name="calendar" size={20} color="#FF9500" />
              <Text style={styles.statNumber}>
                {new Date().toLocaleDateString("fa-IR")}
              </Text>
              <Text style={styles.statLabel}>تاریخ خروجی</Text>
            </View>
          </View>
        </View>
      )}

      {/* راهنمای استفاده */}
      <View style={styles.guideSection}>
        <Text style={styles.guideTitle}>💡 راهنمای استفاده:</Text>
        <View style={styles.guideList}>
          <Text style={styles.guideItem}>
            • فایل خروجی با قالب معیاری Excel ساخته می‌شود
          </Text>
          <Text style={styles.guideItem}>
            • اطلاعات به صورت راست‌چین در فایل قرار می‌گیرند
          </Text>
          <Text style={styles.guideItem}>
            • می‌توانید فایل را در Excel، Google Sheets یا LibreOffice باز کنید
          </Text>
          <Text style={styles.guideItem}>
            • فایل شامل تمامی تاریخچه های جدول انتخابی خواهد بود
          </Text>
          <Text style={styles.guideItem}>
            • نام فایل شامل تاریخ روز جاری می‌باشد
          </Text>
        </View>
      </View>

      {/* نکات فنی */}
      <View style={styles.techSection}>
        <Text style={styles.techTitle}>🔧 نکات فنی:</Text>
        <Text style={styles.techText}>
          قالب فایل: XLSX (Excel){"\n"}
          کدگذاری: UTF-8{"\n"}
          حداکثر سایز: بدون محدودیت{"\n"}
          سازگاری: Excel 2007 به بعد
        </Text>
      </View>
    </ScrollView>
  );
};

export default ExportExcel;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "right",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fafafa",
  },
  picker: {
    height: 50,
  },
  tableInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  recordCount: {
    color: "#34C759",
    fontWeight: "700",
  },
  exportBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#007AFF",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  exportBtnDisabled: {
    backgroundColor: "#C7C7CC",
  },
  exportText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  statsContainer: {
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
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
    textAlign: "right",
  },
  statsGrid: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  guideSection: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#34C759",
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "right",
  },
  guideList: {
    gap: 8,
  },
  guideItem: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    textAlign: "right",
  },
  techSection: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
    marginBottom: 20,
  },
  techTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "right",
  },
  techText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    textAlign: "right",
  },
});
