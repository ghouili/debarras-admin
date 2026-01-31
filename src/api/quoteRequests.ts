export {
  listDevis as listQuoteRequests,
  getDevis as getQuoteRequest,
  createDevis as createQuoteRequest,
  updateDevis as updateQuoteRequest,
  deleteDevis as deleteQuoteRequest,
} from './devis'

export type {
  CreateDevisPayload as QuoteRequestPayload,
  UpdateDevisPayload as UpdateQuoteRequestPayload,
  ListDevisParams as ListQuoteRequestsParams,
} from './devis'
