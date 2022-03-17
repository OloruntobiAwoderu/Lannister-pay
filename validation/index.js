import Joi from "joi";
import joi from "joi";

class Validation {
	static validateRequest(req, res, next) {
		const schema = joi.object({
			ID: Joi.any().required().messages({ "any.required": "ID is required" }),
			Amount: Joi.number()
				.positive()
				.integer()
				.min(1)
				.strict()
				.required()
				.messages({
					"any.required": `Amount is a required field`,
					"number.base": `Amount must be a number`,
					"number.empty": `Amount cannot be an empty field`,
					"number.min": `Amount can not be lesser than 1`,
					"number.positive": "Amount cannot be negative",
				}),
			Currency: Joi.string()
				.required()
				.messages({
					"any.required": `Currency is a required field`,
					"string.base": `Currency must be a string`,
					"string.empty": `Currency cannot be an empty field`,
				}),
			CurrencyCountry: Joi.string().required().messages({
				"any.required": `Currency Country is a required field`,
				"string.base": `Currency Country must be a string`,
				"string.empty": `Currency Country cannot be an empty field`,
			}),
			Customer: Joi.object({
				ID: Joi.any().required().messages({
					"any.required": `Customer ID is a required field`,
				}),
				EmailAddress: Joi.string().email().messages({
					"string.email": "Customer Email is not valid",
				}),
				FullName: Joi.string().messages({
					"string.base": `Customer's Full Name must be a string`,
				}),
				BearsFee: Joi.boolean().required().messages({
					"any.required": `Bears fee is a required field`,
					"boolean.base": `Bears fee is not a boolean`,
				}),
			}),
			PaymentEntity: Joi.object({
				ID: Joi.any().required().messages({
					"any.required": `Payment Entity ID is a required field`,
				}),
				Issuer: Joi.string().required().messages({
					"any.required": `Issuer is a required field`,
					"string.base": `Issuer must be a string`,
				}),
				Brand: Joi.string().allow("").required().messages({
					"any.required": `Brand is a required field`,
					"string.base": `Brand must be a string`,
				}),
				Number: Joi.string().required().messages({
					"any.required": `Number is a required field`,
					"string.base": `Number must be a string`,
				}),
				SixID: Joi.any().required().messages({
					"any.required": `Brand is a required field`,
				}),
				Type: Joi.string().required().messages({
					"any.required": `Type is a required field`,
					"string.base": `Type must be a string`,
				}),
				Country: Joi.string().required().messages({
					"any.required": `Country is a required field`,
					"string.base": `Country must be a string`,
				}),
			}),
		});
		const { error, value } = schema.validate(req.body);
		if (!error) {
			return next();
		}
		return res.status(400).json({ Error: error.details[0].message });
	}
}

export default Validation;
