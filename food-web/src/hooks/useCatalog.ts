import { useCallback, useEffect, useState } from 'react'
import type { Product, ProductListParams, PaginatedResponse } from '@/types'
import { catalogApi } from '@/services/api'
import { getUserFriendlyMessage } from '@/utils/apiError'

interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
}

export function useProducts(params: ProductListParams = {}) {
  const [state, setState] = useState<AsyncState<PaginatedResponse<Product>>>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
  })

  const load = useCallback(
    async (refreshing = false) => {
      setState((s) => ({
        ...s,
        isLoading: !refreshing && !s.data,
        isRefreshing: refreshing,
        error: null,
      }))
      try {
        const data = await catalogApi.getProducts(params)
        setState({ data, isLoading: false, isRefreshing: false, error: null })
      } catch (error) {
        setState((s) => ({
          ...s,
          isLoading: false,
          isRefreshing: false,
          error: getUserFriendlyMessage(error),
        }))
      }
    },
    // Serialize params for stable dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.page, params.pageSize, params.categoryId, params.search, params.sort],
  )

  useEffect(() => {
    void load(false)
  }, [load])

  return {
    products: state.data?.data ?? [],
    pagination: state.data,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    refresh: () => load(true),
  }
}

export function useProduct(productId: string | undefined) {
  const [state, setState] = useState<AsyncState<Product>>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
  })

  const load = useCallback(
    async (refreshing = false) => {
      if (!productId) {
        setState({ data: null, isLoading: false, isRefreshing: false, error: 'Product not found.' })
        return
      }
      setState((s) => ({
        ...s,
        isLoading: !refreshing,
        isRefreshing: refreshing,
        error: null,
      }))
      try {
        const data = await catalogApi.getProduct(productId)
        setState({ data, isLoading: false, isRefreshing: false, error: null })
      } catch (error) {
        setState({
          data: null,
          isLoading: false,
          isRefreshing: false,
          error: getUserFriendlyMessage(error),
        })
      }
    },
    [productId],
  )

  useEffect(() => {
    void load(false)
  }, [load])

  return {
    product: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refresh: () => load(true),
  }
}

export function useCategories() {
  const [state, setState] = useState<AsyncState<Awaited<ReturnType<typeof catalogApi.getCategories>>>>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
  })

  const load = useCallback(async (refreshing = false) => {
    setState((s) => ({
      ...s,
      isLoading: !refreshing && !s.data,
      isRefreshing: refreshing,
      error: null,
    }))
    try {
      const data = await catalogApi.getCategories()
      setState({ data, isLoading: false, isRefreshing: false, error: null })
    } catch (error) {
      setState((s) => ({
        ...s,
        isLoading: false,
        isRefreshing: false,
        error: getUserFriendlyMessage(error),
      }))
    }
  }, [])

  useEffect(() => {
    void load(false)
  }, [load])

  return {
    categories: state.data ?? [],
    isLoading: state.isLoading,
    error: state.error,
    refresh: () => load(true),
  }
}
