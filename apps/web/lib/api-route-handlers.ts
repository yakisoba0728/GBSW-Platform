import type { NextRequest } from 'next/server'
import type { ProxyRequestMethod } from './api-proxy'

type StaticProxyHandler<Pathname extends string> = (
  request: NextRequest,
  pathname: Pathname,
) => Promise<Response>

type MethodProxyHandler<
  Pathname extends string,
  Method extends ProxyRequestMethod,
> = (request: NextRequest, pathname: Pathname, method: Method) => Promise<Response>

export type RouteParamsContext<ParamKey extends string> = {
  params: Promise<Record<ParamKey, string>>
}

export function createStaticProxyHandler<Pathname extends string>(
  proxy: StaticProxyHandler<Pathname>,
  pathname: Pathname,
) {
  return function handleStaticProxyRoute(request: NextRequest) {
    return proxy(request, pathname)
  }
}

export function createMethodProxyHandler<
  Pathname extends string,
  Method extends ProxyRequestMethod,
>(
  proxy: MethodProxyHandler<Pathname, Method>,
  pathname: Pathname,
  method: Method,
) {
  return function handleMethodProxyRoute(request: NextRequest) {
    return proxy(request, pathname, method)
  }
}

export function createParamProxyHandler<
  ParamKey extends string,
  Pathname extends string,
>(
  paramKey: ParamKey,
  buildPathname: (encodedParam: string) => Pathname,
  proxy: StaticProxyHandler<Pathname>,
) {
  return async function handleParamProxyRoute(
    request: NextRequest,
    context: RouteParamsContext<ParamKey>,
  ) {
    const params = await context.params
    return proxy(request, buildPathname(encodeURIComponent(params[paramKey])))
  }
}

export function createParamMethodProxyHandler<
  ParamKey extends string,
  Pathname extends string,
  Method extends ProxyRequestMethod,
>(
  paramKey: ParamKey,
  buildPathname: (encodedParam: string) => Pathname,
  proxy: MethodProxyHandler<Pathname, Method>,
  method: Method,
) {
  return async function handleParamMethodProxyRoute(
    request: NextRequest,
    context: RouteParamsContext<ParamKey>,
  ) {
    const params = await context.params
    return proxy(request, buildPathname(encodeURIComponent(params[paramKey])), method)
  }
}
