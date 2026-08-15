import type { UserRoute, UserRouteStatus } from '@/types/route'
import { supabase } from '@/supabase'
import 'temporal-polyfill/global'

export async function getUserRoutes(limit = 50, statuses?: Array<UserRouteStatus>): Promise<Array<UserRoute>> {
  const { data: { session }, error: userError } = await supabase.auth.getSession()
  if (userError) {
    throw userError
  }
  else if (!session?.user) {
    throw new Error('User not found')
  }
  let request = supabase
    .from('user_routes')
    .select()
    .eq('user_id', session.user.id)
    .limit(limit)
  if (statuses) {
    request = request.in('status', statuses)
  }
  request.order('created_at', { ascending: false })
  const { data, error } = await request.overrideTypes<Array<UserRoute>>()
  if (error) {
    throw error
  }
  return data
}

export async function getUserRoute(routeId: string) {
  const { data: { session }, error: userError } = await supabase.auth.getSession()
  if (userError) {
    throw userError
  }
  else if (!session?.user) {
    throw new Error('User not found')
  }
  const { data, error } = await supabase
    .from('user_routes')
    .select()
    .eq('user_id', session.user.id)
    .eq('id', routeId)
    .single()
    .overrideTypes<UserRoute>()
  if (error) {
    throw error
  }
  return data
}

export async function createUserRoute(userRoute: Partial<UserRoute>): Promise<UserRoute> {
  const { data: { session }, error: userError } = await supabase.auth.getSession()
  if (userError) {
    throw userError
  }
  else if (!session?.user) {
    throw new Error('User not found')
  }
  const { data, error } = await supabase
    .from('user_routes')
    .insert({ ...userRoute, user_id: session.user.id, status: 'generated', updated_at: Temporal.Now.instant().toString() })
    .select()
    .single()
    .overrideTypes<UserRoute>()
  if (error) {
    throw error
  }
  return data
}
export async function startUserRoute(userRouteId: UserRoute['id']) {
  const { data: { session }, error: userError } = await supabase.auth.getSession()
  if (userError) {
    throw userError
  }
  else if (!session?.user) {
    throw new Error('User not found')
  }
  const now = Temporal.Now.instant().toString()
  const { data, error } = await supabase
    .from('user_routes')
    .update({ started_at: now, status: 'started', updated_at: now })
    .eq('user_id', session.user.id)
    .eq('id', userRouteId)
    .select()
    .single()
    .overrideTypes<UserRoute>()
  if (error) {
    throw error
  }
  return data
}

export async function pauseUserRoute(userRouteId: UserRoute['id']) {
  const { data: { session }, error: userError } = await supabase.auth.getSession()
  if (userError) {
    throw userError
  }
  else if (!session?.user) {
    throw new Error('User not found')
  }
  const now = Temporal.Now.instant().toString()
  const { data, error } = await supabase
    .from('user_routes')
    .update({ status: 'paused', updated_at: now })
    .eq('user_id', session.user.id)
    .eq('id', userRouteId)
    .select()
    .single()
    .overrideTypes<UserRoute>()
  if (error) {
    throw error
  }
  return data
}

export async function unpauseUserRoute(userRouteId: UserRoute['id']) {
  const { data: { session }, error: userError } = await supabase.auth.getSession()
  if (userError) {
    throw userError
  }
  else if (!session?.user) {
    throw new Error('User not found')
  }
  const now = Temporal.Now.instant().toString()
  const { data, error } = await supabase
    .from('user_routes')
    .update({ status: 'started', updated_at: now })
    .eq('user_id', session.user.id)
    .eq('id', userRouteId)
    .select()
    .single()
    .overrideTypes<UserRoute>()
  if (error) {
    throw error
  }
  return data
}

export async function cancelUserRoute(userRouteId: UserRoute['id']): Promise<UserRoute> {
  const { data: { session }, error: userError } = await supabase.auth.getSession()
  if (userError) {
    throw userError
  }
  else if (!session?.user) {
    throw new Error('User not found')
  }
  const now = Temporal.Now.instant().toString()
  const { data, error } = await supabase
    .from('user_routes')
    .update({ status: 'canceled', updated_at: now })
    .eq('user_id', session.user.id)
    .eq('id', userRouteId)
    .select()
    .single()
    .overrideTypes<UserRoute>()
  if (error) {
    throw error
  }
  return data
}

export async function finishUserRoute(userRouteId: UserRoute['id']) {
  const { data: { session }, error: userError } = await supabase.auth.getSession()
  if (userError) {
    throw userError
  }
  else if (!session?.user) {
    throw new Error('User not found')
  }
  const now = Temporal.Now.instant().toString()
  const { data, error } = await supabase
    .from('user_routes')
    .update({ finished_at: now, status: 'finished', updated_at: now })
    .eq('user_id', session.user.id)
    .eq('id', userRouteId)
    .select()
    .single()
    .overrideTypes<UserRoute>()
  if (error) {
    throw error
  }
  return data
}
