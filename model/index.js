class ResultTree {
  constructor({ id, feeType, feeValue }) {
    this.id = id;
    this.feeType = feeType;
    this.feeValue = feeValue;
  }
}

class EntityTree {
  constructor({ entityProperty, id, feeType, feeValue }) {
    this[entityProperty] = new ResultTree({ id, feeType, feeValue });
  }
}

class LocaleTree {
  constructor({ entity, entityProperty, id, feeType, feeValue }) {
    this[entity] = new EntityTree({ entityProperty, id, feeType, feeValue });
  }
}

class CurrencyTree {
  constructor({ locale, entity, id, feeType, feeValue, entityProperty }) {
    this[locale] = new LocaleTree({
      locale,
      entity,
      id,
      feeType,
      feeValue,
      entityProperty,
    });
  }
}

class FeeTree {
  constructor({
    currency,
    entity,
    id,
    feeType,
    feeValue,
    entityProperty,
    locale,
  }) {
    this[currency] = new CurrencyTree({
      currency,
      locale,
      entity,
      id,
      feeType,
      feeValue,
      entityProperty,
    });
  }

  addLocaleData({
    currency,
    entity,
    id,
    feeType,
    feeValue,
    entityProperty,
    locale,
  }) {
    this[currency][locale] = new LocaleTree({
      entity,
      entityProperty,
      id,
      feeType,
      feeValue,
    });
  }

  addNewData({
    currency,
    entity,
    entityProperty,
    id,
    feeType,
    feeValue,
    locale,
  }) {
    const oldEntityData =
      this[currency] &&
      this[currency][locale] &&
      this[currency][locale][entity];
    const oldLocaleData = this[currency][locale];
    this.addLocaleData({
      currency,
      entity,
      id,
      feeType,
      feeValue,
      entityProperty,
      locale,
    });
    this[currency][locale] = oldLocaleData
      ? {
          ...oldLocaleData,
          [entity]: new LocaleTree({
            entityProperty,
            id,
            feeType,
            feeValue,
            entity,
          }),
        }
      : new LocaleTree({ entityProperty, id, feeType, feeValue, entity });
    this[currency][locale][entity] = oldEntityData
      ? {
          ...oldEntityData,
          ...new EntityTree({ entityProperty, id, feeType, feeValue }),
        }
      : new EntityTree({ entityProperty, id, feeType, feeValue });
  }
}

export { FeeTree };
