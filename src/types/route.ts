import type { Tables } from './supabase'

export type UserRouteStatus = 'generated' | 'started' | 'finished' | 'canceled' | 'paused' | 'frozen'
export type UserRoute = Tables<'user_routes'> & {
  start_geometry: GeoJSON.Point
  finish_geometry: GeoJSON.Point
  user_path_geometry: GeoJSON.Point
  status: UserRouteStatus
}
