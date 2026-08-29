// craco.config.js
const path = require("path");
require("dotenv").config();

process.env.BABEL_ENV = process.env.NODE_ENV || "production";

// Check if we're in development/preview mode (not production build)
// Craco sets NODE_ENV=development for start, NODE_ENV=production for build
const isDevServer = process.env.NODE_ENV !== "production";

if (!isDevServer) {
  process.env.FAST_REFRESH = "false";
}

// Environment variable overrides
const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
};

function makeDevServerV5Compatible(devServerConfig) {
  const {
    https,
    onAfterSetupMiddleware,
    onBeforeSetupMiddleware,
    onListening,
    setupMiddlewares,
    ...compatibleConfig
  } = devServerConfig;

  compatibleConfig.server =
    typeof https === "object"
      ? { type: "https", options: https }
      : https
        ? "https"
        : "http";
  compatibleConfig.headers = {
    ...compatibleConfig.headers,
    "Cross-Origin-Resource-Policy": "same-origin",
  };

  if (onBeforeSetupMiddleware || setupMiddlewares) {
    compatibleConfig.setupMiddlewares = (middlewares, devServer) => {
      if (onBeforeSetupMiddleware) {
        onBeforeSetupMiddleware(devServer);
      }

      return setupMiddlewares
        ? setupMiddlewares(middlewares, devServer)
        : middlewares;
    };
  }

  compatibleConfig.onListening = (devServer) => {
    devServer.close ??= (callback) => devServer.stopCallback(callback);

    if (onListening) {
      onListening(devServer);
    }
    if (onAfterSetupMiddleware) {
      onAfterSetupMiddleware(devServer);
    }
  };

  return compatibleConfig;
}

// Conditionally load health check modules only if enabled
let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

let webpackConfig = {
  babel: {
    loaderOptions: (babelLoaderOptions) => {
      if (babelLoaderOptions && babelLoaderOptions.plugins) {
        babelLoaderOptions.plugins = babelLoaderOptions.plugins
          .filter((plugin) => {
            if (!isDevServer) {
              const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
              const nameStr = typeof pluginName === "string" ? pluginName : (pluginName && pluginName.name) || "";
              if (nameStr.includes("react-refresh")) {
                return false;
              }
            }
            return true;
          })
          .map((plugin) => {
            const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
            const nameStr = typeof pluginName === "string" ? pluginName : (pluginName && pluginName.name) || "";
            if (nameStr.includes("react-refresh")) {
              const pluginOpts = Array.isArray(plugin) && plugin[1] ? plugin[1] : {};
              return [pluginName, { ...pluginOpts, skipEnvCheck: true }];
            }
            return plugin;
          });
      }
      return babelLoaderOptions;
    },
  },
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // Clean up react-refresh babel plugin in production
      if (!isDevServer && webpackConfig.module && webpackConfig.module.rules) {
        const cleanBabelPlugins = (rule) => {
          if (!rule) return;
          if (rule.options && rule.options.plugins) {
            rule.options.plugins = rule.options.plugins.filter((p) => {
              const name = Array.isArray(p) ? p[0] : p;
              return typeof name === "string" ? !name.includes("react-refresh") : true;
            });
          }
          if (rule.use) {
            if (Array.isArray(rule.use)) {
              rule.use.forEach(cleanBabelPlugins);
            } else {
              cleanBabelPlugins(rule.use);
            }
          }
          if (rule.oneOf) {
            rule.oneOf.forEach(cleanBabelPlugins);
          }
        };
        webpackConfig.module.rules.forEach(cleanBabelPlugins);
      }

      // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
        ],
      };

      if (!isDevServer) {
        webpackConfig.devtool = false;
        if (webpackConfig.optimization && webpackConfig.optimization.minimizer) {
          webpackConfig.optimization.minimizer.forEach((minimizer) => {
            if (minimizer && minimizer.options) {
              minimizer.options.parallel = false;
            }
          });
        }
      }

      // Add health check plugin to webpack if enabled
      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }
      return webpackConfig;
    },
  },
};

webpackConfig.devServer = (devServerConfig) => {
  // Add health check endpoints if enabled
  if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
    const originalSetupMiddlewares = devServerConfig.setupMiddlewares;

    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      // Call original setup if exists
      if (originalSetupMiddlewares) {
        middlewares = originalSetupMiddlewares(middlewares, devServer);
      }

      // Setup health endpoints
      setupHealthEndpoints(devServer, healthPluginInstance);

      return middlewares;
    };
  }

  return devServerConfig;
};

// Wrap with visual edits (automatically adds babel plugin, dev server, and overlay in dev mode)
if (isDevServer) {
  try {
    const { withVisualEdits } = require("@emergentbase/visual-edits/craco");
    webpackConfig = withVisualEdits(webpackConfig);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && err.message.includes('@emergentbase/visual-edits/craco')) {
      console.warn(
        "[visual-edits] @emergentbase/visual-edits not installed — visual editing disabled."
      );
    } else {
      throw err;
    }
  }
}

const configureDevServer = webpackConfig.devServer;
webpackConfig.devServer = (devServerConfig) =>
  makeDevServerV5Compatible(configureDevServer(devServerConfig));

module.exports = webpackConfig;
