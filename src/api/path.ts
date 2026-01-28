import type { FeatureCollection, LineString, Point } from 'geojson'
import ky from 'ky'
import { getAppLocale } from '@/i18n'

export async function getRoutePath(start: Point, finish: Point): Promise<FeatureCollection<LineString>> {
  if (!import.meta.env.VITE_OPEN_ROUTE_SERVICE_KEY) {
    throw new Error('VITE_OPEN_ROUTE_SERVICE_KEY is missing')
  }
  const url = new URL(`https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson`)
  return await ky.post(url, {
    retry: {
      limit: 5,
      statusCodes: [404],
      afterStatusCodes: [404],
    },
    headers: {
      Authorization: import.meta.env.VITE_OPEN_ROUTE_SERVICE_KEY,
      Accept: 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
    },
    json: {
      language: getAppLocale(),
      coordinates: [start.coordinates, finish.coordinates],
      radiuses: [5000],
    },
  }).json<FeatureCollection<LineString>>()
}
