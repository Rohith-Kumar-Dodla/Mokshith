import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/responseHandler.js';
import * as service from './paymentProof.service.js';

export const getBankDetails = asyncHandler(async (req, res) => {
  const bankDetails = service.getBankDetails();
  successResponse(res, bankDetails, 'Bank transfer details retrieved');
});

export const uploadPaymentProof = asyncHandler(async (req, res) => {
  const { orderId, utrNumber, transferredAmount } = req.body;
  const proof = await service.uploadPaymentProof(req.user.id, {
    orderId,
    utrNumber,
    transferredAmount,
    file: req.file,
  });
  successResponse(res, proof, 'Payment proof submitted successfully', 201);
});

export const getPendingPaymentProofs = asyncHandler(async (req, res) => {
  const proofs = await service.getPendingPaymentProofs();
  successResponse(res, proofs, 'Pending payment proofs retrieved');
});

export const getPaymentProofByOrderId = asyncHandler(async (req, res) => {
  const data = await service.getPaymentProofByOrderId(
    req.params.orderId,
    req.user.id,
    req.user.role
  );
  successResponse(res, data, 'Payment proof retrieved');
});

export const approvePaymentProof = asyncHandler(async (req, res) => {
  const proof = await service.approvePaymentProof(req.params.id, req.user.id);
  successResponse(res, proof, 'Payment proof approved');
});

export const rejectPaymentProof = asyncHandler(async (req, res) => {
  const proof = await service.rejectPaymentProof(
    req.params.id,
    req.user.id,
    req.body.reason
  );
  successResponse(res, proof, 'Payment proof rejected');
});
