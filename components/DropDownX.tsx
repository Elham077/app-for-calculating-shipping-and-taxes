import React, { useMemo, useState } from "react";
import { 
  View, 
  StyleSheet, 
  Text,
  ActivityIndicator
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AntDesign from "@expo/vector-icons/AntDesign";

// ========== TYPES ==========
interface DropdownItem {
  label: string;
  value: string;
  icon?: string;
  color?: string;
}

interface CategoryDropdownProps {
  value: string | null;
  onChange: (value: string) => void;
  items: DropdownItem[];
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  searchable?: boolean;
}

// ========== CONSTANTS ==========
const COLORS = {
  primary: "#007AFF",
  success: "#34C759",
  danger: "#FF3B30",
  text: {
    primary: "#1a1a1a",
    secondary: "#666",
    tertiary: "#999",
  },
  background: {
    primary: "#fff",
    secondary: "#f5f5f5",
  },
  border: "#e5e5e5",
} as const;

// ========== MAIN COMPONENT ==========
const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  value,
  onChange,
  items,
  placeholder = "انتخاب کنید...",
  label,
  error,
  required = false,
  disabled = false,
  loading = false,
  searchable = false,
}) => {
  const [isFocus, setIsFocus] = useState(false);

  // ========== COMPUTED VALUES ==========
  const selectedItem = useMemo(() => 
    items.find(item => item.value === value),
    [items, value]
  );

  const hasError = !!error;
  const isDisabled = disabled || loading;

  // ========== RENDER FUNCTIONS ==========
  const renderItem = (item: DropdownItem, selected?: boolean) => (
    <View style={[
      styles.itemContainer,
      selected && styles.selectedItem
    ]}>
      {item.icon && (
        <FontAwesome 
          name={item.icon as any} 
          size={16} 
          color={item.color || COLORS.text.secondary} 
          style={styles.itemIcon}
        />
      )}
      <Text style={[
        styles.itemText,
        selected && styles.selectedItemText
      ]}>
        {item.label}
      </Text>
      {selected && (
        <AntDesign 
          name="check" 
          size={16} 
          color={COLORS.primary} 
        />
      )}
    </View>
  );

  const renderLeftIcon = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={COLORS.primary} />;
    }
    
    if (selectedItem?.icon) {
      return (
        <FontAwesome 
          name={selectedItem.icon as any} 
          size={16} 
          color={selectedItem.color || COLORS.text.secondary} 
        />
      );
    }
    
    return null;
  };

  const renderRightIcon = () => (
    <FontAwesome
      name={isFocus ? "chevron-up" : "chevron-down"}
      size={14}
      color={COLORS.text.secondary}
    />
  );

  // ========== STYLES COMPUTATION ==========
  const dropdownWrapperStyle = [
    styles.dropdownWrapper,
    isDisabled && styles.dropdownDisabled,
    hasError && styles.dropdownError,
    isFocus && styles.dropdownFocused
  ];

  // ========== RENDER ==========
  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {/* Dropdown */}
      <View style={dropdownWrapperStyle}>
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          containerStyle={styles.dropdownContainer}
          itemContainerStyle={styles.itemContainerStyle}
          activeColor="#E3F2FD"
          data={items}
          search={searchable}
          searchPlaceholder="جستجو..."
          labelField="label"
          valueField="value"
          placeholder={placeholder}
          value={value}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={(item: DropdownItem) => {
            onChange(item.value);
            setIsFocus(false);
          }}
          renderLeftIcon={renderLeftIcon}
          renderRightIcon={renderRightIcon}
          renderItem={renderItem}
          disable={isDisabled}
        />
      </View>

      {/* Error Message */}
      {hasError && (
        <View style={styles.errorContainer}>
          <FontAwesome 
            name="exclamation-circle" 
            size={12} 
            color={COLORS.danger} 
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Helper Text */}
      {!hasError && selectedItem && (
        <Text style={styles.helperText}>
          {selectedItem.label} انتخاب شد
        </Text>
      )}
    </View>
  );
};

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: "right",
  },
  required: {
    color: COLORS.danger,
  },
  dropdownWrapper: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.background.primary,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownError: {
    borderColor: COLORS.danger,
  },
  dropdownDisabled: {
    backgroundColor: COLORS.background.secondary,
    opacity: 0.7,
  },
  dropdown: {
    height: 55,
    paddingHorizontal: 16,
  },
  placeholderStyle: {
    fontSize: 16,
    color: COLORS.text.tertiary,
    textAlign: "right",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: "500",
    textAlign: "right",
  },
  dropdownContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  itemContainerStyle: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectedItem: {
    backgroundColor: "#E3F2FD",
  },
  itemIcon: {
    marginLeft: 8,
  },
  itemText: {
    fontSize: 16,
    color: COLORS.text.primary,
    flex: 1,
    textAlign: "right",
  },
  selectedItemText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    textAlign: "right",
  },
  helperText: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 6,
    textAlign: "right",
    fontWeight: "500",
  },
});

export default CategoryDropdown;