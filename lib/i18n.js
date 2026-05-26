export function getLanguageFromRequest(request) {
  const lang = request.headers.get("x-language")
    || request.nextUrl.searchParams.get("language")
    || "en";
  return ["zh", "en"].includes(lang) ? lang : "en";
}
