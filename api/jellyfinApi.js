import { config } from '../config.js'
import { Jellyfin } from '@jellyfin/sdk'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api.js'
import { getItemUpdateApi } from '@jellyfin/sdk/lib/utils/api/item-update-api.js'
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/index.js'
import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models/index.js'
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/index.js'

const jellyfin = new Jellyfin({
  clientInfo: {
    name: 'Jellyfin upgrader',
    version: '1.0.0'
  },
  deviceInfo: {
    name: 'upgrade',
    id: 'dockerupgradeid'
  }
})

const api = jellyfin.createApi(config.jellyfin.url, config.jellyfin.apiKey)

async function getLibrariesIds() {
  try {
    const options = {
      includeItemTypes: ['Folder'],
      recursive: false
    }

    const libraries = await getItemsApi(api).getItems(options)
    return libraries.data
  } catch (error) {
    throw new Error(`Error getting libraries from Jellyfin: ${error}`)
  }
}

async function getMovies(hasLimit = false) {
  try {
    const options = {
      isMovie: true,
      parentId: config.jellyfin.moviesLibraryId,
      includeItemTypes: ['Movie'],
      fields: [
        ItemFields.DateCreated,
        ItemFields.OriginalTitle,
        ItemFields.ProviderIds,
        ItemFields.Path,
        ItemFields.MediaSources
      ],
      sortBy: [ItemSortBy.DateCreated],
      sortOrder: SortOrder.Descending,
      hasTmdbId: true
    }

    if (hasLimit) {
      options.limit = 100
    }

    const result = await getItemsApi(api).getItems(options)
    return result.data
  } catch (error) {
    throw new Error(`Error getting movies from Jellyfin: ${error}`)
  }
}

async function getMoviesWithMediaStreams() {
  try {
    const options = {
      isMovie: true,
      parentId: config.jellyfin.moviesLibraryId,
      includeItemTypes: ['Movie'],
      fields: [ItemFields.MediaStreams]
    }

    const result = await getItemsApi(api).getItems(options)
    return result.data
  } catch (error) {
    throw new Error(`Error getting movies with mediastreams from Jellyfin: ${error}`)
  }
}

async function getTVShows() {
  try {
    const options = {
      IsSeries: true,
      includeItemTypes: ['Series'],
      parentId: config.jellyfin.seriesLibraryId
    }

    const result = await getItemsApi(api).getItems(options)
    return result.data
  } catch (error) {
    throw new Error(`Error getting series from Jellyfin: ${error}`)
  }
}

async function getEpisodesWithMediaStreams(serieId) {
  try {
    const options = {
      seriesId: serieId,
      fields: [ItemFields.MediaStreams]
    }

    const result = await getTvShowsApi(api).getEpisodes(options)
    return result.data
  } catch (error) {
    throw new Error(`Error getting episodes from Jellyfin: ${error}`)
  }
}

async function getEpisodes(serieId) {
  try {
    const options = {
      seriesId: serieId,
      fields: [
        ItemFields.DateCreated,
        ItemFields.OriginalTitle,
        ItemFields.ProviderIds,
        ItemFields.Path,
        ItemFields.MediaSources
      ]
    }
    const result = await getTvShowsApi(api).getEpisodes(options)
    return result.data
  } catch (error) {
    throw new Error(`Error getting episodes from Jellyfin: ${error}`)
  }
}

