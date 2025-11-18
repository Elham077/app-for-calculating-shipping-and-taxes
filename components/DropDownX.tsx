import React, { useState } from "react";
import { 
  View, 
  StyleSheet, 
  Text,
  ActivityIndicator
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AntDesign from "@expo/vector-icons/AntDesign";

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

  const getSelectedItem = () => {
    return items.find(item => item.value === value);
  };

  const renderItem = (item: DropdownItem, selected?: boolean) => (
    <View style={[
      styles.itemContainer,
      selected && styles.selectedItem
    ]}>
      {item.icon && (
        <FontAwesome 
          name={item.icon as any} 
          size={16} 
          color={item.color || "#666"} 
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
        <AntDesign name="check" size={16} color="#007AFF" />
      )}
    </View>
  );

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
      <View style={[
        styles.dropdownWrapper,
        disabled && styles.dropdownDisabled,
        error && styles.dropdownError,
        isFocus && styles.dropdownFocused
      ]}>
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
          renderLeftIcon={() =>
            loading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : getSelectedItem()?.icon ? (
              <FontAwesome 
                name={getSelectedItem()?.icon as any} 
                size={16} 
                color={getSelectedItem()?.color || "#666"} 
              />
            ) : null
          }
          renderRightIcon={() => (
            <FontAwesome
              name={isFocus ? "chevron-up" : "chevron-down"}
              size={14}
              color="#666"
            />
          )}
          renderItem={renderItem}
          disable={disabled || loading}
        />
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={12} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Helper Text */}
      {!error && value && (
        <Text style={styles.helperText}>
          {items.find(item => item.value === value)?.label} انتخاب شد
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "right",
  },
  required: {
    color: "#FF3B30",
  },
  dropdownWrapper: {
    borderWidth: 1.5,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    backgroundColor: "#fff",
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
    borderColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownError: {
    borderColor: "#FF3B30",
  },
  dropdownDisabled: {
    backgroundColor: "#f5f5f5",
    opacity: 0.7,
  },
  dropdown: {
    height: 55,
    paddingHorizontal: 16,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#999",
    textAlign: "right",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "500",
    textAlign: "right",
  },
  dropdownContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
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
    color: "#1a1a1a",
    flex: 1,
    textAlign: "right",
  },
  selectedItemText: {
    color: "#007AFF",
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
    color: "#FF3B30",
    textAlign: "right",
  },
  helperText: {
    fontSize: 12,
    color: "#34C759",
    marginTop: 6,
    textAlign: "right",
    fontWeight: "500",
  },
});

export default CategoryDropdown;