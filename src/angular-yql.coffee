# 3 functions copied from angular http source, they should expose this for reuse   
forEachSorted = (obj, iterator, context) ->
  keys = sortedKeys(obj)
  iterator.call(context, obj[key], key) for key in keys
  keys

sortedKeys = (obj) ->
  key for own key of obj

buildUrl = (url, params) ->
  return url unless params
  parts = []
  forEachSorted(params, (value, key) ->
    return unless value?
    value = angular.toJson(value) if angular.isObject(value)
    parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(value))
  )
  url + ((if (url.indexOf("?") is -1) then "?" else "&")) + parts.join("&")

class YqlCorsBridgeInterceptor
  @$inject =   ['$q']
  constructor: (@$q ) ->
    @request = @request.bind(@)
    @response = @response.bind(@)

  request: (config) ->
    return config unless config.yqlBridge
    throw new Error("YQL bridge can only be used for GET requests.") unless config.method is "GET"

    targetUrl = buildUrl(config.url, config.params)
    format = config.yqlFormat or 'json'
    config.yqlTable = config.yqlTable or "json"
    config.url = "http://query.yahooapis.com/v1/public/yql"
    query = 'select * from ' + config.yqlTable + ' where url="' + targetUrl + '"'
    query = query + ' and xpath="' + config.yqlXPath + '"'  if config.yqlXPath

    config.params =
      q: query
      format: format
      diagnostics: config.yqlDiagnostics

    config.useXDomain = true
    config

  response: (response) ->
    return response  unless response.config.yqlBridge
    if response.config.yqlDiagnostics
      return response
    if response.data.query?.results?.error
      return @$q.reject(response.data.query.results.error)
    if response.config.yqlTable is "json"
      data = response.data.query.results.json
      response.data = data
    else if response.config.yqlTable is "data.uri"
      data = response.data.query.results.url
      response.data = data
    else if response.data.query
      data = response.data.query.results
      response.data = data
    response

  YqlCorsBridgeInterceptor.$inject = ["$q"]
  

angular.module("yql", [])
.service("yqlBridgeInterceptor", YqlCorsBridgeInterceptor)
.config([
  "$httpProvider",
  ($httpProvider) ->
    $httpProvider.interceptors.push("yqlBridgeInterceptor")
])
