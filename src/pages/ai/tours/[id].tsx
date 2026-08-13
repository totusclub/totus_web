import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { buildHotelDetailsDeepLinkQuery } from '@/utils/hotelDetailsUtils'

/**
 * Bridge from AI chat links (`/ai/tours/lt_<hotelId>`) to kedam `/hotel-details`.
 * Price is NOT passed — hotel-details loads rooms with search params and shows cheapest.
 */
export default function AiTourPage() {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return

    const tourId = typeof router.query.id === 'string' ? router.query.id : ''
    const ltMatch = /^lt_(\d+)$/i.exec(tourId)

    if (ltMatch) {
      const hotelId = ltMatch[1]
      const query = buildHotelDetailsDeepLinkQuery(hotelId)

      const room =
        typeof router.query.room === 'string'
          ? router.query.room
          : typeof router.query.room_type === 'string'
            ? router.query.room_type
            : ''
      if (room) query.room_type = room

      void router.replace({ pathname: '/hotel-details', query })
      return
    }

    void router.replace('/')
  }, [router])

  return null
}
