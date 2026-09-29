import { Language } from '../types';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export interface Translations {
  brand: string;
  tagline: string;
  nav: {
    convert: string;
    compress: string;
    tools: string;
    ai: string;
    faq: string;
    video: string;
    audio: string;
    image: string;
    pdf: string;
    documents: string;
    units: string;
    time: string;
    search: string;
    searchPlaceholder: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    dropTitle: string;
    dropSubtitle: string;
    fromDevice: string;
    fromUrl: string;
    pasteUrl: string;
    supportedBanner: string;
    freeBadge: string;
    privacyNote: string;
    shortcuts: {
      imageCompressor: string;
      videoCompressor: string;
      imageToSvg: string;
      svgToImage: string;
      pdfToWord: string;
      jpgToPng: string;
      mp4ToMp3: string;
    };
  };
  actions: {
    convertAll: string;
    convertAnother: string;
    download: string;
    downloadZip: string;
    deleteNow: string;
    cancel: string;
    settings: string;
    clearAll: string;
    addMore: string;
    apply: string;
    copy: string;
    copied: string;
    processing: string;
    uploading: string;
    completed: string;
    paste: string;
    fromUrl: string;
    cloudDrive: string;
  };
  uploader: {
    original: string;
    converted: string;
    saved: string;
    selectFormat: string;
    dropToUpload: string;
    dropYourFiles: string;
    orChooseDevice: string;
    chooseFiles: string;
    dropMore: string;
    maxLimitNotice: string;
    pasteDirect: string;
    addFromUrl: string;
    cloudStorage: string;
    queueEmpty: string;
  };
  features: {
    privacyTitle: string;
    privacyDesc: string;
    fastTitle: string;
    fastDesc: string;
    unlimitedTitle: string;
    unlimitedDesc: string;
  };
  footer: {
    description: string;
    privacyBadge: string;
    tools: string;
    categories: string;
    legal: string;
    company: string;
    rights: string;
    about: string;
    privacy: string;
    terms: string;
    faq: string;
    contact: string;
  };
}
