const I18N_KEY = "deepdiet_lang";

const translations = {
  en: {
    scan: "Scan",
    scanMeal: "Scan your meal",
    uploadTip: "Upload a food image. DeepDiet identifies multiple items and estimates nutrition.",
    browse: "Browse Image",
    scanNow: "Scan Now",
    reset: "Reset",
    history: "History",
    dashboard: "Dashboard",
    logout: "Logout",
    tips: "Tips for best results",
    supports: "Supports Thali / mixed meals"
  },
  hi: {
    scan: "स्कैन",
    scanMeal: "अपना भोजन स्कैन करें",
    uploadTip: "भोजन की तस्वीर अपलोड करें। DeepDiet कई आइटम पहचानकर पोषण बताता है।",
    browse: "छवि चुनें",
    scanNow: "स्कैन करें",
    reset: "रीसेट",
    history: "इतिहास",
    dashboard: "डैशबोर्ड",
    logout: "लॉगआउट",
    tips: "बेहतर परिणाम के लिए सुझाव",
    supports: "थाली / मिक्स मील सपोर्ट करता है"
  },
  te: {
    scan: "స్కాన్",
    scanMeal: "మీ భోజనాన్ని స్కాన్ చేయండి",
    uploadTip: "ఆహార చిత్రాన్ని అప్‌లోడ్ చేయండి. DeepDiet అనేక అంశాలను గుర్తించి పోషకాలను అంచనా వేస్తుంది.",
    browse: "చిత్రం ఎంచుకోండి",
    scanNow: "స్కాన్ చేయండి",
    reset: "రిసెట్",
    history: "చరిత్ర",
    dashboard: "డాష్‌బోర్డ్",
    logout: "లాగ్ అవుట్",
    tips: "మంచి ఫలితాల కోసం సూచనలు",
    supports: "థాలీ / మిక్స్ భోజనం సపోర్ట్"
  }
};

function getLang() {
  return localStorage.getItem(I18N_KEY) || "en";
}
function setLang(lang) {
  localStorage.setItem(I18N_KEY, lang);
  applyI18n();
}

function t(key) {
  const lang = getLang();
  const langObj = translations[lang] || translations.en;
  return langObj[key] || translations.en[key] || key;
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
}
