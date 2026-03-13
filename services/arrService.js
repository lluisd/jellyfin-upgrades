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
      state: item.trackedDownloadState,
      isDownloading: item.trackedDownloadState === 'downloading',
      added: item.added
    }))
  }
}

export default ArrService
