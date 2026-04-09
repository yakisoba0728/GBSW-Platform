import { describe, expect, it } from 'vitest'
import { buildProxyResponse } from './api-proxy'

describe('buildProxyResponse', () => {
  it('forwards content-disposition header in binary responses', async () => {
    const blob = new Blob(['data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const upstreamResponse = new Response(blob, {
      status: 200,
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': 'attachment; filename="export.xlsx"',
      },
    })

    const result = await buildProxyResponse(upstreamResponse)

    expect(result.headers.get('content-disposition')).toBe('attachment; filename="export.xlsx"')
  })

  it('does not set content-disposition when upstream has none', async () => {
    const blob = new Blob(['data'], { type: 'application/octet-stream' })
    const upstreamResponse = new Response(blob, {
      status: 200,
      headers: { 'content-type': 'application/octet-stream' },
    })

    const result = await buildProxyResponse(upstreamResponse)

    expect(result.headers.get('content-disposition')).toBeNull()
  })

  it('forwards content-length header in binary responses', async () => {
    const blob = new Blob(['data'], { type: 'application/octet-stream' })
    const upstreamResponse = new Response(blob, {
      status: 200,
      headers: {
        'content-type': 'application/octet-stream',
        'content-length': '4',
      },
    })

    const result = await buildProxyResponse(upstreamResponse)

    expect(result.headers.get('content-length')).toBe('4')
  })

  it('returns JSON response for JSON content-type', async () => {
    const upstreamResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })

    const result = await buildProxyResponse(upstreamResponse)

    expect(result.headers.get('content-type')).toContain('application/json')
    const body = await result.json()
    expect(body).toEqual({ ok: true })
  })

  it('preserves upstream status code for binary responses', async () => {
    const blob = new Blob(['not found'], { type: 'application/octet-stream' })
    const upstreamResponse = new Response(blob, {
      status: 404,
      headers: { 'content-type': 'application/octet-stream' },
    })

    const result = await buildProxyResponse(upstreamResponse)

    expect(result.status).toBe(404)
  })
})
