import { Router } from 'express';
import FeeController from '../controllers';
import Validation from '../validation';

const router = Router();

router.post('/fees', FeeController.saveFeeConfig);
router.post('/compute-transaction-fee', Validation.validateRequest, FeeController.getFeeConfig);

export default router;