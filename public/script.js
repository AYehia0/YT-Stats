// getting elements 
const inputText = document.getElementById('textFile')
const submitBtn = document.getElementById('submit-btn')

//console.log(keys)

function getYoutubeLinks(text){
    
    const validUrls = []
    // splitting 
    let lines = text.split('\n')
    lines.forEach(line => {
        if (line.includes('youtube')){
            validUrls.push(line)
        }
    })
    return validUrls
}

// returning a list of all channel names 
function getChannelNames(urls) {

    const chNames = []
    urls.forEach(url => {
        let splittedUrl = url.split('/')
        let idn = splittedUrl[splittedUrl.length - 2]

        if (idn == 'channel'){
            chNames.push("." + splittedUrl[splittedUrl.length - 1])
        }else{
            chNames.push(splittedUrl[splittedUrl.length - 1])
        }
    })

    return chNames
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

// make a post request to the server side 
async function sendToApi(route, data){
    
    const options = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
            },
        body: JSON.stringify(data)
    }

    const res = await fetch(route, options)

    return res
}

function getLastVideoWithInfo(videosDict){
    const lastVideo = videosDict[Object.keys(videosDict)[Object.keys(videosDict).length - 1]]
    return lastVideo
}

function createTable(vidData, views=false) {

    const channelId = vidData[0].channel
    const channelUrl = `https://www.youtube.com/channel/${channelId}`
    const channelTitle = vidData[0].channelTitle

    // finding the result area
    const resultArea = document.querySelector('.result')

    // cleaning the html 
    resultArea.innerHTML = ""

    const tableTemp = `        
        <h2>Channels</h2>
            <tr>
                <th>ChannelUrl</th>
                <th>ChannelName</th>
                <th>VideoUrl</th>
                <th>Title</th>
                <th>UploadTime</th>
                <th>ViewsCount</th>
            </tr>
    `
    // creating the table 
    let tableEl = document.createElement('table')
    let channelHtmlId = `vid-table-${channelId}`
    tableEl.setAttribute("id", channelHtmlId)
    tableEl.innerHTML = tableTemp
    resultArea.appendChild(tableEl)

    vidData.forEach(item => {
       
        const fullUrl = `https://www.youtube.com/watch?v=${item.id}`
        
        const channelUrl = `https://www.youtube.com/channel/${item.channel}`
        let rowEl = document.createElement('tr')
        const row = `
            <td><a href="${channelUrl}">${item.channelTitle}</a></td>
            <td>${item.channelTitle}</td>
            <td><a href="${fullUrl}">${item.title}</a></td>
            <td>${item.title}</td>
            <td>${item.time}</td>
            <td>${item.views}</td>
       ` 
       rowEl.innerHTML = row
       //appending 
       tableEl.appendChild(rowEl)
    })
    
}

// getting selected value of the list-features
const listFeatures = document.querySelector("#features-list")


// watch url : https://www.youtube.com/watch?v=

