// Global type declarations for react-icons/fi
declare module 'react-icons/fi' {
  import { ComponentType, SVGProps } from 'react';

  export interface IconBaseProps extends SVGProps<SVGSVGElement> {
    children?: React.ReactNode;
    size?: string | number;
    color?: string;
    title?: string;
  }

  export type IconType = ComponentType<IconBaseProps>;

  // All Feather Icons used in the project
  export const FiShoppingCart: IconType;
  export const FiX: IconType;
  export const FiMinus: IconType;
  export const FiPlus: IconType;
  export const FiTrash2: IconType;
  export const FiArrowRight: IconType;
  export const FiArrowLeft: IconType;
  export const FiPhone: IconType;
  export const FiMail: IconType;
  export const FiMapPin: IconType;
  export const FiFacebook: IconType;
  export const FiInstagram: IconType;
  export const FiTwitter: IconType;
  export const FiSearch: IconType;
  export const FiGlobe: IconType;
  export const FiUser: IconType;
  export const FiPackage: IconType;
  export const FiLogOut: IconType;
  export const FiMenu: IconType;
  export const FiStar: IconType;
  export const FiClock: IconType;
  export const FiInfo: IconType;
  export const FiTruck: IconType;
  export const FiCheckCircle: IconType;
  export const FiXCircle: IconType;
  export const FiLock: IconType;
  export const FiEye: IconType;
  export const FiEyeOff: IconType;
  export const FiCheck: IconType;
  export const FiShoppingBag: IconType;
  export const FiHome: IconType;
  export const FiFilter: IconType;
  export const FiGrid: IconType;
  export const FiList: IconType;
  export const FiShare2: IconType;
  export const FiHeart: IconType;
  export const FiMessageCircle: IconType;
  export const FiSave: IconType;
  export const FiEdit3: IconType;
  export const FiImage: IconType;
  export const FiSliders: IconType;
  export const FiCard: IconType;
  export const FiCircle: IconType;
  export const FiSettings: IconType;
  export const FiDollarSign: IconType;
  export const FiTrendingUp: IconType;
  export const FiCompass: IconType;
  export const FiActivity: IconType;
  export const FiArrowUp: IconType;
  export const FiTool: IconType;
  export const FiMap: IconType;
  export const FiToggleLeft: IconType;
  export const FiToggleRight: IconType;
}
