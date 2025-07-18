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

function _getHeaders(config) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': config.apiKey
  }
}

export default {
  getNamingConfig
}