// checking if the submit button is clicked
submitBtn.addEventListener('click', (e) => {
    e.preventDefault()

    // checking the file
    var file = inputText.files[0]
    if (file){

        let fileHandler = new FileReader()

        // read the file 
        fileHandler.onload = async function(e) {

            output = e.target.result

            const urls = getYoutubeLinks(output)
            const names = getChannelNames(urls)

            // pass the names to the server side to be processed
            // post request : https://www.youtube.com/watch?v=Kw5tC5nQMRY
            const res = await sendToApi('/readChannelNames', names)
            const data = await res.json()

            // getting the ids
            const ids = data.data

            // selected feature
            const selectedFeature = listFeatures.selectedIndex

            // Get best video in range N
            if (selectedFeature == 0){
                // getting all vids : looping through the ids
                // getting the range 
                const rangeValue  = document.querySelector("#range").value

                const videoData = []
                for(id of ids) {
                    // temp to hold id,time and title

                    // getting top vids
                    // calling the server api for that : /getOrderedVids
                    const res = await sendToApi('/getOrderdVids', [id, rangeValue])
                    const vidData = await res.json()

                    console.log(vidData)
                    const videoDetails = vidData.videoDetails
                    const topVids = vidData.topVids
                    
                    const viewsTotal = Object.keys(videoDetails).reverse()
                    
                    // getting data of vids
                    for( const [ind, item] of topVids.entries()){
                        const vidId = item.id.videoId
                        const publishedTime = item.snippet.publishedAt
                        const title = item.snippet.title
                        const chId = item.snippet.channelId
                        const chTitle = item.snippet.channelTitle

                        videoData.push({
                            id: vidId,
                            channel: chId,
                            time: publishedTime,
                            title: title,
                            channelTitle: chTitle,
                            views: viewsTotal[ind]
                            })
                        }
                    // adding to html 
                createTable(videoData)

                }

            }else{
                
                // get upload ids
                const uploadIds = []
                const data = []
                for(id of ids){
                    const rangeValue  = document.querySelector("#range").value
                    const res = await sendToApi('/getMostWatchedRange', [id, rangeValue])
                    
                    const dataApi = await res.json()
                    const mostViewedInRange = dataApi.mostViewedInRange
                    //getting info
                    const vidId = mostViewedInRange.id
                    const chId = mostViewedInRange.snippet.channelId
                    const time = mostViewedInRange.snippet.publishedAt
                    const title = mostViewedInRange.snippet.title
                    const viewsCount = mostViewedInRange.statistics.viewCount
                    const chTitle = mostViewedInRange.snippet.channelTitle

                    data.push({
                        channel : chId,
                        id : vidId,
                        time: time,
                        title: title,
                        channelTitle:chTitle,
                        views: viewsCount
                    })

                }
                // create a table
                createTable(data)
              }
            // exporting 
            const exportBtns = document.querySelectorAll('#export-btn')

            exportBtns.forEach(exportBtn => {
                exportBtn.addEventListener('click', (e) => {
                    e.preventDefault()
                    // getting the table id 
                    const tableId = exportBtn.closest('table').getAttribute('id')
                    download_table_as_csv(tableId)
                })
            })

            // adding download all button
            // checking if exists 
            if (!document.getElementById('download-all')){

                const downloadAll = document.createElement('button')
                downloadAll.innerText = "ExportAll"
                downloadAll.id = "download-all"
                document.body.appendChild(downloadAll)

                // adding eventlistener
                document.getElementById('download-all').addEventListener('click', (e) => {
                    e.preventDefault()
                    download_all_tables()
                })
    
            }
       }
        fileHandler.readAsText(file)

    }
})

// download all 
function download_all_tables(separator = ',') {

    // Select rows from table_id
    var rows = document.querySelectorAll('tr');

    // Construct csv
	// adding the headersvar 
	var csv = [];
	var firstHeaders = document.querySelector('tr').getElementsByTagName('th')
	var firstRow = []
    for (var i=0; i<firstHeaders.length; i++){
        var data1 = firstHeaders[i].innerText
		firstRow.push('"' + data1 + '"');
    }

	csv.push(firstRow.join(separator))
    for (var i = 0; i < rows.length; i++) {
        var row = [], cols = rows[i].querySelectorAll('td');
        for (var j = 0; j < cols.length; j++) {
            
            var data = ""
			if (cols[j].firstElementChild){
                data = cols[j].firstElementChild.href
            }else{
               var data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ') 
            }

            data = data.replace(/"/g, '""');
			row.push('"' + data + '"');
            
        }
		if (row){
            csv.push(row.join(separator));
        }
        
    }
	csv = csv.filter(e => e)
    var csv_string = csv.join('\n');
    // Download it
    var filename = 'export' + '_' + new Date().toLocaleDateString() + '.csv';
    var link = document.createElement('a');

    link.style.display = 'none';
    link.setAttribute('target', '_blank');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.addEventListener('click', e => {
        e.preventDefault()
    })
    document.body.removeChild(link);
}

// Thank you stackoverflow :D
function download_table_as_csv(table_id, separator = ',') {

    // Select rows from table_id
    var rows = document.querySelectorAll('table#' + table_id + ' tr');

    // Construct csv
    var csv = [];
    for (var i = 0; i < rows.length; i++) {
        var row = [], cols = rows[i].querySelectorAll('td, th');
        for (var j = 0; j < cols.length; j++) {
            
            var data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ')

            data = data.replace(/"/g, '""');
            
            row.push('"' + data + '"');
        }
        csv.push(row.join(separator));
    }
    var csv_string = csv.join('\n');
    // Download it
    var filename = 'export_' + table_id + '_' + new Date().toLocaleDateString() + '.csv';
    var link = document.createElement('a');

    link.style.display = 'none';
    link.setAttribute('target', '_blank');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.addEventListener('click', e => {
        e.preventDefault()
    })
    document.body.removeChild(link);
}

