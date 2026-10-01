async function getNamingConfig(config) {
  console.log(`Calling /api/v3/config/naming`)
  const endpoint = `${config.url}/api/v3/config/naming`
  const options = {
    headers: _getHeaders(config),
    method: 'GET'
  }

  try {
    const response = await fetch(endpoint, options)
    if (!response.ok) {
      throw new Error(`config arr naming: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    throw error
  }
}

async function getQueue(config) {
  console.log(`Calling /api/v3/queue`)
  const endpoint = `${config.url}/api/v3/queue`
  const options = {
    headers: _getHeaders(config),
    method: 'GET'
  }

  try {
    const response = await fetch(endpoint, options)
    if (!response.ok) {
      throw new Error(`queue arr: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    throw error
  }
}

async function getMovies(config) {
  console.log(`Calling /api/v3/movie`)
  const endpoint = `${config.url}/api/v3/movie`
  const options = {
    headers: _getHeaders(config),
    method: 'GET'
  }

  try {
    const response = await fetch(endpoint, options)
    if (!response.ok) {
      throw new Error(`movie arr: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    throw error
  }
}

async function getSeries(config) {
  console.log(`Calling /api/v3/series`)
  const endpoint = `${config.url}/api/v3/series`
  const options = {
    headers: _getHeaders(config),
    method: 'GET'
  }

  try {
    const response = await fetch(endpoint, options)
    if (!response.ok) {
      throw new Error(`series arr: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    throw error
  }
}

async function getEpisodes(config, seriesId) {
  console.log(`Calling /api/v3/episode?seriesId=${seriesId}`)
  const endpoint = `${config.url}/api/v3/episode?seriesId=${seriesId}`
  const options = {
    headers: _getHeaders(config),
    method: 'GET'
  }

  try {
    const response = await fetch(endpoint, options)
    if (!response.ok) {
      throw new Error(`episode arr: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    throw error
  }
}

async function getMovieByTmdb(config, tmdbId) {
  console.log(`Calling /api/v3/movie?tmdbId=${tmdbId}`)
  const endpoint = `${config.url}/api/v3/movie?tmdbId=${encodeURIComponent(tmdbId)}`
  const options = {
    headers: _getHeaders(config),
    method: 'GET'
  }

  const response = await fetch(endpoint, options)
  if (!response.ok) {
    throw new Error(`movie by tmdb arr: ${response.status}`)
  }
  const movies = await response.json()
  return movies?.[0] ?? null
}

async function getMovieImportHistory(config, movieId) {
  console.log(`Calling /api/v3/history/movie?movieId=${movieId}&eventType=downloadFolderImported`)
  const endpoint = `${config.url}/api/v3/history/movie?movieId=${encodeURIComponent(movieId)}&eventType=downloadFolderImported`
  const options = {
    headers: _getHeaders(config),
    method: 'GET'
  }

  const response = await fetch(endpoint, options)
  if (!response.ok) {
    throw new Error(`movie history arr: ${response.status}`)
  }
  return await response.json()
}

function _getHeaders(config) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': config.apiKey
  }
}

export default {
  getNamingConfig,
  getQueue,
  getMovies,
  getSeries,
  getEpisodes,
  getMovieByTmdb,
  getMovieImportHistory
}
