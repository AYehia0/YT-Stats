// creating the server using expressJs
const express = require('express')
const app = express()


// importing the functions from youtube
const youtube = require('./youtube')

// used port number
const PORT_NUM = 8008

// serving static files
app.use(express.static('public'))
app.use(express.json())

// Creating the routes to fetch the data from, need to install node-fetch
// get ordered list of best videos in the channel based on a number of range
app.post('/getOrderdVids', async (req, res) => {
    const data = req.body

    const id = data[0]
    const range = data[1]
    
    const topvids = await youtube.getMostWatched(id, range)
    const videoDetails = await youtube.getVideosInfo(topvids) 

    res.json({
        videoDetails: videoDetails,
        topVids: topvids
    })
})

// get the most latest watched vids in a range of vids
// example : 6 will get the best vid in the latest 6 vids
app.post('/getMostWatchedRange', async (req, res) => {
    const data = req.body

    const id = data[0]
    const range = data[1]

    const upId = await youtube.getUploadId(id)
    const searchedVids = await youtube.getLatestVideos(upId, range)
    const vidStats = await youtube.getVideosInfo(searchedVids) 
    const mostViewedInRange = youtube.getLastVideoWithInfo(vidStats)

    res.json({
        mostViewedInRange: mostViewedInRange
    })
})

// reads the channel name and return the ids
app.post('/readChannelNames', async (req, res) => {
    const channelIds = req.body
    const ids = await youtube.getChannelIds(channelIds)
    res.json({
        status: 'success',
        data: ids

    })
})


// listening to the server at the port number
app.listen(PORT_NUM, () => {
    console.log(`Server is running at ${PORT_NUM}`)
})

