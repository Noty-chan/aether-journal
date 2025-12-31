(() => {
  const normalizeSearch = (value) => (value || "").toString().trim().toLowerCase();

  const itemTemplateMatches = (template, filters = {}, classes = {}) => {
    if (!template) {
      return false;
    }
    if (filters.type && template.item_type !== filters.type) {
      return false;
    }
    if (filters.rarity && template.rarity !== filters.rarity) {
      return false;
    }
    if (filters.twoHanded && !template.two_handed) {
      return false;
    }
    if (filters.classId) {
      const classDef = classes?.[filters.classId];
      if (
        classDef?.allowed_item_types?.length &&
        !classDef.allowed_item_types.includes(template.item_type)
      ) {
        return false;
      }
    }
    const query = normalizeSearch(filters.query);
    if (!query) {
      return true;
    }
    const tags = Array.isArray(template.tags) ? template.tags.join(" ") : template.tags || "";
    const haystack = normalizeSearch(
      [template.name, template.description, template.item_type, template.rarity, tags].join(" "),
    );
    return haystack.includes(query);
  };

  const questTemplateMatches = (template, filters = {}) => {
    if (!template) {
      return false;
    }
    if (filters.onlyMandatory && !template.cannot_decline) {
      return false;
    }
    const query = normalizeSearch(filters.query);
    if (!query) {
      return true;
    }
    const haystack = normalizeSearch([template.name, template.description].join(" "));
    return haystack.includes(query);
  };

  const messageTemplateMatches = (template, filters = {}) => {
    if (!template) {
      return false;
    }
    if (filters.severity && template.severity !== filters.severity) {
      return false;
    }
    const query = normalizeSearch(filters.query);
    if (!query) {
      return true;
    }
    const haystack = normalizeSearch([template.name, template.title, template.body].join(" "));
    return haystack.includes(query);
  };

  const exported = {
    normalizeSearch,
    itemTemplateMatches,
    questTemplateMatches,
    messageTemplateMatches,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  } else if (typeof window !== "undefined") {
    window.AetherFilters = exported;
  }
})();
