import type { Position } from 'geojson'
import { supabase } from '@/supabase'

export async function findNearestPoint(position: Position) {
  const [lon, lat] = position
  const { data: nearestPoint, error } = await supabase.rpc('find_nearest_point', { lon, lat }).single()
  if (error) {
    throw error
  }
  return nearestPoint
}

export async function getLocationPoints() {
  const { data: locationPoints, error } = await supabase
    .from('location_points')
    .select('id, category_id, description, geometry, title')
  if (error) {
    throw error
  }
  return locationPoints
}

export async function getLocationPaths(locationPointId: string) {
  const { data: locationPaths, error } = await supabase
    .from('location_paths')
    .select('id, category_id, description, geometry, location_point_id, title')
    .eq('location_point_id', locationPointId)
  if (error) {
    throw error
  }
  return locationPaths
}
