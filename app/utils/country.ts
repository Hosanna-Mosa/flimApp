/**
 * Converts a 2-letter country code (ISO 3166-1 alpha-2) to a flag emoji.
 * 
 * @param countryCode - The 2-letter country code (e.g., 'US', 'IN')
 * @returns The flag emoji (e.g., '🇺🇸', '🇮🇳')
 */
export const getFlagEmoji = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export interface Country {
  name: string;
  code: string;
  callingCode: string;
  flag: string;
}

export interface RestCountry {
  name: {
    common: string;
  };
  cca2: string;
  idd: {
    root?: string;
    suffixes?: string[];
  };
}

/**
 * Maps the REST Countries API response to our internal Country interface.
 */
export const mapRestCountryToCountry = (restCountry: RestCountry): Country => {
  const root = restCountry.idd?.root || '';
  const suffix = restCountry.idd?.suffixes?.[0] || '';
  
  return {
    name: restCountry.name.common,
    code: restCountry.cca2,
    callingCode: `${root}${suffix}`,
    flag: getFlagEmoji(restCountry.cca2),
  };
};
