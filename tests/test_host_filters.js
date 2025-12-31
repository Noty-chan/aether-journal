const test = require("node:test");
const assert = require("node:assert/strict");

const {
  itemTemplateMatches,
  questTemplateMatches,
  messageTemplateMatches,
} = require("../static/host/filters.js");

test("itemTemplateMatches filters by query, type, rarity", () => {
  const template = {
    name: "Меч ветров",
    description: "Лёгкий клинок",
    item_type: "weapon",
    rarity: "purple",
    tags: ["ветер", "меч"],
  };
  assert.equal(
    itemTemplateMatches(template, { query: "ветров", type: "weapon", rarity: "purple" }, {}),
    true,
  );
  assert.equal(
    itemTemplateMatches(template, { query: "ветров", type: "armor", rarity: "purple" }, {}),
    false,
  );
  assert.equal(itemTemplateMatches(template, { query: "топор" }, {}), false);
});

test("itemTemplateMatches respects class filter", () => {
  const template = { name: "Доспех", item_type: "armor" };
  const classes = {
    warrior: { allowed_item_types: ["weapon", "armor"] },
    mage: { allowed_item_types: ["weapon"] },
  };
  assert.equal(
    itemTemplateMatches(template, { classId: "warrior" }, classes),
    true,
  );
  assert.equal(itemTemplateMatches(template, { classId: "mage" }, classes), false);
});

test("questTemplateMatches supports mandatory and query filters", () => {
  const template = { name: "Тайный путь", description: "Скрытая тропа", cannot_decline: true };
  assert.equal(
    questTemplateMatches(template, { query: "тайный", onlyMandatory: true }),
    true,
  );
  assert.equal(
    questTemplateMatches(template, { query: "тайный", onlyMandatory: false }),
    true,
  );
  assert.equal(
    questTemplateMatches(
      { name: "Обычный", description: "", cannot_decline: false },
      { onlyMandatory: true },
    ),
    false,
  );
});

test("messageTemplateMatches filters by severity and query", () => {
  const template = { name: "Внимание", title: "Опасность", body: "Берегись", severity: "warning" };
  assert.equal(
    messageTemplateMatches(template, { severity: "warning", query: "берегись" }),
    true,
  );
  assert.equal(messageTemplateMatches(template, { severity: "info" }), false);
});
