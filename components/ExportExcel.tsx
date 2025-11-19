import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
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

type ExportStep = "select-table" | "preparing" | "ready" | "complete";

const ExportExcel: React.FC = () => {
  const db = useSQLiteContext();
  const [table, setTable] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<ExportStep>("select-table");
  const [loading, setLoading] = useState(false);
  const [exportStats, setExportStats] = useState({
    totalRecords: 0,
    fileSize: "0 KB",
    fileName: "",
    fileUri: "",
  });
  const [tableCounts, setTableCounts] = useState<{ [key: string]: number }>({});

  const tableConfig = {
    Car: {
      name: "موترها",
      description: "لیست موترها و مالیات آنها",
      icon: "car",
      color: "#007AFF",
    },
    Shipping: {
      name: "حمل و نقل",
      description: "مسیرهای حمل و نرخ‌های مربوطه",
      icon: "truck",
      color: "#34C759",
    },
    final_car_prices: {
      name: "قیمت‌های نهایی",
      description: "تاریخچه محاسبات قیمت نهایی موتر",
      icon: "calculator",
      color: "#FF9500",
    },
  };

  const steps = [
    { key: "select-table", title: "انتخاب جدول", icon: "table" },
    { key: "preparing", title: "آماده‌سازی", icon: "cog" },
    { key: "ready", title: "آماده دریافت", icon: "check" },
    { key: "complete", title: "اتمام", icon: "share" },
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTableInfo = async (tableName: string) => {
    try {
      const countResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${tableName}`
      );
      return countResult?.count || 0;
    } catch (error) {
      console.log("Error getting table info:", error);
      return 0;
    }
  };

  const [tableCount, setTableCount] = useState(0);

  useEffect(() => {
    if (table) {
      const loadTableCount = async () => {
        const count = await getTableInfo(table);
        setTableCount(count);
      };
      loadTableCount();
    }
  }, [table]);

  const handleTableSelect = (selectedTable: string) => {
    setTable(selectedTable);
  };

  const handlePrepareExport = async () => {
    if (!table || tableCount === 0) {
      Alert.alert("خطا", "لطفاً جدولی با داده انتخاب کنید");
      return;
    }

    setCurrentStep("preparing");
    setLoading(true);

    try {
      // 1. Load data
      const rows: any[] = await db.getAllAsync(`SELECT * FROM ${table}`);

      if (rows.length === 0) {
        Alert.alert("خطا", "جدول انتخاب شده خالی است");
        setCurrentStep("select-table");
        setLoading(false);
        return;
      }

      // 2. Prepare worksheet
      const ws = utils.json_to_sheet(rows);
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
        fileUri,
      });

      setCurrentStep("ready");
    } catch (error) {
      console.log("Export preparation error:", error);
      Alert.alert("خطا", "مشکلی در آماده‌سازی فایل پیش آمد");
      setCurrentStep("select-table");
    } finally {
      setLoading(false);
    }
  };

  const handleShareFile = async () => {
    try {
      if (Platform.OS === "ios" || Platform.OS === "android") {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(exportStats.fileUri, {
            mimeType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            dialogTitle: `خروجی ${
              tableConfig[table as keyof typeof tableConfig].name
            }`,
          });
          setCurrentStep("complete");
        } else {
          Alert.alert(
            "موفقیت ✅",
            `فایل Excel ساخته شد:\n\n📊 تعداد رکوردها: ${exportStats.totalRecords}\n💾 حجم فایل: ${exportStats.fileSize}`
          );
          setCurrentStep("complete");
        }
      } else {
        Alert.alert(
          "موفقیت ✅",
          `فایل Excel ساخته شد:\n\n📊 تعداد رکوردها: ${exportStats.totalRecords}\n💾 حجم فایل: ${exportStats.fileSize}`
        );
        setCurrentStep("complete");
      }
    } catch (error) {
      console.log("Share error:", error);
      Alert.alert("خطا", "مشکلی در اشتراک‌گذاری فایل پیش آمد");
    }
  };

  const resetProcess = () => {
    setTable("");
    setCurrentStep("select-table");
    setExportStats({
      totalRecords: 0,
      fileSize: "0 KB",
      fileName: "",
      fileUri: "",
    });
  };
  useEffect(() => {
    const loadAllCounts = async () => {
      const result: any = {};
      for (const key of Object.keys(tableConfig)) {
        result[key] = await getTableInfo(key);
      }
      setTableCounts(result);
    };

    loadAllCounts();
  }, []);

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => {
          const isActive = step.key === currentStep;
          const isCompleted =
            steps.findIndex((s) => s.key === currentStep) > index;

          return (
            <View key={step.key} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isCompleted && styles.stepCircleCompleted,
                ]}
              >
                {isCompleted ? (
                  <FontAwesome name="check" size={16} color="#fff" />
                ) : (
                  <FontAwesome
                    name={step.icon as any}
                    size={16}
                    color={isActive ? "#007AFF" : "#8E8E93"}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepText,
                  isActive && styles.stepTextActive,
                  isCompleted && styles.stepTextCompleted,
                ]}
              >
                {step.title}
              </Text>
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    isCompleted && styles.stepLineCompleted,
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderSelectTableStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>
        لطفاً جدول مورد نظر برای خروجی را انتخاب کنید
      </Text>

      <View style={styles.tablesGrid}>
        {Object.entries(tableConfig).map(([key, config]) => {
          const count = tableCounts[key] || 0;

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.tableCard,
                table === key && styles.tableCardSelected,
              ]}
              onPress={() => handleTableSelect(key)}
            >
              <View
                style={[
                  styles.tableIcon,
                  { backgroundColor: config.color + "20" },
                ]}
              >
                <FontAwesome
                  name={config.icon as any}
                  size={24}
                  color={config.color}
                />
              </View>

              <Text style={styles.tableName}>{config.name}</Text>
              <Text style={styles.tableDescription}>{config.description}</Text>

              <View style={styles.tableStats}>
                <FontAwesome name="database" size={12} color="#666" />
                <Text style={styles.tableCount}>{count} رکورد</Text>
              </View>

              {table === key && (
                <View style={styles.selectedBadge}>
                  <FontAwesome name="check" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {table && (
        <TouchableOpacity
          style={[
            styles.continueBtn,
            tableCount === 0 && styles.continueBtnDisabled,
          ]}
          onPress={handlePrepareExport}
          disabled={tableCount === 0}
        >
          <FontAwesome name="arrow-left" size={16} color="#fff" />
          <Text style={styles.continueBtnText}>
            {tableCount === 0 ? "جدول خالی است" : "ادامه و آماده‌سازی فایل"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPreparingStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>در حال آماده‌سازی فایل خروجی</Text>

      <ActivityIndicator
        size="large"
        color="#007AFF"
        style={styles.loadingSpinner}
      />

      <View style={styles.preparingContent}>
        <FontAwesome name="file-excel-o" size={48} color="#34C759" />
        <Text style={styles.preparingText}>
          در حال پردازش {tableCount} رکورد از جدول{" "}
          {tableConfig[table as keyof typeof tableConfig].name}
        </Text>
      </View>
    </View>
  );

  const renderReadyStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.readyIcon}>
        <FontAwesome name="file-excel-o" size={64} color="#34C759" />
      </View>

      <Text style={styles.readyTitle}>فایل خروجی آماده است</Text>

      <View style={styles.fileInfoCard}>
        <View style={styles.fileInfoRow}>
          <FontAwesome name="file-text-o" size={20} color="#007AFF" />
          <View style={styles.fileInfoContent}>
            <Text style={styles.fileInfoLabel}>نام فایل</Text>
            <Text style={styles.fileInfoValue}>{exportStats.fileName}</Text>
          </View>
        </View>

        <View style={styles.fileInfoRow}>
          <FontAwesome name="database" size={20} color="#34C759" />
          <View style={styles.fileInfoContent}>
            <Text style={styles.fileInfoLabel}>تعداد رکوردها</Text>
            <Text style={styles.fileInfoValue}>
              {exportStats.totalRecords} رکورد
            </Text>
          </View>
        </View>

        <View style={styles.fileInfoRow}>
          <FontAwesome name="hdd-o" size={20} color="#FF9500" />
          <View style={styles.fileInfoContent}>
            <Text style={styles.fileInfoLabel}>حجم فایل</Text>
            <Text style={styles.fileInfoValue}>{exportStats.fileSize}</Text>
          </View>
        </View>
      </View>

      <View style={styles.readyActions}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShareFile}>
          <FontAwesome name="share" size={20} color="#fff" />
          <Text style={styles.shareBtnText}>اشتراک‌گذاری فایل</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={resetProcess}>
          <Text style={styles.secondaryBtnText}>خروجی جدید</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.completeIcon}>
        <FontAwesome name="check-circle" size={64} color="#34C759" />
      </View>

      <Text style={styles.completeTitle}>خروجی با موفقیت انجام شد</Text>

      <View style={styles.completeStats}>
        <View style={styles.completeStat}>
          <Text style={styles.completeStatNumber}>
            {exportStats.totalRecords}
          </Text>
          <Text style={styles.completeStatLabel}>رکورد خروجی گرفته شده</Text>
        </View>
        <View style={styles.completeStat}>
          <Text style={styles.completeStatNumber}>{exportStats.fileSize}</Text>
          <Text style={styles.completeStatLabel}>حجم فایل</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.restartBtn} onPress={resetProcess}>
        <FontAwesome name="refresh" size={16} color="#007AFF" />
        <Text style={styles.restartBtnText}>خروجی جدید از جدول دیگر</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* هدر */}
      <View style={styles.header}>
        <FontAwesome name="download" size={24} color="#007AFF" />
        <Text style={styles.headerTitle}>خروجی اطلاعات به Excel</Text>
      </View>

      {/* نمایش مراحل */}
      {renderStepIndicator()}

      {/* محتوای هر مرحله */}
      {currentStep === "select-table" && renderSelectTableStep()}
      {currentStep === "preparing" && renderPreparingStep()}
      {currentStep === "ready" && renderReadyStep()}
      {currentStep === "complete" && renderCompleteStep()}

      {/* راهنمای استفاده */}
      {currentStep === "select-table" && (
        <View style={styles.guideSection}>
          <Text style={styles.guideTitle}>💡 راهنمای خروجی گرفتن:</Text>
          <Text style={styles.guideText}>
            • جدول مورد نظر را انتخاب کنید{"\n"}• فایل Excel با فرمت استاندارد
            ساخته می‌شود{"\n"}• می‌توانید فایل را در نرم‌افزارهای مختلف باز کنید
            {"\n"}• فایل شامل تمامی داده‌های جدول انتخابی خواهد بود
          </Text>
        </View>
      )}
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
  stepsContainer: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 8,
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: "#E3F2FD",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  stepCircleCompleted: {
    backgroundColor: "#34C759",
  },
  stepText: {
    fontSize: 10,
    color: "#8E8E93",
    fontWeight: "500",
    textAlign: "center",
  },
  stepTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  stepTextCompleted: {
    color: "#34C759",
  },
  stepLine: {
    position: "absolute",
    top: 18,
    left: -40,
    width: 80,
    height: 2,
    backgroundColor: "#f0f0f0",
    zIndex: -1,
  },
  stepLineCompleted: {
    backgroundColor: "#34C759",
  },
  stepContent: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 28,
  },
  tablesGrid: {
    gap: 16,
  },
  tableCard: {
    backgroundColor: "#fafafa",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  tableCardSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#007AFF",
  },
  tableIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  tableName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
    textAlign: "right",
  },
  tableDescription: {
    fontSize: 13,
    color: "#666",
    textAlign: "right",
    marginBottom: 12,
    lineHeight: 20,
  },
  tableStats: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  tableCount: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  selectedBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#34C759",
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  continueBtnDisabled: {
    backgroundColor: "#C7C7CC",
  },
  continueBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingSpinner: {
    marginVertical: 30,
  },
  preparingContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  preparingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
  readyIcon: {
    alignItems: "center",
    marginBottom: 24,
  },
  readyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 24,
  },
  fileInfoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  fileInfoRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  fileInfoContent: {
    flex: 1,
  },
  fileInfoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  fileInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  readyActions: {
    gap: 12,
  },
  shareBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#34C759",
    padding: 16,
    borderRadius: 12,
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryBtn: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  completeIcon: {
    alignItems: "center",
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 30,
  },
  completeStats: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  completeStat: {
    alignItems: "center",
  },
  completeStatNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#34C759",
  },
  completeStatLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  restartBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    padding: 16,
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    alignSelf: "center",
  },
  restartBtnText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  guideSection: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "right",
  },
  guideText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    textAlign: "right",
  },
});
