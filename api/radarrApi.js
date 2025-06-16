import { config } from '../config.js'

async function getNamingConfig() {
  console.log(`Calling /api/v3/config/naming`)
  const endpoint = `${config.radarr.url}/api/v3/config/naming`
  const options = {
    headers: _getHeaders(),
    method: 'GET'
  }

  try {
    const response = await fetch(endpoint, options)
    if (!response.ok) {
      throw new Error(`config radarr naming: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    throw error
  }
}

function _getHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': config.radarr.apiKey
  }
}

export default {
  getNamingConfig
}
