import ExportExcel from "@/components/ExportExcel";
import ImportExcel from "@/components/ImportExcel";
import SafeScreen from "@/components/SafeScreen";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ========== TYPES & INTERFACES ==========
interface SettingsOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  action: () => void;
  type: "navigation" | "link" | "component";
}

interface SettingsSection {
  id: string;
  title: string;
  options: SettingsOption[];
}

// ========== CONSTANTS ==========
const COLORS = {
  primary: "#007AFF",
  danger: "#FF3B30",
  success: "#34C759",
  warning: "#FF9500",
  text: {
    primary: "#1a1a1a",
    secondary: "#666",
    tertiary: "#8E8E93",
  },
  background: {
    primary: "#fff",
    secondary: "#f5f5f5",
    tertiary: "#f8f9fa",
  },
  border: "#e0e0e0",
  icon: {
    dollar: "#007AFF",
    whatsapp: "#25D366",
  },
} as const;

const SUPPORT_CONTACT = {
  phone: "+93744442863",
  name: "سجاد",
  whatsappUrl: "https://wa.me/93744442863",
} as const;

// ========== MAIN COMPONENT ==========
export default function TabSettings() {
  const router = useRouter();

  // ========== EVENT HANDLERS ==========
  const handleContactSupport = useCallback(async () => {
    try {
      const canOpen = await Linking.canOpenURL(SUPPORT_CONTACT.whatsappUrl);
      if (canOpen) {
        await Linking.openURL(SUPPORT_CONTACT.whatsappUrl);
      } else {
        Alert.alert("خطا", "برنامه واتساپ بر روی دستگاه شما نصب نیست", [
          { text: "متوجه شدم" },
        ]);
      }
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      Alert.alert("خطا", "در برقراری ارتباط مشکلی پیش آمد", [
        { text: "متوجه شدم" },
      ]);
    }
  }, []);

  const handleNavigation = useCallback(
    (route: string) => {
      router.push(route as any);
    },
    [router]
  );

  // ========== SETTINGS CONFIGURATION ==========
  const settingsSections: SettingsSection[] = [
    {
      id: "data-management",
      title: "مدیریت اطلاعات",
      options: [
        {
          id: "dollar-management",
          title: "مدیریت قیمت دالر",
          description: "تنظیم و ویرایش قیمت روز دالر",
          icon: "dollar",
          iconColor: COLORS.icon.dollar,
          iconBgColor: "#E3F2FD",
          action: () => handleNavigation("/DollarScreen"),
          type: "navigation",
        },
      ],
    },
    {
      id: "import-export",
      title: "ورود و خروج اطلاعات",
      options: [
        {
          id: "import-data",
          title: "ورود اطلاعات از اکسل",
          description: "وارد کردن داده‌ها از فایل Excel",
          icon: "upload",
          iconColor: COLORS.success,
          iconBgColor: "#E8F5E8",
          action: () => {}, // Handled by ImportExcel component
          type: "component",
        },
        {
          id: "export-data",
          title: "خروج اطلاعات به اکسل",
          description: "ذخیره داده‌ها در فایل Excel",
          icon: "download",
          iconColor: COLORS.primary,
          iconBgColor: "#E3F2FD",
          action: () => {}, // Handled by ExportExcel component
          type: "component",
        },
      ],
    },
    {
      id: "support",
      title: "پشتیبانی",
      options: [
        {
          id: "contact-support",
          title: `تماس با ${SUPPORT_CONTACT.name}`,
          description: "گزارش مشکل یا پیشنهاد",
          icon: "whatsapp",
          iconColor: COLORS.icon.whatsapp,
          iconBgColor: "#F0F0F0",
          action: handleContactSupport,
          type: "link",
        },
      ],
    },
  ];

  // ========== RENDER COMPONENTS ==========
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>تنظیمات برنامه</Text>
      <Text style={styles.subtitle}>مدیریت بخش‌های مختلف</Text>
    </View>
  );

  const renderOptionIcon = (option: SettingsOption) => (
    <View style={[styles.optionIcon, { backgroundColor: option.iconBgColor }]}>
      <FontAwesome
        name={option.icon as any}
        size={20}
        color={option.iconColor}
      />
    </View>
  );

  const renderOptionContent = (option: SettingsOption) => (
    <View style={styles.optionContent}>
      {renderOptionIcon(option)}
      <View style={styles.optionTextContainer}>
        <Text style={styles.optionText}>{option.title}</Text>
        <Text style={styles.optionDescription}>{option.description}</Text>
      </View>
    </View>
  );

  const renderSettingsOption = (option: SettingsOption) => {
    if (option.type === "component") {
      // Render specific components for import/export
      if (option.id === "import-data") {
        return <ImportExcel />;
      }
      if (option.id === "export-data") {
        return <ExportExcel />;
      }
    }

    return (
      <TouchableOpacity
        style={styles.option}
        onPress={option.action}
        activeOpacity={0.7}
      >
        {renderOptionContent(option)}
        <FontAwesome
          name="chevron-left"
          size={16}
          color={COLORS.text.tertiary}
        />
      </TouchableOpacity>
    );
  };

  const renderSettingsSection = (section: SettingsSection) => (
    <View key={section.id} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>

      {section.options.map((option) => (
        <View key={option.id}>{renderSettingsOption(option)}</View>
      ))}
    </View>
  );

  const renderVersionInfo = () => (
    <View style={styles.versionContainer}>
      <Text style={styles.versionText}>نسخه ۱.۰.۰</Text>
    </View>
  );

  return (
    <SafeScreen>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {renderHeader()}
        {settingsSections.map(renderSettingsSection)}
        {renderVersionInfo()}
      </ScrollView>
    </SafeScreen>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: COLORS.background.primary,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text.primary,
    textAlign: "right",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: "right",
  },
  section: {
    backgroundColor: COLORS.background.primary,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
    padding: 16,
    paddingBottom: 12,
    textAlign: "right",
    backgroundColor: COLORS.background.tertiary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  option: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    color: COLORS.text.primary,
    textAlign: "right",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: "right",
    lineHeight: 16,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    textAlign: "center",
  },
});
