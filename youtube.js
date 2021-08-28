const fetch = require('node-fetch')
// important 
require('dotenv').config()

const API_KEY = process.env.API_KEY

// get the channel id if not provided
async function getChannelId(url){
    const response = await fetch(url)
    const data = await response.json()
    const id = data.items[0].snippet.channelId

    return id
}

// getting the channel_id 
async function getChannelIds(names){
    // GET https://youtube.googleapis.com/youtube/v3/search?part=snippet&q={}&type=channel&key=[YOUR_API_KEY] 
    // channel id starts with UC

    const ids = []
    for await (name of names){

        // channel may start with UC
        if (name.charAt(0) == '.'){
            ids.push(name.substring(1))
        }else{
            const getReqTemp = `https://youtube.googleapis.com/youtube/v3/search?part=id&part=snippet&channelType=any&q=${name}&key=${API_KEY}`
            const id =  await getChannelId(getReqTemp)
            ids.push(id)
        }
    }
    return ids
}

// getting upload_id 
async function getUploadId(chId){
    const getReqTemp = `https://www.googleapis.com/youtube/v3/channels?id=${chId}&key=${API_KEY}&part=contentDetails`

    const response = await fetch(getReqTemp)
    const data = await response.json()
    const uploadId = data.items[0].contentDetails.relatedPlaylists.uploads

    return uploadId

}

// getting latest N videos : need to search for views and sort manually 
async function getLatestVideos(upId, vidCount){

    const getReqTemp = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${upId}&key=${API_KEY}&part=snippet,contentDetails&maxResults=${vidCount}`
    const response = await fetch(getReqTemp)
    const data = await response.json()
    const videos = data.items

    return videos
}

// get a list of video_ids 
function getVideoIds(videos){

    const videoIds = []

    videos.forEach(vid => {
        try {
            const id = vid.contentDetails.videoId
            videoIds.push(id)
        }catch (error){
            const id = vid.id.videoId
            videoIds.push(id)
        }
    })

    return videoIds
}

// get the videos info by their ids 
async function getVideosInfo(videos){

    const ids = getVideoIds(videos).join(',')

    const getReqTemp = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${ids}&order=viewCount&key=${API_KEY}`
    const response = await fetch(getReqTemp)
    const data = await response.json()
    const details = data.items

    // sort 
    const sortedDict = {}

    for(var i=0; i<details.length; i++){
        sortedDict[details[i].statistics.viewCount] = details[i]
    }
    
   return sortedDict
}

// sorting
function getLastVideoWithInfo(videosDict){

    const lastVideo = videosDict[Object.keys(videosDict)[Object.keys(videosDict).length - 1]]

    return lastVideo
}

// return top N videos on the channel 
async function getMostWatched(chId, vidCount){
    // https://www.googleapis.com/youtube/v3/search?part=snippet&channelId={ch_id}&key={key}&maxResults=5&order=viewcount

    const getReqTemp = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${chId}&key=${API_KEY}&maxResults=${vidCount}&order=viewcount&type=video`
    const response = await fetch(getReqTemp)
    const data = await response.json()

    console.log(getReqTemp)
    const topVids = data.items

    return topVids
}

// exporting all functions 
module.exports = {
    getChannelIds,
    getUploadId,
    getLastVideoWithInfo,
    getVideosInfo,
    getLatestVideos,
    getMostWatched
}
