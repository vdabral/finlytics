const express = require("express");

/**
 * API Versioning Middleware
 * Supports versioning through:
 * 1. URL path (/api/v1/, /api/v2/)
 * 2. Accept header (application/vnd.api+json;version=1)
 * 3. Custom version header (X-API-Version: 1)
 */

const API_VERSIONS = {
  v1: "1.0.0",
  v2: "2.0.0",
};

const DEFAULT_VERSION = "v1";
const CURRENT_VERSION = "v1";

/**
 * Extract version from various sources
 */
function extractVersion(req) {
  // 1. Check URL path version
  const pathVersion =
    req.params.version || req.path.match(/\/api\/v(\d+)/)?.[1];
  if (pathVersion) {
    return `v${pathVersion}`;
  }

  // 2. Check Accept header
  const acceptHeader = req.get("Accept");
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/version=(\d+)/);
    if (versionMatch) {
      return `v${versionMatch[1]}`;
    }
  }

  // 3. Check custom version header
  const versionHeader = req.get("X-API-Version");
  if (versionHeader) {
    return versionHeader.startsWith("v") ? versionHeader : `v${versionHeader}`;
  }

  // 4. Default version
  return DEFAULT_VERSION;
}

/**
 * Validate if version is supported
 */
function isVersionSupported(version) {
  return Object.keys(API_VERSIONS).includes(version);
}

/**
 * Version middleware
 */
function apiVersioning(req, res, next) {
  const requestedVersion = extractVersion(req);

  if (!isVersionSupported(requestedVersion)) {
    return res.status(400).json({
      success: false,
      message: `API version ${requestedVersion} is not supported`,
      supportedVersions: Object.keys(API_VERSIONS),
      currentVersion: CURRENT_VERSION,
    });
  }

  // Set version information in request
  req.apiVersion = requestedVersion;
  req.apiVersionNumber = API_VERSIONS[requestedVersion];

  // Set response headers
  res.set("X-API-Version", requestedVersion);
  res.set("X-API-Version-Number", API_VERSIONS[requestedVersion]);

  next();
}

/**
 * Version-specific route handler
 */
function versionedRoute(handlers) {
  return (req, res, next) => {
    const version = req.apiVersion || DEFAULT_VERSION;
    const handler = handlers[version] || handlers[DEFAULT_VERSION];

    if (!handler) {
      return res.status(501).json({
        success: false,
        message: `Handler for version ${version} not implemented`,
        availableVersions: Object.keys(handlers),
      });
    }

    handler(req, res, next);
  };
}

/**
 * Deprecation warning middleware
 */
function deprecationWarning(version, deprecatedInVersion, removalVersion) {
  return (req, res, next) => {
    if (req.apiVersion === version) {
      res.set("X-API-Deprecated", "true");
      res.set("X-API-Deprecated-In", deprecatedInVersion);
      res.set("X-API-Removal-Date", removalVersion);
      res.set(
        "Warning",
        `299 - "API version ${version} is deprecated. Please migrate to version ${CURRENT_VERSION}"`
      );
    }
    next();
  };
}

/**
 * Version compatibility middleware
 */
function ensureCompatibility(req, res, next) {
  const version = req.apiVersion;

  // Version-specific transformations
  switch (version) {
    case "v1":
      // Ensure backward compatibility for v1
      req.legacy = true;
      break;
    case "v2":
      // v2 specific setup
      req.enhanced = true;
      break;
    default:
      break;
  }

  next();
}

/**
 * Response transformer for different versions
 */
function transformResponse(req, res, originalJson) {
  return function (data) {
    const version = req.apiVersion;

    // Add version metadata to response
    const versionedResponse = {
      ...data,
      meta: {
        ...data.meta,
        apiVersion: version,
        apiVersionNumber: API_VERSIONS[version],
        timestamp: new Date().toISOString(),
      },
    };

    // Version-specific transformations
    switch (version) {
      case "v1":
        // v1 specific response format
        return originalJson.call(res, transformV1Response(versionedResponse));
      case "v2":
        // v2 specific response format
        return originalJson.call(res, transformV2Response(versionedResponse));
      default:
        return originalJson.call(res, versionedResponse);
    }
  };
}

function transformV1Response(data) {
  // Transform response for v1 compatibility
  // Remove new fields that weren't in v1
  if (data.portfolios) {
    data.portfolios = data.portfolios.map((portfolio) => {
      const { environmentalScore, riskScore, ...v1Portfolio } = portfolio;
      return v1Portfolio;
    });
  }

  return data;
}

function transformV2Response(data) {
  // Enhanced response for v2
  // Add additional computed fields
  if (data.portfolios) {
    data.portfolios = data.portfolios.map((portfolio) => ({
      ...portfolio,
      computed: {
        riskLevel: calculateRiskLevel(portfolio),
        diversificationScore: calculateDiversification(portfolio),
      },
    }));
  }

  return data;
}

function calculateRiskLevel(portfolio) {
  // Simplified risk calculation
  if (!portfolio.totalValue) return "unknown";

  const volatility =
    portfolio.assets?.reduce((acc, asset) => {
      return acc + (asset.volatility || 0);
    }, 0) / (portfolio.assets?.length || 1);

  if (volatility < 0.1) return "low";
  if (volatility < 0.2) return "medium";
  return "high";
}

function calculateDiversification(portfolio) {
  // Simplified diversification score
  const assetCount = portfolio.assets?.length || 0;
  const sectorCount = new Set(portfolio.assets?.map((a) => a.sector)).size || 0;

  return Math.min(100, (sectorCount / assetCount) * 100);
}

/**
 * Setup versioned router
 */
function createVersionedRouter() {
  const router = express.Router();

  // Apply versioning middleware
  router.use(apiVersioning);
  router.use(ensureCompatibility);

  // Override res.json to add version transformations
  router.use((req, res, next) => {
    const originalJson = res.json;
    res.json = transformResponse(req, res, originalJson);
    next();
  });

  return router;
}

/**
 * Get API version information
 */
function getVersionInfo() {
  return {
    versions: API_VERSIONS,
    current: CURRENT_VERSION,
    default: DEFAULT_VERSION,
    supported: Object.keys(API_VERSIONS),
    endpoints: {
      versioning: {
        path: "/api/v{version}/*",
        header: "X-API-Version",
        accept: "application/vnd.api+json;version={version}",
      },
    },
  };
}

module.exports = {
  apiVersioning,
  versionedRoute,
  deprecationWarning,
  ensureCompatibility,
  createVersionedRouter,
  getVersionInfo,
  API_VERSIONS,
  CURRENT_VERSION,
  DEFAULT_VERSION,
};
