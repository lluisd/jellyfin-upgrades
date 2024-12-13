import { config } from '../config.js'
import { Jellyfin } from '@jellyfin/sdk'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api.js'
import { getItemUpdateApi } from '@jellyfin/sdk/lib/utils/api/item-update-api.js'
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/index.js'
import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models/index.js'
import {getLibraryApi} from "@jellyfin/sdk/lib/utils/api/index.js";

const jellyfin = new Jellyfin({
    clientInfo: {
        name: 'Jellyfin upgrader',
        version: '1.0.0'
    },
    deviceInfo: {
        name: 'upgrade',
        id: 'dockerupgradeid'
    }
});

const api = jellyfin.createApi(config.jellyfin.url, config.jellyfin.apiKey);

async function getMovies(hasLimit = false) {
    try {
        const options = {
            isMovie: true,
            parentId: config.jellyfin.libraryId,
            fields: [ItemFields.DateCreated, ItemFields.OriginalTitle, ItemFields.ProviderIds, ItemFields.Path],
            sortBy: [ItemSortBy.DateCreated],
            sortOrder: SortOrder.Descending,
            hasTmdbId: true
        };

        if (hasLimit) {
            options.limit = 100;
        }

        await getLibraryApi(api).postUpdatedMovies
        const result = await getItemsApi(api).getItems(options)
        return result.data
    } catch (error) {
        throw new Error(`Error getting movies from Jellyfin: ${error}`)
    }
}

async function getMovie(id) {
    try {
        const result = await getItemsApi(api).getItems(
            {
                ids: [id],
                isMovie: true,
                parentId:  config.jellyfin.libraryId,
                fields: [ItemFields.AirTime, ItemFields.CanDelete, ItemFields.CanDownload, ItemFields.ChannelInfo, ItemFields.Chapters,
                    ItemFields.Trickplay, ItemFields.ChildCount, ItemFields.CumulativeRunTimeTicks, ItemFields.CustomRating, ItemFields.DateCreated,
                    ItemFields.DateLastMediaAdded, ItemFields.DisplayPreferencesId, ItemFields.Etag, ItemFields.ExternalUrls, ItemFields.Genres,
                    ItemFields.HomePageUrl, ItemFields.ItemCounts, ItemFields.MediaSourceCount, ItemFields.MediaSources, ItemFields.OriginalTitle,
                    ItemFields.Overview, ItemFields.ParentId, ItemFields.Path, ItemFields.People, ItemFields.PlayAccess, ItemFields.ProductionLocations,
                    ItemFields.ProviderIds, ItemFields.PrimaryImageAspectRatio, ItemFields.RecursiveItemCount, ItemFields.Settings,  ItemFields.ScreenshotImageTags,
                    ItemFields.SeriesPrimaryImage, ItemFields.SeriesStudio, ItemFields.SortName, ItemFields.SpecialEpisodeNumbers, ItemFields.Studios,
                    ItemFields.Taglines, ItemFields.Tags, ItemFields.RemoteTrailers, ItemFields.MediaStreams, ItemFields.SeasonUserData, ItemFields.ServiceName,
                    ItemFields.ThemeSongIds, ItemFields.ThemeVideoIds, ItemFields.ExternalEtag, ItemFields.PresentationUniqueKey, ItemFields.InheritedParentalRatingValue,
                    ItemFields.ExternalSeriesId, ItemFields.SeriesPresentationUniqueKey, ItemFields.DateLastRefreshed, ItemFields.DateLastSaved, ItemFields.RefreshState,
                    ItemFields.ChannelImage, ItemFields.EnableMediaSourceDisplay, ItemFields.Width, ItemFields.Height, ItemFields.ExtraIds, ItemFields.LocalTrailerCount,
                    ItemFields.IsHd, ItemFields.SpecialFeatureCount]
            });

        return result.data
    } catch (error) {
        throw new Error(`Error getting movie from Jellyfin: ${error}`)
    }

}

async function updateMovie(movie) {
    try {
        const result = await getItemUpdateApi(api).updateItem(
            {
                itemId: movie.Id,
                baseItemDto: movie
            });
        return result.data
    } catch (error) {
        throw new Error(`Error updating movie on Jellyfin: ${error}`)
    }

}

export default  {
    getMovies,
    getMovie,
    updateMovie
}
