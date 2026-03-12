import arrApi from '../api/arrApi.js'

class ArrService {
  constructor(config) {
    this.config = config
  }

  async getQueue() {
    const queue = await arrApi.getQueue(this.config)

    return queue.records.map((item) => ({
      title: item.title,
      status: item.status,
      isDownloading: item.trackedDownloadState === 'downloading',
      errorMessage: item.errorMessage,
      added: item.added
    }))
  }
}

export default ArrService