async function getMovie(id) {
  try {
    const result = await getItemsApi(api).getItems({
      ids: [id],
      isMovie: true,
      includeItemTypes: ['Movie'],
      parentId: config.jellyfin.moviesLibraryId,
      fields: [
        ItemFields.AirTime,
        ItemFields.CanDelete,
        ItemFields.CanDownload,
        ItemFields.ChannelInfo,
        ItemFields.Chapters,
        ItemFields.Trickplay,
        ItemFields.ChildCount,
        ItemFields.CumulativeRunTimeTicks,
        ItemFields.CustomRating,
        ItemFields.DateCreated,
        ItemFields.DateLastMediaAdded,
        ItemFields.DisplayPreferencesId,
        ItemFields.Etag,
        ItemFields.ExternalUrls,
        ItemFields.Genres,
        ItemFields.HomePageUrl,
        ItemFields.ItemCounts,
        ItemFields.MediaSourceCount,
        ItemFields.MediaSources,
        ItemFields.OriginalTitle,
        ItemFields.Overview,
        ItemFields.ParentId,
        ItemFields.Path,
        ItemFields.People,
        ItemFields.PlayAccess,
        ItemFields.ProductionLocations,
        ItemFields.ProviderIds,
        ItemFields.PrimaryImageAspectRatio,
        ItemFields.RecursiveItemCount,
        ItemFields.Settings,
        ItemFields.ScreenshotImageTags,
        ItemFields.SeriesPrimaryImage,
        ItemFields.SeriesStudio,
        ItemFields.SortName,
        ItemFields.SpecialEpisodeNumbers,
        ItemFields.Studios,
        ItemFields.Taglines,
        ItemFields.Tags,
        ItemFields.RemoteTrailers,
        ItemFields.MediaStreams,
        ItemFields.SeasonUserData,
        ItemFields.ServiceName,
        ItemFields.ThemeSongIds,
        ItemFields.ThemeVideoIds,
        ItemFields.ExternalEtag,
        ItemFields.PresentationUniqueKey,
        ItemFields.InheritedParentalRatingValue,
        ItemFields.ExternalSeriesId,
        ItemFields.SeriesPresentationUniqueKey,
        ItemFields.DateLastRefreshed,
        ItemFields.DateLastSaved,
        ItemFields.RefreshState,
        ItemFields.ChannelImage,
        ItemFields.EnableMediaSourceDisplay,
        ItemFields.Width,
        ItemFields.Height,
        ItemFields.ExtraIds,
        ItemFields.LocalTrailerCount,
        ItemFields.IsHd,
        ItemFields.SpecialFeatureCount
      ]
    })

    return result.data
  } catch (error) {
    throw new Error(`Error getting movie from Jellyfin: ${error}`)
  }
}

async function updateItem(item) {
  try {
    const result = await getItemUpdateApi(api).updateItem({
      itemId: item.Id,
      baseItemDto: item
    })
    return result.data
  } catch (error) {
    throw new Error(`Error updating item on Jellyfin: ${error}`)
  }
}

async function getEpisode(id) {
  try {
    const result = await getItemsApi(api).getItems({
      ids: [id],
      parentId: config.jellyfin.seriesLibraryId,
      includeItemTypes: ['Episode'],
      mediaTypes: [ItemFields.Video],
      fields: [
        ItemFields.AirTime,
        ItemFields.CanDelete,
        ItemFields.CanDownload,
        ItemFields.ChannelInfo,
        ItemFields.Chapters,
        ItemFields.Trickplay,
        ItemFields.ChildCount,
        ItemFields.CumulativeRunTimeTicks,
        ItemFields.CustomRating,
        ItemFields.DateCreated,
        ItemFields.DateLastMediaAdded,
        ItemFields.DisplayPreferencesId,
        ItemFields.Etag,
        ItemFields.ExternalUrls,
        ItemFields.Genres,
        ItemFields.HomePageUrl,
        ItemFields.ItemCounts,
        ItemFields.MediaSourceCount,
        ItemFields.MediaSources,
        ItemFields.OriginalTitle,
        ItemFields.Overview,
        ItemFields.ParentId,
        ItemFields.Path,
        ItemFields.People,
        ItemFields.PlayAccess,
        ItemFields.ProductionLocations,
        ItemFields.ProviderIds,
        ItemFields.PrimaryImageAspectRatio,
        ItemFields.RecursiveItemCount,
        ItemFields.Settings,
        ItemFields.ScreenshotImageTags,
        ItemFields.SeriesPrimaryImage,
        ItemFields.SeriesStudio,
        ItemFields.SortName,
        ItemFields.SpecialEpisodeNumbers,
        ItemFields.Studios,
        ItemFields.Taglines,
        ItemFields.Tags,
        ItemFields.RemoteTrailers,
        ItemFields.MediaStreams,
        ItemFields.SeasonUserData,
        ItemFields.ServiceName,
        ItemFields.ThemeSongIds,
        ItemFields.ThemeVideoIds,
        ItemFields.ExternalEtag,
        ItemFields.PresentationUniqueKey,
        ItemFields.InheritedParentalRatingValue,
        ItemFields.ExternalSeriesId,
        ItemFields.SeriesPresentationUniqueKey,
        ItemFields.DateLastRefreshed,
        ItemFields.DateLastSaved,
        ItemFields.RefreshState,
        ItemFields.ChannelImage,
        ItemFields.EnableMediaSourceDisplay,
        ItemFields.Width,
        ItemFields.Height,
        ItemFields.ExtraIds,
        ItemFields.LocalTrailerCount,
        ItemFields.IsHd,
        ItemFields.SpecialFeatureCount
      ]
    })

    return result.data
  } catch (error) {
    throw new Error(`Error getting episode from Jellyfin: ${error}`)
  }
}

export default {
  getMovies,
  getMovie,
  updateItem,
  getMoviesWithMediaStreams,
  getTVShows,
  getEpisodesWithMediaStreams,
  getLibrariesIds,
  getEpisode,
  getEpisodes
}
