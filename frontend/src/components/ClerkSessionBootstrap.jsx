import { useEffect, useRef } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useDispatch } from 'react-redux'
import { setCredentials, logout as clearAuth } from '../features/auth/authSlice'
import { useSyncUserMutation } from '../features/api/apiSlice'
import { readStoredJson, readStoredToken } from '../utils/storage'
import { buildClerkSyncPayload } from '../utils/clerk'

const ClerkSessionBootstrap = () => {
	const dispatch = useDispatch()
	const { isLoaded, isSignedIn } = useAuth()
	const { user } = useUser()
	const [syncUser] = useSyncUserMutation()
	const lastSyncedClerkIdRef = useRef('')

	useEffect(() => {
		if (!isLoaded) {
			return
		}

		if (!isSignedIn || !user) {
			const hasStoredAuth = Boolean(readStoredToken() || readStoredJson('user', null))

			if (hasStoredAuth) {
				localStorage.removeItem('token')
				localStorage.removeItem('user')
				dispatch(clearAuth())
			}

			lastSyncedClerkIdRef.current = ''
			return
		}

		if (lastSyncedClerkIdRef.current === user.id && readStoredToken()) {
			return
		}

		let isCancelled = false
		lastSyncedClerkIdRef.current = user.id

		const sync = async () => {
			try {
				const response = await syncUser(buildClerkSyncPayload(user)).unwrap()

				if (isCancelled || !response?.token || !response?.user) {
					return
				}

				localStorage.setItem('token', response.token)
				localStorage.setItem('user', JSON.stringify(response.user))
				dispatch(setCredentials({ token: response.token, user: response.user }))
			} catch (error) {
				console.error('Clerk sync failed:', error)
				lastSyncedClerkIdRef.current = ''
			}
		}

		sync()

		return () => {
			isCancelled = true
		}
	}, [dispatch, isLoaded, isSignedIn, syncUser, user])

	return null
}

export default ClerkSessionBootstrap
