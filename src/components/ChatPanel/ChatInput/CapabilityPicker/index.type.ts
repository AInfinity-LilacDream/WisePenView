import type {
  CapabilityPickerItem,
  CapabilityPickerSection,
} from '@/domains/Chat/mapper/capabilityPicker.mapper';

export interface CapabilityPickerProps {
  open: boolean;
  sections: CapabilityPickerSection[];
  onItemPress: (item: CapabilityPickerItem) => void;
  onMenuInteract?: () => void;
}
