import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/responseHandler.js';
import * as operations from './operations.service.js';

export const getTransactions = asyncHandler(async (req, res) => successResponse(res, await operations.listTransactions(req.query)));
export const getReportAnalysis = asyncHandler(async (req, res) => successResponse(res, await operations.reportAnalysis(req.query)));
export const getDocuments = asyncHandler(async (req, res) => successResponse(res, await operations.listDocuments(req.query)));
export const uploadDocument = asyncHandler(async (req, res) => successResponse(res, await operations.createDocument(req.body, req.file, req.user?._id, req.ip), 'Document uploaded', 201));
export const downloadDocument = asyncHandler(async (req, res) => {
  const result = await operations.getDocumentFile(req.params.id);
  if (result.localPath) return res.download(result.localPath, result.document.originalName);
  return res.redirect(result.redirect);
});
export const archiveDocument = asyncHandler(async (req, res) => successResponse(res, await operations.archiveDocument(req.params.id, req.user?._id, req.ip)));
export const getInternalStaff = asyncHandler(async (req, res) => successResponse(res, await operations.listInternalStaff(req.query)));
export const createInternalStaff = asyncHandler(async (req, res) => successResponse(res, await operations.createInternalStaff(req.body, req.user?._id, req.ip), 'Internal staff onboarded', 201));
export const updateInternalStaff = asyncHandler(async (req, res) => successResponse(res, await operations.updateInternalStaff(req.params.id, req.body, req.user?._id, req.ip), 'Internal staff updated'));
