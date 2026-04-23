function getCountryName(code) {
  if (!code) return "Okänt land";

  try {
    const formatter = new Intl.DisplayNames(["sv"], { type: "region" });
    return formatter.of(String(code).toUpperCase()) || code;
  } catch {
    return code;
  }
}

module.exports = {
  getCountryName,
};