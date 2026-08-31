export interface LanguageData {
  id: string;
  label: string;
  native: string;
}

// Profile language options shown during onboarding.
// `native` is the language name in its own script, shown as the card subtitle.
export const LANGUAGES: LanguageData[] = [
  { id: 'hindi', label: 'Hindi', native: 'हिन्दी' },
  { id: 'telugu', label: 'Telugu', native: 'తెలుగు' },
  { id: 'tamil', label: 'Tamil', native: 'தமிழ்' },
  { id: 'malayalam', label: 'Malayalam', native: 'മലയാളം' },
  { id: 'kannada', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { id: 'bengali', label: 'Bengali', native: 'বাংলা' },
  { id: 'marathi', label: 'Marathi', native: 'मराठी' },
  { id: 'punjabi', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { id: 'gujarati', label: 'Gujarati', native: 'ગુજરાતી' },
  { id: 'bhojpuri', label: 'Bhojpuri', native: 'भोजपुरी' },
  { id: 'assamese', label: 'Assamese', native: 'অসমীয়া' },
  { id: 'odia', label: 'Odia', native: 'ଓଡ଼ିଆ' },
  { id: 'konkani', label: 'Konkani', native: 'कोंकणी' },
  { id: 'manipuri', label: 'Manipuri (Meitei)', native: 'ꯃꯩꯇꯩꯂꯣꯟ' },
  { id: 'nepali', label: 'Nepali', native: 'नेपाली' },
  { id: 'tulu', label: 'Tulu', native: 'ತುಳು' },
  { id: 'haryanvi', label: 'Haryanvi', native: 'हरियाणवी' },
  { id: 'rajasthani', label: 'Rajasthani', native: 'राजस्थानी' },
  { id: 'sanskrit', label: 'Sanskrit', native: 'संस्कृतम्' },
  { id: 'kashmiri', label: 'Kashmiri', native: 'کٲشُر' },
  { id: 'sindhi', label: 'Sindhi', native: 'سنڌي' },
  { id: 'maithili', label: 'Maithili', native: 'मैथिली' },
  { id: 'chhattisgarhi', label: 'Chhattisgarhi', native: 'छत्तीसगढ़ी' },
  { id: 'garhwali', label: 'Garhwali', native: 'गढ़वाली' },
  { id: 'kumaoni', label: 'Kumaoni', native: 'कुमाऊँनी' },
  { id: 'khasi', label: 'Khasi', native: 'Ka Ktien Khasi' },
  { id: 'mizo', label: 'Mizo', native: 'Mizo ṭawng' },
  { id: 'nagamese', label: 'Nagamese', native: 'Nagamese' },
];
