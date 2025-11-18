import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  ScrollView 
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { read, utils } from "xlsx";
import { useSQLiteContext } from "expo-sqlite";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const ImportExcel: React.FC = () => {
  const db = useSQLiteContext();
  const [table, setTable] = useState<string>("Shipping");
  const [loading, setLoading] = useState(false);
  const [importStats, setImportStats] = useState({
    total: 0,
    success: 0,
    failed: 0
  });

  const tableConfig = {
    "Dollar": {
      name: "قیمت دالر",
      columns: ["daily_price"],
      sample: [{ daily_price: 85.5 }]
    },
    "Car": {
      name: "موترها",
      columns: ["name", "modal", "total_tax"],
      sample: [{ name: "تویوتا", modal: "کمری", total_tax: 15000 }]
    },
    "Shipping": {
      name: "حمل و نقل",
      columns: ["state", "auction", "rate"],
      sample: [{ state: "کابل", auction: "مزایده مرکزی", rate: 5000 }]
    },
    "final_car_prices": {
      name: "قیمت‌های نهایی",
      columns: ["car_price", "shipping_rate", "total_tax", "final_price"],
      sample: [{ car_price: 500000, shipping_rate: 5000, total_tax: 15000, final_price: 520000 }]
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      setImportStats({ total: 0, success: 0, failed: 0 });
      
      // 1. انتخاب فایل Excel
      const res = await DocumentPicker.getDocumentAsync({ 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        copyToCacheDirectory: true
      });

      if (res.canceled || !res.assets?.[0]?.uri) {
        setLoading(false);
        return;
      }

      const uri = res.assets[0].uri;

      // 2. خواندن فایل
      const fileBase64 = await FileSystem.readAsStringAsync(uri, { 
        encoding: FileSystem.EncodingType.Base64 
      });
      const workbook = read(fileBase64, { type: "base64" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data: any[] = utils.sheet_to_json(sheet);

      if (data.length === 0) {
        Alert.alert("خطا", "فایل Excel خالی است یا فرمت آن صحیح نمی‌باشد");
        setLoading(false);
        return;
      }

      setImportStats(prev => ({ ...prev, total: data.length }));

      // 3. چک کردن ستون‌ها
      const config = tableConfig[table as keyof typeof tableConfig];
      const fileColumns = Object.keys(data[0]);

      const missingColumns = config.columns.filter(col => !fileColumns.includes(col));
      if (missingColumns.length > 0) {
        Alert.alert(
          "خطا در ساختار فایل", 
          `ستون‌های زیر در فایل موجود نیستند:\n\n${missingColumns.join("\n")}\n\nلطفاً فایل را مطابق نمونه اصلاح کنید.`
        );
        setLoading(false);
        return;
      }

      // 4. وارد کردن رکوردها
      let successCount = 0;
      let failedCount = 0;

      await db.execAsync("BEGIN TRANSACTION");

      try {
        for (const [index, row] of data.entries()) {
          try {
            const values = config.columns.map(col => {
              const value = row[col];
              // تبدیل مقادیر عددی
              if (col.includes('price') || col.includes('rate') || col.includes('tax')) {
                return Number(value) || 0;
              }
              return value;
            });

            const placeholders = config.columns.map(() => "?").join(", ");
            await db.runAsync(
              `INSERT INTO ${table} (${config.columns.join(", ")}) VALUES (${placeholders})`,
              values
            );
            successCount++;
          } catch (rowError) {
            console.log(`Error in row ${index + 1}:`, rowError);
            failedCount++;
          }

          // بروزرسانی آمار هر 10 رکورد
          if (index % 10 === 0) {
            setImportStats({ total: data.length, success: successCount, failed: failedCount });
          }
        }

        await db.execAsync("COMMIT");
        setImportStats({ total: data.length, success: successCount, failed: failedCount });

        // نمایش نتیجه نهایی
        if (failedCount === 0) {
          Alert.alert(
            "موفقیت ✅", 
            `تمام ${successCount} رکورد با موفقیت در جدول "${config.name}" وارد شدند.`
          );
        } else {
          Alert.alert(
            "اتمام با اخطار ⚠️", 
            `عملیات وارد کردن کامل شد:\n\n✅ ${successCount} رکورد موفق\n❌ ${failedCount} رکورد ناموفق\n\nرکوردهای ناموفق ممکن است به دلیل داده‌های تکراری یا نامعتبر باشند.`
          );
        }

      } catch (transactionError) {
        await db.execAsync("ROLLBACK");
        throw transactionError;
      }

    } catch (error) {
      console.log("Import Excel error:", error);
      Alert.alert(
        "خطا ❌", 
        "خطا در وارد کردن فایل Excel. لطفاً از صحیح بودن فرمت فایل اطمینان حاصل کنید."
      );
    } finally {
      setLoading(false);
    }
  };

  const showSampleFormat = () => {
    const config = tableConfig[table as keyof typeof tableConfig];
    const sample = config.sample[0];
    
    const sampleText = config.columns.map(col => 
      `${col}: ${(sample as Record<string, any>)[col]}`
    ).join('\n');

    Alert.alert(
      `قالب نمونه برای ${config.name}`,
      `فایل Excel شما باید شامل ستون‌های زیر باشد:\n\n${sampleText}\n\nتوجه: نام ستون‌ها باید دقیقاً مطابق بالا باشد.`
    );
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case "Dollar": return "dollar";
      case "Car": return "car";
      case "Shipping": return "truck";
      case "final_car_prices": return "calculator";
      default: return "table";
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* هدر */}
      <View style={styles.header}>
        <FontAwesome name="upload" size={24} color="#007AFF" />
        <Text style={styles.headerTitle}>ورود اطلاعات از Excel</Text>
      </View>

      {/* انتخاب جدول */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>انتخاب جدول مقصد</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={table}
            onValueChange={(value) => setTable(value)}
            style={styles.picker}
          >
            {Object.entries(tableConfig).map(([key, config]) => (
              <Picker.Item 
                key={key} 
                label={config.name} 
                value={key} 
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* اطلاعات جدول */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>اطلاعات جدول انتخابی</Text>
        <View style={styles.tableInfo}>
          <View style={styles.infoRow}>
            <FontAwesome name={getTableIcon(table)} size={16} color="#007AFF" />
            <Text style={styles.infoLabel}>نام جدول:</Text>
            <Text style={styles.infoValue}>{tableConfig[table as keyof typeof tableConfig].name}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome name="columns" size={16} color="#FF9500" />
            <Text style={styles.infoLabel}>ستون‌های مورد نیاز:</Text>
            <Text style={styles.infoValue}>
              {tableConfig[table as keyof typeof tableConfig].columns.join("، ")}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.sampleBtn} onPress={showSampleFormat}>
          <FontAwesome name="info-circle" size={16} color="#007AFF" />
          <Text style={styles.sampleText}>مشاهده قالب نمونه</Text>
        </TouchableOpacity>
      </View>

      {/* دکمه import */}
      <TouchableOpacity 
        style={[styles.importBtn, loading && styles.importBtnDisabled]} 
        onPress={handleImport} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <FontAwesome name="upload" size={20} color="#fff" />
        )}
        <Text style={styles.importText}>
          {loading ? "در حال وارد کردن..." : "انتخاب و وارد کردن فایل Excel"}
        </Text>
      </TouchableOpacity>

      {/* نمایش آمار import */}
      {loading && importStats.total > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>پیشرفت وارد کردن:</Text>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{importStats.total}</Text>
              <Text style={styles.statLabel}>کل رکوردها</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statSuccess]}>{importStats.success}</Text>
              <Text style={styles.statLabel}>موفق</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statFailed]}>{importStats.failed}</Text>
              <Text style={styles.statLabel}>ناموفق</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${importStats.total > 0 ? (importStats.success / importStats.total) * 100 : 0}%` 
                }
              ]} 
            />
          </View>
        </View>
      )}

      {/* راهنمای استفاده */}
      <View style={styles.guideSection}>
        <Text style={styles.guideTitle}>📋 راهنمای استفاده:</Text>
        <Text style={styles.guideText}>
          • فایل Excel باید با فرمت .xlsx باشد{"\n"}
          • نام ستون‌ها باید دقیقاً مطابق نمونه باشد{"\n"}
          • داده‌های عددی باید در سلول‌های عددی وارد شوند{"\n"}
          • از کاراکترهای خاص در داده‌ها خودداری کنید{"\n"}
          • فایل نباید دارای فرمول باشد
        </Text>
      </View>
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
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "500",
    flex: 1,
    textAlign: "left",
  },
  sampleBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  sampleText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  importBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#34C759",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  importBtnDisabled: {
    backgroundColor: "#C7C7CC",
  },
  importText: {
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
    marginBottom: 12,
    textAlign: "right",
  },
  stats: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  statSuccess: {
    color: "#34C759",
  },
  statFailed: {
    color: "#FF3B30",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#34C759",
    borderRadius: 3,
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