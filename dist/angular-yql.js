(function() {
  var YqlCorsBridgeInterceptor, buildUrl, forEachSorted, sortedKeys,
    __hasProp = {}.hasOwnProperty;

  forEachSorted = function(obj, iterator, context) {
    var key, keys, _i, _len;
    keys = sortedKeys(obj);
    for (_i = 0, _len = keys.length; _i < _len; _i++) {
      key = keys[_i];
      iterator.call(context, obj[key], key);
    }
    return keys;
  };

  sortedKeys = function(obj) {
    var key, _results;
    _results = [];
    for (key in obj) {
      if (!__hasProp.call(obj, key)) continue;
      _results.push(key);
    }
    return _results;
  };

  buildUrl = function(url, params) {
    var parts;
    if (!params) {
      return url;
    }
    parts = [];
    forEachSorted(params, function(value, key) {
      if (value == null) {
        return;
      }
      if (angular.isObject(value)) {
        value = angular.toJson(value);
      }
      return parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    });
    return url + (url.indexOf("?") === -1 ? "?" : "&") + parts.join("&");
  };

  YqlCorsBridgeInterceptor = (function() {
    YqlCorsBridgeInterceptor.$inject = ['$q'];

    function YqlCorsBridgeInterceptor($q) {
      this.$q = $q;
      this.request = this.request.bind(this);
      this.response = this.response.bind(this);
    }

    YqlCorsBridgeInterceptor.prototype.request = function(config) {
      var format, query, targetUrl;
      if (!config.yqlBridge) {
        return config;
      }
      if (config.method !== "GET") {
        throw new Error("YQL bridge can only be used for GET requests.");
      }
      targetUrl = buildUrl(config.url, config.params);
      format = config.yqlFormat || 'json';
      config.yqlTable = config.yqlTable || "json";
      config.url = "http://query.yahooapis.com/v1/public/yql";
      query = 'select * from ' + config.yqlTable + ' where url="' + targetUrl + '"';
      if (config.yqlXPath) {
        query = query + ' and xpath="' + config.yqlXPath + '"';
      }
      config.params = {
        q: query,
        format: format,
        diagnostics: config.yqlDiagnostics
      };
      config.useXDomain = true;
      return config;
    };

    YqlCorsBridgeInterceptor.prototype.response = function(response) {
      var data, _ref, _ref1;
      if (!response.config.yqlBridge) {
        return response;
      }
      if (response.config.yqlDiagnostics) {
        return response;
      }
      if ((_ref = response.data.query) != null ? (_ref1 = _ref.results) != null ? _ref1.error : void 0 : void 0) {
        return this.$q.reject(response.data.query.results.error);
      }
      if (response.config.yqlTable === "json") {
        data = response.data.query.results.json;
        response.data = data;
      } else if (response.config.yqlTable === "data.uri") {
        data = response.data.query.results.url;
        response.data = data;
      } else if (response.data.query) {
        data = response.data.query.results;
        response.data = data;
      }
      return response;
    };

    YqlCorsBridgeInterceptor.$inject = ["$q"];

    return YqlCorsBridgeInterceptor;

  })();

  angular.module("yql", []).service("yqlBridgeInterceptor", YqlCorsBridgeInterceptor).config([
    "$httpProvider", function($httpProvider) {
      return $httpProvider.interceptors.push("yqlBridgeInterceptor");
    }
  ]);

}).call(this);
