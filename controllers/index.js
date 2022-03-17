import FeeService from "../service";

class FeeController {
	static async saveFeeConfig(req, res, next) {
		try {
			const result = await FeeService.createFeeStructure(
				req.body.FeeConfigurationSpec.split("\n")
			);
			if (result.err == "Configuration errors") {
				return res.status(400).json({ error: result.err });
			}
			res.status(200).json({ status: "ok" });
		} catch (error) {
			next(error);
		}
	}

	static async getFeeConfig(req, res, next) {
		try {
			const { success, data, message } = await FeeService.calculateFee(
				req.body
			);
			return success
				? res.send(data)
				: res.status(404).json({ Error: message });
		} catch (error) {
			next(error);
		}
	}
}

export default FeeController;
