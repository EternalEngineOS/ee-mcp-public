/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * Produced by scripts/codegen.mjs from spec/openapi.public.json (mirrored
 * from https://github.com/EternalEngineOS/openapi).
 * Run `pnpm codegen` (or `pnpm build`) to regenerate.
 * Every entry corresponds to exactly one GET operation in the public spec —
 * there is no write tool here, and none can be added without editing this
 * generator or the source spec it reads.
 */

export interface GeneratedToolParam {
  name: string;
  in: string;
  required: boolean;
  type: 'string' | 'integer' | 'number' | 'boolean';
  description?: string;
}

export interface GeneratedTool {
  name: string;
  summary: string;
  method: 'GET';
  path: string;
  params: GeneratedToolParam[];
  rateLimit: { limit: number; window: string } | null;
  requiresAuth: boolean;
}

export const GENERATED_TOOLS: GeneratedTool[] = [
  {
    "name": "getAnalyticsOverview",
    "summary": "Get delivery overview",
    "method": "GET",
    "path": "/postframe/analytics/overview",
    "params": [
      {
        "name": "from",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "to",
        "in": "query",
        "required": false,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getAnalyticsTimeseries",
    "summary": "Get time series metrics",
    "method": "GET",
    "path": "/postframe/analytics/timeseries",
    "params": [
      {
        "name": "from",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "to",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "interval",
        "in": "query",
        "required": false,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getApiKeys",
    "summary": "List API keys",
    "method": "GET",
    "path": "/postframe/api-keys",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getAudiences",
    "summary": "List audiences",
    "method": "GET",
    "path": "/postframe/audiences",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getAudiencesByAudienceIdBroadcasts",
    "summary": "List broadcasts for an audience",
    "method": "GET",
    "path": "/postframe/audiences/{audienceId}/broadcasts",
    "params": [
      {
        "name": "audienceId",
        "in": "path",
        "required": true,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getAudiencesById",
    "summary": "Get audience details",
    "method": "GET",
    "path": "/postframe/audiences/{id}",
    "params": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getBillingSubscription",
    "summary": "Get subscription status",
    "method": "GET",
    "path": "/postframe/billing/subscription",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getConnectAccount",
    "summary": "Get the tenant's Stripe Connect account status",
    "method": "GET",
    "path": "/paygate/connect/account",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getConnectBalance",
    "summary": "Get the connected account's Stripe balance",
    "method": "GET",
    "path": "/paygate/connect/balance",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getContacts",
    "summary": "List contacts",
    "method": "GET",
    "path": "/postframe/contacts",
    "params": [
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "type": "integer"
      },
      {
        "name": "offset",
        "in": "query",
        "required": false,
        "type": "integer"
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getContactsById",
    "summary": "Get a contact",
    "method": "GET",
    "path": "/postframe/contacts/{id}",
    "params": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getCustomerByEmail",
    "summary": "Get a customer's transaction history",
    "method": "GET",
    "path": "/paygate/customers/{email}",
    "params": [
      {
        "name": "email",
        "in": "path",
        "required": true,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getDisputeById",
    "summary": "Get a dispute by ID",
    "method": "GET",
    "path": "/paygate/transactions/disputes/{id}",
    "params": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getDomains",
    "summary": "List domains",
    "method": "GET",
    "path": "/postframe/domains",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getDomainsById",
    "summary": "Get domain details",
    "method": "GET",
    "path": "/postframe/domains/{id}",
    "params": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getEmails",
    "summary": "List emails",
    "method": "GET",
    "path": "/postframe/emails",
    "params": [
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "type": "integer"
      },
      {
        "name": "offset",
        "in": "query",
        "required": false,
        "type": "integer"
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "to",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "from_date",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "to_date",
        "in": "query",
        "required": false,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getEmailsById",
    "summary": "Get email details",
    "method": "GET",
    "path": "/postframe/emails/{id}",
    "params": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getMerchantSettings",
    "summary": "Get merchant settings and fraud rules",
    "method": "GET",
    "path": "/paygate/settings",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getMonthToDateVolume",
    "summary": "Get the tenant's month-to-date processing volume",
    "method": "GET",
    "path": "/paygate/me/volume",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getPaymentStats",
    "summary": "Payment stats",
    "method": "GET",
    "path": "/paygate/transactions/stats",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getProviders",
    "summary": "List providers",
    "method": "GET",
    "path": "/postframe/providers",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getSettings",
    "summary": "Get tenant settings",
    "method": "GET",
    "path": "/postframe/settings",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getSettingsOnboarding",
    "summary": "Get onboarding status",
    "method": "GET",
    "path": "/postframe/settings/onboarding",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getStatus",
    "summary": "Service health (public, no auth)",
    "method": "GET",
    "path": "/paygate/status",
    "params": [],
    "rateLimit": null,
    "requiresAuth": false
  },
  {
    "name": "getSubscriptionInvoicePdf",
    "summary": "Download a branded PDF of the tenant's own platform subscription invoice",
    "method": "GET",
    "path": "/paygate/me/invoices/{invoiceId}/pdf",
    "params": [
      {
        "name": "invoiceId",
        "in": "path",
        "required": true,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getSuppressions",
    "summary": "List suppressions",
    "method": "GET",
    "path": "/postframe/suppressions",
    "params": [
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "type": "integer"
      },
      {
        "name": "offset",
        "in": "query",
        "required": false,
        "type": "integer"
      },
      {
        "name": "type",
        "in": "query",
        "required": false,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getTemplates",
    "summary": "List templates",
    "method": "GET",
    "path": "/postframe/templates",
    "params": [
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "type": "integer"
      },
      {
        "name": "offset",
        "in": "query",
        "required": false,
        "type": "integer"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getTemplatesById",
    "summary": "Get a template",
    "method": "GET",
    "path": "/postframe/templates/{id}",
    "params": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getTransactionById",
    "summary": "Get transaction by ID",
    "method": "GET",
    "path": "/paygate/transactions/{id}",
    "params": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getUsageQuota",
    "summary": "Get usage quota",
    "method": "GET",
    "path": "/postframe/usage/quota",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "getWebhooks",
    "summary": "List webhooks",
    "method": "GET",
    "path": "/postframe/webhooks",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "listApiKeys",
    "summary": "List API keys for the tenant",
    "method": "GET",
    "path": "/paygate/api-keys",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "listCheckoutSessions",
    "summary": "List recent Checkout sessions",
    "method": "GET",
    "path": "/paygate/connect/checkout/sessions",
    "params": [
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "type": "integer"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "listCoupons",
    "summary": "List Stripe coupons on the connected account",
    "method": "GET",
    "path": "/paygate/connect/coupons",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "listCustomers",
    "summary": "List customers (aggregated from transaction history)",
    "method": "GET",
    "path": "/paygate/customers",
    "params": [
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "type": "integer"
      },
      {
        "name": "offset",
        "in": "query",
        "required": false,
        "type": "integer"
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "sort_by",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "sort_dir",
        "in": "query",
        "required": false,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "listDisputes",
    "summary": "List disputes",
    "method": "GET",
    "path": "/paygate/transactions/disputes",
    "params": [
      {
        "name": "status",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "type": "integer"
      },
      {
        "name": "offset",
        "in": "query",
        "required": false,
        "type": "integer"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "listPayouts",
    "summary": "List Stripe Connect payouts",
    "method": "GET",
    "path": "/paygate/connect/payouts",
    "params": [
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "type": "integer"
      },
      {
        "name": "offset",
        "in": "query",
        "required": false,
        "type": "integer"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "listProducts",
    "summary": "List Stripe products/plans on the connected account",
    "method": "GET",
    "path": "/paygate/connect/products",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "listProviders",
    "summary": "List configured payment providers",
    "method": "GET",
    "path": "/paygate/transactions/providers",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "listRoutingRules",
    "summary": "List routing rules",
    "method": "GET",
    "path": "/paygate/transactions/routing",
    "params": [],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "listSubscriptions",
    "summary": "List Stripe subscriptions on the connected account",
    "method": "GET",
    "path": "/paygate/connect/subscriptions",
    "params": [
      {
        "name": "status",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "listTransactions",
    "summary": "List transactions",
    "method": "GET",
    "path": "/paygate/transactions",
    "params": [
      {
        "name": "status",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "type",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "provider",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "from_date",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "to_date",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "type": "integer"
      },
      {
        "name": "offset",
        "in": "query",
        "required": false,
        "type": "integer"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  },
  {
    "name": "listWebhookEvents",
    "summary": "List webhook delivery events",
    "method": "GET",
    "path": "/paygate/webhooks/events",
    "params": [
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "type": "integer"
      },
      {
        "name": "offset",
        "in": "query",
        "required": false,
        "type": "integer"
      },
      {
        "name": "event_type",
        "in": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "type": "string"
      }
    ],
    "rateLimit": {
      "limit": 100,
      "window": "1m"
    },
    "requiresAuth": true
  }
];
