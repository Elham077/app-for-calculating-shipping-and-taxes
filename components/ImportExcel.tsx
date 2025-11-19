import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useSQLiteContext } from "expo-sqlite";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { read, utils } from "xlsx";

type ImportStep = "select-table" | "select-file" | "importing" | "complete";

const ImportExcel: React.FC = () => {
  const db = useSQLiteContext();
  const [table, setTable] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<ImportStep>("select-table");
  const [loading, setLoading] = useState(false);
  const [importStats, setImportStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
  });

  const tableConfig = {
    Car: {
      name: "موترها",
      columns: ["name", "modal", "total_tax"],
      sample: [{ name: "تویوتا", modal: "کمری", total_tax: 15000 }],
      icon: "car",
      color: "#007AFF",
    },
    Shipping: {
      name: "حمل و نقل",
      columns: ["state", "auction", "rate"],
      sample: [{ state: "کابل", auction: "مزایده مرکزی", rate: 5000 }],
      icon: "truck",
      color: "#34C759",
    },
    final_car_prices: {
      name: "قیمت‌های نهایی",
      columns: ["car_price", "shipping_rate", "total_tax", "final_price"],
      sample: [
        {
          car_price: 500000,
          shipping_rate: 5000,
          total_tax: 15000,
          final_price: 520000,
        },
      ],
      icon: "calculator",
      color: "#FF9500",
    },
  };

  const steps = [
    { key: "select-table", title: "انتخاب جدول", icon: "table" },
    { key: "select-file", title: "انتخاب فایل", icon: "file-excel-o" },
    { key: "importing", title: "در حال وارد کردن", icon: "upload" },
    { key: "complete", title: "اتمام", icon: "check" },
  ];

  const handleTableSelect = (selectedTable: string) => {
    setTable(selectedTable);
    setCurrentStep("select-file");
  };

  const handleFileSelect = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets?.[0]?.uri) {
        return;
      }

      const file = res.assets[0];
      setSelectedFile(file);

      // اعتبارسنجی اولیه فایل
      try {
        const fileBase64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const workbook = read(fileBase64, { type: "base64" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data: any[] = utils.sheet_to_json(sheet);

        if (data.length === 0) {
          Alert.alert("خطا", "فایل Excel خالی است");
          return;
        }

        // چک کردن ستون‌ها
        const config = tableConfig[table as keyof typeof tableConfig];
        const fileColumns = Object.keys(data[0]);

        const missingColumns = config.columns.filter(
          (col) => !fileColumns.includes(col)
        );
        if (missingColumns.length > 0) {
          Alert.alert(
            "خطا در ساختار فایل",
            `ستون‌های زیر در فایل موجود نیستند:\n\n${missingColumns.join("\n")}`
          );
          return;
        }

        Alert.alert(
          "فایل معتبر ✅",
          `فایل با ${data.length} رکورد یافت شد. آیا می‌خواهید وارد کردن را شروع کنید؟`,
          [
            { text: "انصراف", style: "cancel" },
            {
              text: "شروع وارد کردن",
              onPress: () => {
                setCurrentStep("importing");
                handleImport(file.uri, data);
              },
            },
          ]
        );
      } catch (error) {
        Alert.alert("خطا", "فایل Excel معتبر نیست یا آسیب دیده است");
      }
    } catch (error) {
      console.log("File selection error:", error);
      Alert.alert("خطا", "مشکلی در انتخاب فایل پیش آمد");
    }
  };

  const handleImport = async (fileUri: string, data: any[]) => {
    try {
      setLoading(true);
      setImportStats({ total: data.length, success: 0, failed: 0 });

      const config = tableConfig[table as keyof typeof tableConfig];
      let successCount = 0;
      let failedCount = 0;

      await db.execAsync("BEGIN TRANSACTION");

      try {
        for (const [index, row] of data.entries()) {
          try {
            const values = config.columns.map((col) => {
              const value = row[col];
              // تبدیل مقادیر عددی
              if (
                col.includes("price") ||
                col.includes("rate") ||
                col.includes("tax")
              ) {
                const numValue = Number(value);
                return isNaN(numValue) ? 0 : numValue;
              }
              return value || "";
            });

            const placeholders = config.columns.map(() => "?").join(", ");
            await db.runAsync(
              `INSERT OR REPLACE INTO ${table} (${config.columns.join(
                ", "
              )}) VALUES (${placeholders})`,
              values
            );
            successCount++;
          } catch (rowError) {
            console.log(`Error in row ${index + 1}:`, rowError);
            failedCount++;
          }

          // بروزرسانی آمار در زمان واقعی
          setImportStats({
            total: data.length,
            success: successCount,
            failed: failedCount,
          });
        }

        await db.execAsync("COMMIT");
        setCurrentStep("complete");

        // نمایش نتیجه نهایی
        if (failedCount === 0) {
          Alert.alert(
            "موفقیت کامل ✅",
            `تمام ${successCount} رکورد با موفقیت در جدول "${config.name}" وارد شدند.`
          );
        } else {
          Alert.alert(
            "اتمام با اخطار ⚠️",
            `عملیات وارد کردن کامل شد:\n\n✅ ${successCount} رکورد موفق\n❌ ${failedCount} رکورد ناموفق`
          );
        }
      } catch (transactionError) {
        await db.execAsync("ROLLBACK");
        throw transactionError;
      }
    } catch (error) {
      console.log("Import Excel error:", error);
      Alert.alert(
        "خطا در وارد کردن ❌",
        "خطا در پردازش فایل Excel. لطفاً از صحت داده‌ها اطمینان حاصل کنید."
      );
      setCurrentStep("select-file");
    } finally {
      setLoading(false);
    }
  };

  const resetProcess = () => {
    setTable("");
    setSelectedFile(null);
    setCurrentStep("select-table");
    setImportStats({ total: 0, success: 0, failed: 0 });
  };

  const showSampleFormat = () => {
    if (!table) return;

    const config = tableConfig[table as keyof typeof tableConfig];
    const sample = config.sample[0];

    const sampleText = config.columns
      .map((col) => `${col}: ${(sample as Record<string, any>)[col]}`)
      .join("\n");

    Alert.alert(
      `قالب نمونه برای ${config.name}`,
      `فایل Excel شما باید شامل ستون‌های زیر باشد:\n\n${sampleText}\n\nنام ستون‌ها باید دقیقاً مطابق بالا باشد.`
    );
  };

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
      <Text style={styles.stepTitle}>لطفاً جدول مقصد را انتخاب کنید</Text>

      <View style={styles.tablesGrid}>
        {Object.entries(tableConfig).map(([key, config]) => (
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
            <Text style={styles.tableColumns}>{config.columns.join("، ")}</Text>
            <View style={styles.tableInfo}>
              <FontAwesome name="columns" size={12} color="#666" />
              <Text style={styles.tableInfoText}>
                {config.columns.length} ستون
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.sampleBtn} onPress={showSampleFormat}>
        <FontAwesome name="info-circle" size={16} color="#007AFF" />
        <Text style={styles.sampleText}>مشاهده قالب نمونه همه جداول</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSelectFileStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>فایل Excel را انتخاب کنید</Text>

      <View style={styles.selectedTableInfo}>
        <FontAwesome
          name={tableConfig[table as keyof typeof tableConfig].icon as any}
          size={20}
          color={tableConfig[table as keyof typeof tableConfig].color}
        />
        <Text style={styles.selectedTableText}>
          جدول: {tableConfig[table as keyof typeof tableConfig].name}
        </Text>
      </View>

      <TouchableOpacity style={styles.fileSelectBtn} onPress={handleFileSelect}>
        <FontAwesome name="file-excel-o" size={48} color="#34C759" />
        <Text style={styles.fileSelectTitle}>انتخاب فایل Excel</Text>
        <Text style={styles.fileSelectSubtitle}>
          فایل باید با فرمت .xlsx باشد و شامل ستون‌های مورد نیاز باشد
        </Text>
      </TouchableOpacity>

      {selectedFile && (
        <View style={styles.selectedFile}>
          <FontAwesome name="check-circle" size={20} color="#34C759" />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{selectedFile.name}</Text>
            <Text style={styles.fileSize}>
              {(selectedFile.size / 1024).toFixed(1)} KB
            </Text>
          </View>
        </View>
      )}

      <View style={styles.stepActions}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setCurrentStep("select-table")}
        >
          <FontAwesome name="arrow-right" size={16} color="#007AFF" />
          <Text style={styles.backBtnText}>بازگشت</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderImportingStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>در حال وارد کردن داده‌ها</Text>

      <ActivityIndicator
        size="large"
        color="#007AFF"
        style={styles.loadingSpinner}
      />

      <View style={styles.progressContainer}>
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.progressNumber}>{importStats.total}</Text>
            <Text style={styles.progressLabel}>کل رکوردها</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={[styles.progressNumber, styles.progressSuccess]}>
              {importStats.success}
            </Text>
            <Text style={styles.progressLabel}>موفق</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={[styles.progressNumber, styles.progressFailed]}>
              {importStats.failed}
            </Text>
            <Text style={styles.progressLabel}>ناموفق</Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${
                  importStats.total > 0
                    ? (importStats.success / importStats.total) * 100
                    : 0
                }%`,
              },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          {Math.round((importStats.success / importStats.total) * 100)}% تکمیل
        </Text>
      </View>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.completeIcon}>
        <FontAwesome name="check-circle" size={64} color="#34C759" />
      </View>

      <Text style={styles.completeTitle}>وارد کردن با موفقیت انجام شد</Text>

      <View style={styles.finalStats}>
        <View style={styles.finalStat}>
          <Text style={styles.finalStatNumber}>{importStats.success}</Text>
          <Text style={styles.finalStatLabel}>رکورد موفق</Text>
        </View>
        <View style={styles.finalStat}>
          <Text style={[styles.finalStatNumber, styles.finalStatFailed]}>
            {importStats.failed}
          </Text>
          <Text style={styles.finalStatLabel}>رکورد ناموفق</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.restartBtn} onPress={resetProcess}>
        <FontAwesome name="refresh" size={16} color="#007AFF" />
        <Text style={styles.restartBtnText}>وارد کردن فایل جدید</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* هدر */}
      <View style={styles.header}>
        <FontAwesome name="upload" size={24} color="#007AFF" />
        <Text style={styles.headerTitle}>ورود اطلاعات از Excel</Text>
      </View>

      {/* نمایش مراحل */}
      {renderStepIndicator()}

      {/* محتوای هر مرحله */}
      {currentStep === "select-table" && renderSelectTableStep()}
      {currentStep === "select-file" && renderSelectFileStep()}
      {currentStep === "importing" && renderImportingStep()}
      {currentStep === "complete" && renderCompleteStep()}

      {/* راهنمای استفاده */}
      {(currentStep === "select-table" || currentStep === "select-file") && (
        <View style={styles.guideSection}>
          <Text style={styles.guideTitle}>📋 راهنمای استفاده:</Text>
          <Text style={styles.guideText}>
            • فایل باید با فرمت .xlsx باشد{"\n"}• نام ستون‌ها باید دقیقاً مطابق
            نمونه باشد{"\n"}• داده‌های عددی در سلول‌های عددی وارد شوند{"\n"}• از
            کاراکترهای خاص خودداری کنید{"\n"}• فایل نباید دارای فرمول باشد
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default ImportExcel;

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
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    top: 20,
    left: -50,
    width: 100,
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
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 20,
  },
  tablesGrid: {
    gap: 12,
  },
  tableCard: {
    backgroundColor: "#fafafa",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
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
    marginBottom: 8,
  },
  tableName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
    textAlign: "right",
  },
  tableColumns: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginBottom: 8,
    lineHeight: 18,
  },
  tableInfo: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  tableInfoText: {
    fontSize: 11,
    color: "#666",
  },
  sampleBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 16,
  },
  sampleText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedTableInfo: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  selectedTableText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  fileSelectBtn: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderStyle: "dashed",
  },
  fileSelectTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginTop: 12,
    marginBottom: 4,
  },
  fileSelectSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  selectedFile: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f0f7f0",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: "#666",
  },
  stepActions: {
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
    marginTop: 20,
  },
  backBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  backBtnText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingSpinner: {
    marginVertical: 20,
  },
  progressContainer: {
    marginTop: 20,
  },
  progressStats: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  progressStat: {
    alignItems: "center",
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  progressSuccess: {
    color: "#34C759",
  },
  progressFailed: {
    color: "#FF3B30",
  },
  progressLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#34C759",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  completeIcon: {
    alignItems: "center",
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 30,
  },
  finalStats: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  finalStat: {
    alignItems: "center",
  },
  finalStatNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#34C759",
  },
  finalStatFailed: {
    color: "#FF3B30",
  },
  finalStatLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  restartBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    padding: 16,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
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
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "right",
  },
  guideText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    textAlign: "right",
  },
});
