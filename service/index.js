import { FeeTree } from "../model";
import { redisClient } from "../db";
export default class FeeService {
	/* This is a class property that is used to cache the fee structure. */
	static feeStructure = null;
	/**
	 * It gets the fee structure from redis.
	 * @returns The fee structure is being returned.
	 */
	static async getFeeStructure() {
		if (FeeService.feeStructure) {
			return FeeService.feeStructure;
		}
		const feeStructure = await redisClient.get("feeStructure");
		console.log(JSON.stringify(feeStructure), 2)
		FeeService.feeStructure = feeStructure ? JSON.parse(feeStructure) : null;
		return FeeService.feeStructure;
	}
	/**
	 * It creates a fee structure for each currency.
	 * @param fees - The fees that are to be parsed.
	 * @returns The feeStructureCurrency object.
	 * @private
	 */
	static async createFeeStructure(fees) {
		console.log(fees)
		const feeTypeArr = ["FLAT", "PERC", "FLAT_PERC"];
		const feeEntityArr = [
			"CREDIT-CARD",
			"DEBIT-CARD",
			"BANK-ACCOUNT",
			"USSD",
			"WALLET-ID",
			"*",
		];
		const region = ['LOCL', 'INTL', '*']
		const currencyArr = ['NGN', '*']
		const feeStructureCurrency = {};
		fees.forEach((fee) => {
			const data = fee.split(" ");
			const [id, currency, locale, entityString, , , feeType, feeValue] = data;
			const entityProperty = entityString.split("(")[1].split(")")[0];
			const entity = entityString.split("(")[0];
			if (feeTypeArr.includes(feeType) && feeEntityArr.includes(entity) && region.includes(locale) && currencyArr.includes(currency)) {
				
				const currencyFeeStructure =
					feeStructureCurrency[currency] ||
					new FeeTree({
						currency,
						entity,
						entityProperty,
						locale,
						id,
						feeType,
						feeValue,
					});
				currencyFeeStructure.addNewData({
					currency,
					entity,
					entityProperty,
					id,
					feeType,
					feeValue,
					locale,
				});
				feeStructureCurrency[currency] = currencyFeeStructure;
			}
			return {
				err: "Configuration errors",
			};
		});
		console.log(feeStructureCurrency)
		await redisClient.set("feeStructure", JSON.stringify(feeStructureCurrency));
		FeeService.feeStructure = feeStructureCurrency;
		return feeStructureCurrency;
	}

	/**
	 * Given a payment entity, calculate the fee for the transaction
	 * @param data - The data object that contains the payment entity and currency country.
	 * @param [entityPropertyCount=0] - The index of the entity property in the array of possible entity
	 * properties.
	 * @param [entityCount=0] - This is the index of the entity in the possibleEntity array.
	 * @param [localeCount=0] - The count of the locale.
	 * @returns The fee for the transaction.
	 */
	static async findDataConfig(
		data,
		entityPropertyCount = 0,
		entityCount = 0,
		localeCount = 0
	) {
		const { Currency, PaymentEntity, CurrencyCountry, Amount, Customer } = data;
		const { Type, Brand, Country, Number, SixID, Issuer } = PaymentEntity;
		const locale = Country === CurrencyCountry ? "LOCL" : "INTL";
		const currency = Currency;
		const possibleEntity = [Type, "*"];
		const possibleEntityProperty = [Brand, Issuer, Number, SixID, "*"];
		const possibleLocale = [locale, "*"];
		const feeStructure =
			FeeService.feeStructure || (await FeeService.getFeeStructure());
			console.log(JSON.stringify(feeStructure))
		if (!feeStructure[currency]) {
			return {
				success: false,
				message: `No fee configuration for ${currency} transactions.`,
			};
		}
		
		const feeConfig = possibleEntityProperty[entityPropertyCount]
			? feeStructure[currency][currency] &&
			  feeStructure[currency][currency][possibleLocale[localeCount]] &&
			  feeStructure[currency][currency][possibleLocale[localeCount]][
					possibleEntity[entityCount]
			  ] &&
			  feeStructure[currency][currency][possibleLocale[localeCount]][
					possibleEntity[entityCount]
			  ][possibleEntityProperty[entityPropertyCount]]
			: null;

		if (!feeConfig) {
			if (entityPropertyCount < possibleEntityProperty.length - 1) {
				entityPropertyCount++;
				return FeeService.findDataConfig(
					data,
					entityPropertyCount,
					entityCount,
					localeCount
				);
			} else if (entityCount < possibleEntity.length - 1) {
				entityCount++;
				entityPropertyCount = 0;
				return FeeService.findDataConfig(
					data,
					entityPropertyCount,
					entityCount,
					localeCount
				);
			} else if (localeCount < possibleLocale.length - 1) {
				localeCount++;
				entityCount = 0;
				entityPropertyCount = 0;
				return FeeService.findDataConfig(
					data,
					entityPropertyCount,
					entityCount,
					localeCount
				);
			}
		}
		if (!feeConfig) {
			return {
				success: false,
				message: `No fee configuration for ${currency} transactions.`,
			};
		}
		const { id, feeType, feeValue } = feeConfig;
		const fee = FeeService.processFeeBasedOnType(feeType, Amount, feeValue);
		const chargeAmount = Customer.BearsFee ? +Amount + +fee : +Amount;
		return {
			success: true,
			data: {
				AppliedFeeID: id,
				AppliedFeeValue: fee,
				ChargeAmount: chargeAmount,
				SettlementAmount: chargeAmount - fee,
			},
		};
	}

	/**
	 * It calculates the fee for a given data.
	 * @param data - The data that will be used to calculate the fee.
	 * @returns The fee for the given data.
	 */
	static async calculateFee(data) {
		return FeeService.findDataConfig(data);
	}

	/**
	 * Given a fee type and amount, return the fee value
	 * @param feeType - The type of fee. Can be FLAT, PERC, or FLAT_PERC.
	 * @param amount - The amount of the transaction.
	 * @param FeeValue - The fee value that you want to use.
	 * @returns The fee amount based on the fee type and amount.
	 */
	static processFeeBasedOnType(feeType, amount, FeeValue) {
		const feeTypeHash = {
			FLAT: Number(FeeValue),
			PERC: (Number(FeeValue) * Number(amount)) / 100,
			FLAT_PERC:
				Number(FeeValue.split(":")[0]) +
				(FeeValue.split(":")[1] * amount) / 100,
		};
		return feeTypeHash[feeType];
	}
}
