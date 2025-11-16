import SafeScreen from "@/components/SafeScreen";
import { useRouter } from "expo-router";
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  Linking
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function TabSettings() {
  const router = useRouter();
  
  return (
    <SafeScreen>
      <ScrollView style={styles.container}>
        {/* هدر صفحه */}
        <View style={styles.header}>
          <Text style={styles.title}>تنظیمات برنامه</Text>
          <Text style={styles.subtitle}>مدیریت بخش‌های مختلف</Text>
        </View>

        {/* بخش مدیریت اطلاعات */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مدیریت اطلاعات</Text>
          
          <TouchableOpacity
            style={styles.option}
            onPress={() => router.push("/(screen)/DollarScreen")}
          >
            <View style={styles.optionContent}>
              <View style={[styles.optionIcon, { backgroundColor: '#E3F2FD' }]}>
                <FontAwesome name="dollar" size={20} color="#007AFF" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>مدیریت قیمت دالر</Text>
                <Text style={styles.optionDescription}>
                  تنظیم و ویرایش قیمت روز دالر
                </Text>
              </View>
            </View>
            <FontAwesome name="chevron-left" size={16} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => router.push("/(tabs)/ImaratTax")}
          >
            <View style={styles.optionContent}>
              <View style={[styles.optionIcon, { backgroundColor: '#E8F5E8' }]}>
                <FontAwesome name="car" size={20} color="#34C759" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>مدیریت موترها</Text>
                <Text style={styles.optionDescription}>
                  افزودن، ویرایش و حذف اطلاعات موترها
                </Text>
              </View>
            </View>
            <FontAwesome name="chevron-left" size={16} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => router.push("/(tabs)/Shipping")}
          >
            <View style={styles.optionContent}>
              <View style={[styles.optionIcon, { backgroundColor: '#FFF3E0' }]}>
                <FontAwesome name="truck" size={20} color="#FF9500" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>مدیریت حمل و نقل</Text>
                <Text style={styles.optionDescription}>
                  مسیرها و نرخ‌های حمل
                </Text>
              </View>
            </View>
            <FontAwesome name="chevron-left" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        {/* بخش پشتیبانی */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>پشتیبانی</Text>
          <TouchableOpacity style={styles.option} onPress={() => Linking.openURL("https://wa.me/93744442863")}>
            <View style={styles.optionContent}>
              <View style={[styles.optionIcon, { backgroundColor: '#F0F0F0' }]}>
                <FontAwesome name="envelope" size={20} color="#FF3B30" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>تماس با سجاد</Text>
                <Text style={styles.optionDescription}>
                  گزارش مشکل یا پیشنهاد
                </Text>
              </View>
            </View>
            <FontAwesome name="chevron-left" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "right",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "right",
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    padding: 16,
    paddingBottom: 8,
    textAlign: "right",
    backgroundColor: "#f8f9fa",
  },
  option: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionContent: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
    textAlign: "right",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
});