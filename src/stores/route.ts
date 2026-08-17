import type { FeatureCollection, LineString, Point, Position } from 'geojson'
import type { UserRoute } from '@/types/route'
import { distance, point } from '@turf/turf'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { getRoutePath } from '@/api/path'
import { cancelUserRoute, createUserRoute, finishUserRoute, getUserRoutes, pauseUserRoute, startUserRoute, unpauseUserRoute } from '@/api/userRoute'
import { useGeolocation } from '@/composables/useGeolocation'

export const useRouteStore = defineStore('route', {
  state: () => ({
    routes: useLocalStorage<Array<UserRoute>>('routes', []),
    state: useLocalStorage<UserRoute | null>('activeRoute', null, { serializer: StorageSerializers.object }),
    path: useLocalStorage<FeatureCollection<LineString> | null>('activePath', null, { serializer: StorageSerializers.object }),
  }),
  getters: {
    lastRoute(): UserRoute | null {
      return this.routes.at(0) ?? null
    },
    status(): UserRoute['status'] | null {
      return this.state?.status ?? null
    },
    startPosition(): Position | null {
      return this.state?.start_geometry.coordinates ?? null
    },
    finishPosition(): Position | null {
      return this.state?.finish_geometry.coordinates ?? null
    },
    totalDistance(): number {
      if (!this.startPosition || !this.finishPosition) {
        return 0
      }
      return distance(point(this.startPosition), point(this.finishPosition), { units: 'meters' })
    },
    currentDistance(): number {
      if (!this.finishPosition) {
        return 0
      }
      const { position } = useGeolocation()
      const { longitude, latitude } = position.value.coords
      return distance(point([longitude, latitude]), point(this.finishPosition), { units: 'meters' })
    },
    completedPercent(): number {
      if (!this.totalDistance || !this.currentDistance) {
        return 0
      }
      return Math.max(Math.floor((this.totalDistance - this.currentDistance) / this.totalDistance * 100), 0)
    },
    isDailyRouteCompleted(): boolean {
      if (!this.lastRoute) {
        return false
      }
      const now = Temporal.PlainDate.from(Temporal.Now.plainDateTimeISO())
      const lastRouteDate = Temporal.PlainDate.from(this.lastRoute.created_at)
      if (lastRouteDate.until(now).days > 0) {
        return false
      }
      const FINISHED_STATUSES: ReadonlyArray<UserRoute['status']> = ['canceled', 'finished', 'frozen']
      return this.lastRoute.status ? FINISHED_STATUSES.includes(this.lastRoute.status) : false
    },
    daysStreak(): number {
      const datesStatuses = this.routes.reduce((acc: Record<string, UserRoute['status']>, route) => {
        const date = Temporal.PlainDate.from(route.created_at).toString()
        if (date in acc) {
          return acc
        }
        acc[date] = route.status
        return acc
      }, {})
      let streak = 0
      let dateToCompare = Temporal.PlainDate.from(Temporal.Now.plainDateISO())
      for (const date in datesStatuses) {
        const plainDate = Temporal.PlainDate.from(date)
        const daysUntilDateToCompare = plainDate.until(dateToCompare).days
        if (daysUntilDateToCompare > 1 || datesStatuses[date] === 'canceled') {
          break
        }
        if (datesStatuses[date] === 'finished' || datesStatuses[date] === 'frozen') {
          streak++
        }
        dateToCompare = Temporal.PlainDate.from(date)
      }
      return streak
    },
  },
  actions: {
    isStartedStatus(status: UserRoute['status'] | null): boolean {
      const STARTED_STATUSES: ReadonlyArray<UserRoute['status']> = ['started', 'paused']
      return status ? STARTED_STATUSES.includes(status) : false
    },
    isFinishedStatus(status: UserRoute['status'] | null): boolean {
      const FINISHED_STATUSES: ReadonlyArray<UserRoute['status']> = ['canceled', 'finished', 'frozen']
      return status ? FINISHED_STATUSES.includes(status) : false
    },
    async getRoutes(): Promise<Array<UserRoute>> {
      const userDailyRoutes = await getUserRoutes(365)
      this.routes = userDailyRoutes
      return userDailyRoutes
    },
    async createRoute(route: Partial<UserRoute>) {
      const newRoute = await createUserRoute(route)
      this.routes.push(newRoute)
      this.state = newRoute
      return this.state
    },
    async startRoute(routeId: UserRoute['id']) {
      const routeIndex = this.routes.findIndex(({ id }) => id === routeId)
      if (routeIndex === -1) {
        throw new Error('Route not found')
      }
      if (this.routes[routeIndex].status !== 'generated' && this.routes[routeIndex].status !== 'paused') {
        throw new Error(`Cannot start route with status ${this.routes[routeIndex].status}`)
      }
      this.path = await getRoutePath(this.routes[routeIndex].start_geometry, this.routes[routeIndex].finish_geometry)
      const startedRoute = await startUserRoute(routeId)
      this.routes[routeIndex] = startedRoute
      this.state = startedRoute
    },
    async cancelRoute(routeId: UserRoute['id']) {
      const routeIndex = this.routes.findIndex(({ id }) => id === routeId)
      if (routeIndex === -1) {
        throw new Error('Route not found')
      }
      const cancelableStatuses: ReadonlyArray<UserRoute['status']> = ['generated', 'started', 'paused']
      if (!cancelableStatuses.includes(this.routes[routeIndex].status)) {
        throw new Error(`Cannot cancel with status ${this.routes[routeIndex].status}`)
      }
      const canceledRoute = await cancelUserRoute(this.routes[routeIndex].id)
      this.routes[routeIndex] = canceledRoute
      this.getRoutes()
      this.path = null
      this.state = null
    },
    async finishRoute(routeId: UserRoute['id']) {
      const routeIndex = this.routes.findIndex(({ id }) => id === routeId)
      if (routeIndex === -1) {
        throw new Error('Route not found')
      }
      const finishedRoute = await finishUserRoute(routeId)
      this.routes[routeIndex] = finishedRoute
      this.state = null
      this.path = null
    },
    async pauseRoute(routeId: UserRoute['id']) {
      const routeIndex = this.routes.findIndex(({ id }) => id === routeId)
      if (routeIndex === -1) {
        throw new Error('Route not found')
      }
      if (this.routes[routeIndex].status !== 'started') {
        throw new Error(`Cannot pause with status ${this.routes[routeIndex].status}`)
      }
      const pausedRoute = await pauseUserRoute(routeId)
      this.routes[routeIndex] = pausedRoute
      this.state = pausedRoute
    },
    async unpauseRoute(routeId: UserRoute['id']) {
      const routeIndex = this.routes.findIndex(({ id }) => id === routeId)
      if (routeIndex === -1) {
        throw new Error('Route not found')
      }
      if (this.routes[routeIndex].status !== 'paused') {
        throw new Error(`Cannot unpause with status ${this.routes[routeIndex].status}`)
      }
      const unpausedRoute = await unpauseUserRoute(routeId)
      this.routes[routeIndex] = unpausedRoute
      this.state = unpausedRoute
    },
    async recalculateCurrentRoutePath(): Promise<FeatureCollection<LineString>> {
      if (!this.state) {
        throw new Error('No active route')
      }
      if (!this.state?.finish_geometry) {
        throw new Error('Finish position is not set')
      }
      const { position } = useGeolocation()
      const { coords: { longitude, latitude } } = position.value
      const currentPosition: Point = {
        type: 'Point',
        coordinates: [longitude, latitude],
      }
      this.path = await getRoutePath(currentPosition, this.state.finish_geometry)
      return this.path
    },
  },
})
