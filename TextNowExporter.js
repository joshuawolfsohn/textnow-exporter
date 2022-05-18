class TextNowExporter{
    constructor(limitDate){
        this.filesDownloaded = {}
        this.urlCommands = []
        this.queue = []
        this.limitDate = limitDate

        this.downloadConversations((new Date()).toISOString())

        setInterval(() => {
            this.processQueueItem()
        }, 500)
    }

    downloadConversations(updatedAt){
        console.log('Loading recent conversations from', updatedAt)

        const pageSize = 30 // This is the max that the API supports
        fetch('https://www.textnow.com/api/v3/conversations/recent?page_size=' + pageSize + '&updated_at=' + updatedAt)
        .then(response => response.json())
        .then(data => {
            const result = data.result
            
            let lastUpdatedAt
            let limitReached = false
            result.forEach((conversation) => {
                lastUpdatedAt = conversation.updated_at
                if(lastUpdatedAt < this.limitDate){
                    limitReached = true
                    return
                }

                const filename = conversation.contact_value + '.json'
                if(this.filesDownloaded[filename] === undefined){
                    this.downloadConversation(filename, conversation)
                }
            })

            if(
                result.length >= pageSize
                &&
                !limitReached
            ){
                this.downloadConversations(lastUpdatedAt)
            }
            else{
                this.finishedQueuingDownloads = true
            }
        })
    }

    async downloadConversation(filename, conversation){
        const json = JSON.parse(await fetch('https://www.textnow.com/api/users/' + conversation.username + '/messages?contact_value=' + conversation.contact_value + '&start_message_id=99999999999999&direction=past&page_size=9999999&get_archived=1')
            .then(response => response.text()))
        
        this.filesDownloaded[filename] = true
        this.queueDownload(filename, JSON.stringify(json, null, 2));
    
        json.messages.forEach((m) => {
            if(m.date < this.limitDate){
                return
            }

            const type = m.message_type
    
            let extension
            if(type == 1){
                // This is just a plain text message.  There is nothing else to download.
                return
            }
            else if(type === 2){
                extension = '.jpg'
            }
            else if(type === 3){
                extension = '.wav'
            }
            else if(type === 4 || type === 8){
                extension = m.message.split('.').pop()
                if(extension.length > 5){
                    // This isn't really an extension. The message must not have contained an extension.
                    extension = 'unknown'
                }

                extension = '.' + extension
            }
            else{
                console.log('Skipping unsupported message_type:', m)
            }
    
            const filename = m.id + extension
            this.urlCommands.push('curl "' + m.message + '" -o ' + filename)
            this.filesDownloaded[filename] = true
        })
    }
    
    queueDownload(filename, data){
        this.queue.push(() => {
            const blob = new Blob([data], {type: "octet/stream"})
            const imageUrl = window.URL.createObjectURL(blob)
            var tag = document.createElement('a');
            tag.href = imageUrl;
            tag.download = filename;
            document.body.appendChild(tag);
            tag.click();
            document.body.removeChild(tag);
            window.URL.revokeObjectURL(imageUrl);
        })
    }

    processQueueItem(){
        if(this.queue.length === 0){
            if(!this.finishedQueuingDownloads || this.queueStopped){
                return
            }
            
            const fileDownloadFilename = 'download-textnow-files.sh'
            this.queueDownload(fileDownloadFilename, this.urlCommands.join("\n"))

            const fileListFilename = 'textnow-export-file-list.txt'
            this.queueDownload(fileListFilename, Object.keys(this.filesDownloaded).join("\n"))
            
            console.log('Finished processing conversations')
            console.log('Once the downloads finish, run ' + fileDownloadFilename + ', then make sure all the files listed in ' + fileListFilename + ' were successfully downloaded.')

            this.queueStopped = true
        }

        // console.log('Remaining files to download: ' + this.queue.length)
        const item = this.queue.pop()
        item()
    }
}

new TextNowExporter('2022-05-12')